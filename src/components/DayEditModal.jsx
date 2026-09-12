import React, { useState, useEffect } from 'react';
import { LEAVE_TYPES } from '../services/leaveService';
import { calculateExceptionStats, canSelectPersonalExigency, EXCEPTION_TYPES } from '../services/exceptionService';
import { calculateCompOffBalances, canSelectCompOff } from '../services/compOffService';

const DayEditModal = ({ dayData, leaveBalances, asOfDate, calendarData, compOffSettings, onSave, onClose }) => {
  const [status, setStatus] = useState(dayData?.status || 'EMPTY');
  const [time, setTime] = useState(dayData?.time || 0);
  const [leaveCategory, setLeaveCategory] = useState(dayData?.leaveCategory || '');
  const [leaveDuration, setLeaveDuration] = useState(dayData?.leaveDuration ?? 1.0);
  const [earnedCompOff, setEarnedCompOff] = useState(dayData?.earnedCompOff ?? false);

  // Exception category state ('PE', 'COMP_OFF', or 'OTHER')
  const excStats = calculateExceptionStats(calendarData, dayData?.date);
  const canSelectPE = canSelectPersonalExigency(calendarData, dayData?.date, dayData);
  const compOffStats = calculateCompOffBalances(compOffSettings, calendarData);
  const canSelectCO = canSelectCompOff(compOffSettings, calendarData, dayData?.date, dayData);

  const getDefaultExceptionCategory = () => {
    if (canSelectPE) return 'PE';
    if (canSelectCO) return 'COMP_OFF';
    return 'OTHER';
  };

  const [exceptionCategory, setExceptionCategory] = useState(
    dayData?.exceptionCategory || getDefaultExceptionCategory()
  );

  useEffect(() => {
    if (dayData) {
      setStatus(dayData.status);
      setTime(dayData.time || 0);
      setLeaveCategory(dayData.leaveCategory || '');
      setLeaveDuration(dayData.leaveDuration ?? 1.0);
      setEarnedCompOff(dayData.earnedCompOff ?? false);
      setExceptionCategory(dayData.exceptionCategory || getDefaultExceptionCategory());
    }
  }, [dayData]);

  // Determine if time input should be disabled
  const isTimeDisabled = () => {
    return status === 'NO SHOW' || status === 'LEAVE' || status === 'EXCEPTION';
  };

  const isHistorical = asOfDate && dayData?.date && dayData.date < asOfDate;

  // Calculate effective balance for validation (refund current day's deduction if already using it and not historical)
  const getEffectiveAvailable = (catCode) => {
    let avail = leaveBalances?.[catCode]?.available ?? 0;
    if (!isHistorical && dayData?.status === 'LEAVE' && dayData?.leaveCategory === catCode) {
      avail += (parseFloat(dayData?.leaveDuration) || 1.0);
    }
    return avail;
  };

  const handleSave = () => {
    const timeValue = isTimeDisabled() ? null : parseInt(time) || 0;
    onSave({
      date: dayData.date,
      status,
      time: timeValue,
      leaveCategory: status === 'LEAVE' ? (leaveCategory || null) : null,
      leaveDuration: status === 'LEAVE' ? (leaveCategory === 'FL' ? 1.0 : parseFloat(leaveDuration) || 1.0) : null,
      exceptionCategory: status === 'EXCEPTION' ? (exceptionCategory || 'PE') : null,
      earnedCompOff: (status === 'HOLIDAY' || status === 'WEEKEND') ? earnedCompOff : false
    });
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    
    // Clear time if switching to a status that doesn't allow time
    if (newStatus === 'NO SHOW' || newStatus === 'LEAVE' || newStatus === 'EXCEPTION') {
      setTime(0);
    }
    if (newStatus === 'EXCEPTION' && !exceptionCategory) {
      setExceptionCategory(getDefaultExceptionCategory());
    }
  };

  const handleLeaveCategoryChange = (e) => {
    const newCat = e.target.value;
    setLeaveCategory(newCat);
    if (newCat === 'FL') {
      setLeaveDuration(1.0);
    }
  };

  // Handle time change - auto-switch to SHOW if typing in time when status is EMPTY
  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    
    // If status is EMPTY and time is being entered (changed from 0), switch to SHOW
    if (status === 'EMPTY' && parseInt(newTime) > 0) {
      setStatus('SHOW');
    }
  };

  // Handle clear status button - reset to EMPTY
  const handleClearStatus = () => {
    setStatus('EMPTY');
    setTime(0);
    setLeaveCategory('');
    setLeaveDuration(1.0);
    setExceptionCategory('PE');
  };

  // Handle add status button - show dropdown by setting a default status
  const handleAddStatus = () => {
    setStatus('NO SHOW');
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-gray-800 rounded-xl p-5 md:p-6 w-full max-w-md shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Day</h2>
        
        {/* Date Display */}
        <div className="mb-4 bg-gray-700/50 p-2.5 rounded-lg border border-gray-600/50">
          <p className="text-gray-200 font-medium text-sm">{formatDate(dayData.date)}</p>
          {isHistorical && status === 'LEAVE' && (
            <p className="text-[11px] text-amber-400 mt-0.5">
              📅 Historical date (on or before baseline date — does not deduct from balances).
            </p>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Status
          </label>
          {status === 'EMPTY' ? (
            <button
              onClick={handleAddStatus}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              Add Status
            </button>
          ) : (
            <div className="flex gap-2">
              {status !== 'SHOW' ? (
                <select
                  value={status}
                  onChange={handleStatusChange}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="NO SHOW">No Show</option>
                  <option value="LEAVE">Leave</option>
                  <option value="EXCEPTION">Exception</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="WEEKEND">Weekend</option>
                </select>
              ) : (
                <div className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg flex items-center text-sm font-semibold">SHOW</div>
              )}
              <button
                onClick={handleClearStatus}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm"
                title="Clear status (set to EMPTY)"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Leave Details (when status is LEAVE) */}
        {status === 'LEAVE' && (
          <div className="mb-5 bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-lg space-y-3.5">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Leave Details
            </h3>

            {/* Leave Category Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Leave Type
              </label>
              <select
                value={leaveCategory}
                onChange={handleLeaveCategoryChange}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              >
                <option value="">Unassigned / Generic Leave</option>
                {Object.keys(LEAVE_TYPES).map((code) => {
                  const type = LEAVE_TYPES[code];
                  const effAvail = getEffectiveAvailable(code);
                  const currentRemaining = leaveBalances?.[code]?.available ?? 0;
                  const isExhausted = !isHistorical && effAvail < 0.5;

                  return (
                    <option
                      key={code}
                      value={code}
                      disabled={isExhausted}
                      className={isExhausted ? 'text-gray-500 bg-gray-800' : ''}
                    >
                      {type.name} ({type.code}) — {isHistorical ? 'Historical' : `${currentRemaining} remaining`}{isExhausted ? ' (Exhausted)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Leave Duration (Full Day vs Half Day) */}
            {leaveCategory && (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Duration
                </label>
                {leaveCategory === 'FL' ? (
                  <div className="text-xs text-gray-300 bg-gray-800/80 px-3 py-2 rounded border border-gray-700">
                    Full Day (1.0 day) <span className="text-gray-400 text-[11px] ml-1">— Flexi Leave has no half-day option</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const effAvail = getEffectiveAvailable(leaveCategory);
                      const isFullDisabled = !isHistorical && effAvail < 1.0;
                      const isHalfDisabled = !isHistorical && effAvail < 0.5;

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => setLeaveDuration(1.0)}
                            disabled={isFullDisabled}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                              leaveDuration === 1.0
                                ? 'bg-amber-600 text-white border-amber-500'
                                : isFullDisabled
                                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                                : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650'
                            }`}
                          >
                            Full Day (1.0)
                            {isFullDisabled && <span className="block text-[10px] text-red-400">Needs 1.0</span>}
                          </button>

                          <button
                            type="button"
                            onClick={() => setLeaveDuration(0.5)}
                            disabled={isHalfDisabled}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                              leaveDuration === 0.5
                                ? 'bg-amber-600 text-white border-amber-500'
                                : isHalfDisabled
                                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                                : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-650'
                            }`}
                          >
                            Half Day (0.5)
                            {isHalfDisabled && <span className="block text-[10px] text-red-400">Needs 0.5</span>}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Comp Off Earning (when status is HOLIDAY or WEEKEND) */}
        {(status === 'HOLIDAY' || status === 'WEEKEND') && (
          <div className="mb-5 bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-lg">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={earnedCompOff}
                onChange={(e) => setEarnedCompOff(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded bg-gray-700 border-gray-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-semibold text-emerald-400">
                  Worked for Comp Off (+1 day)
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Increments available Comp Off counter. Displays as{' '}
                  <strong>{status === 'HOLIDAY' ? 'Holiday (CO)' : 'Weekend (CO)'}</strong> on the calendar.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Exception Details (when status is EXCEPTION) */}
        {status === 'EXCEPTION' && (
          <div className="mb-5 bg-orange-950/20 border border-orange-500/30 p-3.5 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                Exception Details
              </h3>
              <span className="text-[11px] text-orange-300 font-medium">
                {exceptionCategory === 'COMP_OFF'
                  ? `${compOffStats.available} Comp Off days left`
                  : `${excStats.quarterCode}: ${excStats.available} / ${excStats.quota} WFH left`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Exception Category
              </label>
              <select
                value={exceptionCategory}
                onChange={(e) => setExceptionCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option
                  value="PE"
                  disabled={!canSelectPE}
                  className={!canSelectPE ? 'text-gray-500 bg-gray-800' : ''}
                >
                  Personal Exigency (WFH) — {excStats.available} / {excStats.quota} left in {excStats.quarterCode}{!canSelectPE ? ' (Exhausted)' : ''}
                </option>
                <option
                  value="COMP_OFF"
                  disabled={!canSelectCO}
                  className={!canSelectCO ? 'text-gray-500 bg-gray-800' : ''}
                >
                  Comp Off — {compOffStats.available} available{!canSelectCO ? ' (Exhausted)' : ''}
                </option>
                <option value="OTHER">
                  Other Exception (Uncapped / Special Approval)
                </option>
              </select>
            </div>

            {exceptionCategory === 'PE' && (
              <p className="text-[11px] text-orange-300/80">
                🏷️ Displays as <strong>WFH</strong> on the calendar cell. Quota: {excStats.quota} per quarter (no carry forward).
              </p>
            )}
            {exceptionCategory === 'COMP_OFF' && (
              <p className="text-[11px] text-emerald-300/90">
                🏷️ Displays as <strong>Comp Off</strong> on the calendar cell. Deducts 1 day from available Comp Off balance.
              </p>
            )}
            {exceptionCategory === 'OTHER' && (
              <p className="text-[11px] text-gray-400">
                🏷️ Displays as <strong>Other</strong> on the calendar cell. Uncapped special exception.
              </p>
            )}
          </div>
        )}

        {/* Time Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            Time (minutes)
          </label>
          <input
            type="number"
            value={time}
            onChange={handleTimeChange}
            disabled={isTimeDisabled()}
            min="0"
            max="1440"
            className={`
              w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm
              ${isTimeDisabled() 
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-700' 
                : 'bg-gray-700 text-white border border-gray-600'}
            `}
          />
          {!isTimeDisabled() && (
            <p className="text-xs text-gray-400 mt-1">
              {Math.floor(time / 60)}h {time % 60}m
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEditModal;
