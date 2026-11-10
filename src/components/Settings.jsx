import React, { useState } from 'react';
import { LEAVE_TYPES } from '../services/leaveService';
import { IconClose } from './Icons';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-[#141720] rounded-t-2xl sm:rounded-2xl p-5 md:p-6 w-full sm:max-w-xl max-h-[92vh] max-h-[92dvh] overflow-y-auto shadow-2xl border border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden drawer-handle mb-3" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#ededed]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#7a8296] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Office Hours & Attendance */}
        <div className="surface-card p-4 mb-4">
          <h3 className="text-xs font-medium text-[#ededed] mb-3">
            Office hours and attendance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#a1a1a6] mb-1">
                Minimum hours per day (minutes)
              </label>
              <input
                type="number"
                value={minHoursPerDay}
                onChange={(e) => setMinHoursPerDay(e.target.value)}
                min="0"
                max="1440"
                className="w-full px-3 py-2 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded-lg focus:outline-none focus:border-white/30 text-xs tabular-nums"
              />
              <p className="text-[11px] text-[#7a8296] mt-1 tabular-nums">
                {Math.floor(minHoursPerDay / 60)}h {minHoursPerDay % 60}m daily requirement
              </p>
            </div>

            <div>
              <label className="block text-[11px] text-[#a1a1a6] mb-1">
                Minimum attendance target (%)
              </label>
              <input
                type="number"
                value={minAttendancePercentage}
                onChange={(e) => setMinAttendancePercentage(e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded-lg focus:outline-none focus:border-white/30 text-xs tabular-nums"
              />
              <p className="text-[11px] text-[#7a8296] mt-1 tabular-nums">
                {minAttendancePercentage}% monthly target
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Leave Tracking Configuration */}
        <div className="surface-card p-4 mb-4">
          <div className="mb-3">
            <h3 className="text-xs font-medium text-[#ededed]">
              Leave tracking and accrual
            </h3>
            <p className="text-[11px] text-[#7a8296] mt-0.5">
              Leaves increment quarterly on Jan 1, Apr 1, Jul 1, Oct 1
            </p>
          </div>

          {/* Baseline Date */}
          <div className="mb-3 bg-white/[0.03] p-3 rounded-lg border border-white/[0.06]">
            <label className="block text-[11px] text-[#a1a1a6] mb-1">
              Starting balances as of date:
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded-lg focus:outline-none focus:border-white/30 text-xs tabular-nums"
            />
            <p className="text-[11px] text-[#7a8296] mt-1">
              Leaves on or before this date are accounted for. Only subsequent leaves deduct from available balance.
            </p>
          </div>

          {/* Leave Types Configuration Table */}
          <div className="space-y-2">
            {Object.keys(LEAVE_TYPES).map((key) => {
              const type = LEAVE_TYPES[key];
              return (
                <div key={key} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#ededed] text-xs">{type.name} ({type.code})</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/[0.04] text-[#a1a1a6] rounded">
                      {type.ruleDescription}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#7a8296] mb-1">
                        Starting balance (days)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={type.maxCap || undefined}
                        value={leaveBalances[key].startingBalance}
                        onChange={(e) => handleLeaveFieldChange(key, 'startingBalance', e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded focus:outline-none focus:border-white/30 text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#7a8296] mb-1">
                        Quarterly accrual (+days)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={leaveBalances[key].quarterlyAccrual}
                        onChange={(e) => handleLeaveFieldChange(key, 'quarterlyAccrual', e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded focus:outline-none focus:border-white/30 text-xs tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Comp Off Configuration */}
        <div className="surface-card p-4 mb-5">
          <div className="mb-3">
            <h3 className="text-xs font-medium text-[#ededed]">
              Comp off tracking
            </h3>
            <p className="text-[11px] text-[#7a8296] mt-0.5">
              Work on holidays and weekends earns +1 comp off day
            </p>
          </div>

          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#a1a1a6] mb-1">
                Starting comp off balance
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={compOffStartingBalance}
                onChange={(e) => setCompOffStartingBalance(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded focus:outline-none focus:border-white/30 text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#a1a1a6] mb-1">
                As of date
              </label>
              <input
                type="date"
                value={compOffAsOfDate}
                onChange={(e) => setCompOffAsOfDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded focus:outline-none focus:border-white/30 text-xs tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-[#ededed] hover:bg-white text-[#0f1115] rounded-lg font-medium transition-colors text-xs"
          >
            Save settings
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

export default Settings;
