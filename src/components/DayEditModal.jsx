import React, { useState, useEffect } from 'react';
import { LEAVE_TYPES } from '../services/leaveService';
import { calculateExceptionStats, canSelectPersonalExigency } from '../services/exceptionService';
import { calculateCompOffBalances, canSelectCompOff } from '../services/compOffService';
import { IconPlus, IconClose } from './Icons';

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

  // Calculate effective balance for validation
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

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (status === 'EMPTY' && parseInt(newTime) > 0) {
      setStatus('SHOW');
    }
  };

  const handleClearStatus = () => {
    setStatus('EMPTY');
    setTime(0);
    setLeaveCategory('');
    setLeaveDuration(1.0);
    setExceptionCategory('PE');
  };

  const handleAddStatus = () => {
    setStatus('NO SHOW');
  };

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-[#141720] rounded-t-2xl sm:rounded-2xl p-5 md:p-6 w-full sm:max-w-md shadow-2xl border border-white/[0.08] max-h-[90vh] max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden drawer-handle mb-3" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#ededed]">Edit day</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#7a8296] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
        
        {/* Date Display */}
        <div className="mb-4 surface-card p-3">
          <p className="text-sm font-medium text-[#ededed] tabular-nums">{formatDate(dayData.date)}</p>
          {isHistorical && status === 'LEAVE' && (
            <p className="text-xs text-[#f59e0b] mt-1">
              Historical date — does not deduct from balances
            </p>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="mb-4">
          <label className="block text-xs text-[#a1a1a6] mb-1.5">
            Status
          </label>
          {status === 'EMPTY' ? (
            <button
              onClick={handleAddStatus}
              className="w-full px-4 py-2.5 surface-card hover:bg-white/[0.06] text-[#a1a1a6] hover:text-[#ededed] rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <IconPlus className="w-3.5 h-3.5" />
              <span>Add status</span>
            </button>
          ) : (
            <div className="flex gap-2">
              {status !== 'SHOW' ? (
                <select
                  value={status}
                  onChange={handleStatusChange}
                  className="flex-1 px-3 py-2 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded-lg focus:outline-none focus:border-white/30 text-xs"
                >
                  <option value="NO SHOW">Absent (No show)</option>
                  <option value="LEAVE">Leave</option>
                  <option value="EXCEPTION">Exception / WFH</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="WEEKEND">Weekend</option>
                </select>
              ) : (
                <div className="flex-1 px-3 py-2 surface-card text-[#ededed] flex items-center text-xs font-medium">
                  Office (Show)
                </div>
              )}
              <button
                onClick={handleClearStatus}
                className="px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#a1a1a6] hover:text-[#ededed] border border-white/[0.08] rounded-lg font-medium transition-colors text-xs"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Leave Details (when status is LEAVE) */}
        {status === 'LEAVE' && (
          <div className="mb-4 surface-card p-3 space-y-3">
            <h3 className="text-xs font-medium text-[#ededed]">
              Leave details
            </h3>

            {/* Leave Category Selector */}
            <div>
              <label className="block text-[11px] text-[#7a8296] mb-1">
                Leave type
              </label>
              <select
                value={leaveCategory}
                onChange={handleLeaveCategoryChange}
                className="w-full px-3 py-2 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded-lg focus:outline-none focus:border-white/30 text-xs"
              >
                <option value="">Unassigned / Generic leave</option>
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
                      className={isExhausted ? 'text-[#7a8296]' : ''}
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
                <label className="block text-[11px] text-[#7a8296] mb-1.5">
                  Duration
                </label>
                {leaveCategory === 'FL' ? (
                  <div className="text-xs text-[#a1a1a6] bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.06]">
                    Full day (1.0) — Flexi leave is full-day only
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
                                ? 'bg-white/[0.1] text-[#ededed] border-white/20'
                                : isFullDisabled
                                ? 'bg-transparent text-[#7a8296] border-white/[0.04] cursor-not-allowed'
                                : 'bg-white/[0.02] text-[#a1a1a6] border-white/[0.06] hover:bg-white/[0.05]'
                            }`}
                          >
                            Full day (1.0)
                          </button>

                          <button
                            type="button"
                            onClick={() => setLeaveDuration(0.5)}
                            disabled={isHalfDisabled}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                              leaveDuration === 0.5
                                ? 'bg-white/[0.1] text-[#ededed] border-white/20'
                                : isHalfDisabled
                                ? 'bg-transparent text-[#7a8296] border-white/[0.04] cursor-not-allowed'
                                : 'bg-white/[0.02] text-[#a1a1a6] border-white/[0.06] hover:bg-white/[0.05]'
                            }`}
                          >
                            Half day (0.5)
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
          <div className="mb-4 surface-card p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={earnedCompOff}
                onChange={(e) => setEarnedCompOff(e.target.checked)}
                className="w-4 h-4 rounded bg-[#1a1e28] border-white/20 text-[#4cc38a] focus:ring-0"
              />
              <div>
                <span className="text-xs font-medium text-[#ededed]">
                  Worked for comp off (+1 day)
                </span>
                <p className="text-[11px] text-[#7a8296] mt-0.5">
                  Increments available balance on {status === 'HOLIDAY' ? 'Holiday' : 'Weekend'}
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Exception Details (when status is EXCEPTION) */}
        {status === 'EXCEPTION' && (
          <div className="mb-4 surface-card p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-[#ededed]">
                Exception details
              </h3>
              <span className="text-[11px] text-[#7a8296] tabular-nums">
                {exceptionCategory === 'COMP_OFF'
                  ? `${compOffStats.available} CO days left`
                  : `${excStats.quarterCode}: ${excStats.available}/${excStats.quota} WFH left`}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-[#7a8296] mb-1">
                Category
              </label>
              <select
                value={exceptionCategory}
                onChange={(e) => setExceptionCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded-lg focus:outline-none focus:border-white/30 text-xs"
              >
                <option
                  value="PE"
                  disabled={!canSelectPE}
                  className={!canSelectPE ? 'text-[#7a8296]' : ''}
                >
                  Personal Exigency (WFH) — {excStats.available}/{excStats.quota} left in {excStats.quarterCode}{!canSelectPE ? ' (Exhausted)' : ''}
                </option>
                <option
                  value="COMP_OFF"
                  disabled={!canSelectCO}
                  className={!canSelectCO ? 'text-[#7a8296]' : ''}
                >
                  Comp Off — {compOffStats.available} available{!canSelectCO ? ' (Exhausted)' : ''}
                </option>
                <option value="OTHER">
                  Other exception (Special approval)
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Time Input */}
        <div className="mb-5">
          <label className="block text-xs text-[#a1a1a6] mb-1.5">
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
              w-full px-3 py-2 rounded-lg focus:outline-none focus:border-white/30 text-xs tabular-nums
              ${isTimeDisabled() 
                ? 'bg-transparent text-[#7a8296] cursor-not-allowed border border-white/[0.04]' 
                : 'bg-[#1a1e28] text-[#ededed] border border-white/[0.08]'}
            `}
          />
          {!isTimeDisabled() && (
            <p className="text-[11px] text-[#7a8296] mt-1 tabular-nums">
              {Math.floor(time / 60)}h {time % 60}m
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-[#ededed] hover:bg-white text-[#0f1115] rounded-lg font-medium transition-colors text-xs"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#a1a1a6] hover:text-[#ededed] border border-white/[0.08] rounded-lg font-medium transition-colors text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEditModal;
