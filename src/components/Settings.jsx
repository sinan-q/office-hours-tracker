import React, { useState } from 'react';
import { LEAVE_TYPES } from '../services/leaveService';

const Settings = ({ settings, onSave, onClose }) => {
  const [minHoursPerDay, setMinHoursPerDay] = useState(settings?.minHoursPerDay || 300);
  const [minAttendancePercentage, setMinAttendancePercentage] = useState(settings?.minAttendancePercentage || 80);

  // Leave Settings State
  const defaultAsOfDate = settings?.leaveSettings?.asOfDate || new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(defaultAsOfDate);

  const [leaveBalances, setLeaveBalances] = useState({
    EL: {
      startingBalance: settings?.leaveSettings?.EL?.startingBalance ?? 0,
      quarterlyAccrual: settings?.leaveSettings?.EL?.quarterlyAccrual ?? 0
    },
    SL: {
      startingBalance: settings?.leaveSettings?.SL?.startingBalance ?? 0,
      quarterlyAccrual: settings?.leaveSettings?.SL?.quarterlyAccrual ?? 0
    },
    CL: {
      startingBalance: settings?.leaveSettings?.CL?.startingBalance ?? 0,
      quarterlyAccrual: settings?.leaveSettings?.CL?.quarterlyAccrual ?? 0
    },
    FL: {
      startingBalance: settings?.leaveSettings?.FL?.startingBalance ?? 0,
      quarterlyAccrual: settings?.leaveSettings?.FL?.quarterlyAccrual ?? 0
    }
  });

  // Comp Off Settings State
  const defaultCompOffAsOfDate = settings?.compOffSettings?.asOfDate || defaultAsOfDate;
  const [compOffStartingBalance, setCompOffStartingBalance] = useState(
    settings?.compOffSettings?.startingBalance ?? 0
  );
  const [compOffAsOfDate, setCompOffAsOfDate] = useState(defaultCompOffAsOfDate);

  const handleLeaveFieldChange = (type, field, value) => {
    const num = value === '' ? '' : parseFloat(value);
    setLeaveBalances((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: num
      }
    }));
  };

  const handleSave = () => {
    onSave({
      minHoursPerDay: parseInt(minHoursPerDay) || 300,
      minAttendancePercentage: parseInt(minAttendancePercentage) || 80,
      leaveSettings: {
        asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        EL: {
          startingBalance: parseFloat(leaveBalances.EL.startingBalance) || 0,
          quarterlyAccrual: parseFloat(leaveBalances.EL.quarterlyAccrual) || 0
        },
        SL: {
          startingBalance: parseFloat(leaveBalances.SL.startingBalance) || 0,
          quarterlyAccrual: parseFloat(leaveBalances.SL.quarterlyAccrual) || 0
        },
        CL: {
          startingBalance: parseFloat(leaveBalances.CL.startingBalance) || 0,
          quarterlyAccrual: parseFloat(leaveBalances.CL.quarterlyAccrual) || 0
        },
        FL: {
          startingBalance: parseFloat(leaveBalances.FL.startingBalance) || 0,
          quarterlyAccrual: parseFloat(leaveBalances.FL.quarterlyAccrual) || 0
        }
      },
      compOffSettings: {
        startingBalance: parseFloat(compOffStartingBalance) || 0,
        asOfDate: compOffAsOfDate || asOfDate || new Date().toISOString().split('T')[0]
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-gray-800 rounded-xl p-5 md:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-5">Settings</h2>

        {/* Section 1: Office Hours & Attendance */}
        <div className="bg-gray-700/40 rounded-lg p-4 mb-6 border border-gray-700">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
            Office Hours & Attendance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Minimum Hours Per Day (minutes)
              </label>
              <input
                type="number"
                value={minHoursPerDay}
                onChange={(e) => setMinHoursPerDay(e.target.value)}
                min="0"
                max="1440"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {Math.floor(minHoursPerDay / 60)}h {minHoursPerDay % 60}m per day
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Min Attendance Target (%)
              </label>
              <input
                type="number"
                value={minAttendancePercentage}
                onChange={(e) => setMinAttendancePercentage(e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {minAttendancePercentage}% monthly target
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Leave Tracking Configuration */}
        <div className="bg-gray-700/40 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                Leave Tracking & Accrual
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Leaves increment automatically every quarter on Jan 1, Apr 1, Jul 1, Oct 1.
              </p>
            </div>
          </div>

          {/* Baseline Date */}
          <div className="mb-4 bg-gray-800/80 p-3 rounded-lg border border-gray-600/50">
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Starting Balances As Of Date:
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Leaves on or before this date are treated as already accounted for. Only leaves taken <strong>after</strong> this date will deduct from your available balance.
            </p>
          </div>

          {/* Leave Types Configuration Table */}
          <div className="space-y-3">
            {Object.keys(LEAVE_TYPES).map((key) => {
              const type = LEAVE_TYPES[key];
              return (
                <div key={key} className="bg-gray-800/80 rounded-lg p-3 border border-gray-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{type.name} ({type.code})</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full font-medium">
                      {type.ruleDescription}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Starting Balance (days)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={type.maxCap || undefined}
                        value={leaveBalances[key].startingBalance}
                        onChange={(e) => handleLeaveFieldChange(key, 'startingBalance', e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Quarterly Addition (+days)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={leaveBalances[key].quarterlyAccrual}
                        onChange={(e) => handleLeaveFieldChange(key, 'quarterlyAccrual', e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Comp Off Configuration */}
        <div className="bg-gray-700/40 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                Comp Off Tracking
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Work on Holidays and Weekends can be marked to earn Comp Off (+1 day).
              </p>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Starting Comp Off Balance:
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={compOffStartingBalance}
                onChange={(e) => setCompOffStartingBalance(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Available balance on the baseline date.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                As Of Date:
              </label>
              <input
                type="date"
                value={compOffAsOfDate}
                onChange={(e) => setCompOffAsOfDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-700 text-white rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Only events after this date affect the dynamic balance.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow"
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
