import React from 'react';
import {
  calculateAttendancePercentage,
  calculateAvgHoursTillYesterday,
  calculateAvgHoursNeeded,
  calculateDaysCanSkip
} from '../services/statsService';
import { calculateLeaveBalances, LEAVE_TYPES } from '../services/leaveService';
import { calculateExceptionStats } from '../services/exceptionService';

const StatsPanel = ({ appData, currentDate, onOpenSettings }) => {
  const { calendarData, settings } = appData;

  const attendancePercentage = calculateAttendancePercentage(calendarData, settings, currentDate);
  const avgHoursTillYesterday = calculateAvgHoursTillYesterday(calendarData, settings, currentDate);
  const avgHoursNeeded = calculateAvgHoursNeeded(calendarData, settings, currentDate);
  const daysCanSkip = calculateDaysCanSkip(calendarData, settings, currentDate);

  // Calculate dynamic leave balances
  const leaveBalances = calculateLeaveBalances(settings, calendarData);

  // Calculate exception stats for the currently viewed quarter
  const exceptionStats = calculateExceptionStats(calendarData, currentDate);

  // Determine color for attendance percentage
  const getAttendanceColor = () => {
    if (attendancePercentage === 'N/A') return 'text-gray-400';
    const percentage = parseFloat(attendancePercentage);
    if (percentage >= settings.minAttendancePercentage) return 'text-green-400';
    return 'text-red-400';
  };

  // Determine color for average hours
  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-gray-400';
    // Parse hours and minutes from "Xh Ym" format
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-gray-400';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    if (totalMinutes >= settings.minHoursPerDay) return 'text-green-400';
    return 'text-red-400';
  };

  const hasConfiguredLeaves =
    settings?.leaveSettings?.EL?.startingBalance > 0 ||
    settings?.leaveSettings?.SL?.startingBalance > 0 ||
    settings?.leaveSettings?.CL?.startingBalance > 0 ||
    settings?.leaveSettings?.FL?.startingBalance > 0 ||
    settings?.leaveSettings?.EL?.quarterlyAccrual > 0 ||
    settings?.leaveSettings?.SL?.quarterlyAccrual > 0 ||
    settings?.leaveSettings?.CL?.quarterlyAccrual > 0 ||
    settings?.leaveSettings?.FL?.quarterlyAccrual > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Statistics</h2>

      {/* Leave Balances Card */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
            <span>🏖️</span>
            <span>Available Leave Balances</span>
          </h3>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[11px] text-gray-400 hover:text-white transition-colors"
              title="Configure in Settings"
            >
              ⚙️ Config
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.keys(LEAVE_TYPES).map((code) => {
            const type = LEAVE_TYPES[code];
            const data = leaveBalances[code];
            const isExhausted = data.available <= 0;

            return (
              <div
                key={code}
                className={`p-2.5 rounded-lg border transition-all ${
                  isExhausted
                    ? 'bg-gray-800/80 border-gray-600/40 text-gray-400'
                    : 'bg-gray-800 border-amber-500/30 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300">{type.code}</span>
                  <span className="text-[10px] text-gray-400 font-normal truncate max-w-[80px]">
                    {type.name.split(' ')[0]}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xl font-bold ${
                      isExhausted ? 'text-gray-400' : 'text-amber-400'
                    }`}
                  >
                    {data.available}
                  </span>
                  <span className="text-[11px] text-gray-400">days</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                  <span>Used: {data.used}</span>
                  {code === 'CL' && <span title="Lapses March 31">Lapses Mar</span>}
                  {code === 'FL' && <span title="Lapses Dec 31">Lapses Dec</span>}
                </div>
              </div>
            );
          })}
        </div>

        {!hasConfiguredLeaves && (
          <p className="text-[11px] text-gray-400 mt-3 italic text-center">
            Tip: Set your starting balances and quarterly accruals in Settings.
          </p>
        )}
      </div>

      {/* Exception (WFH) Balance Card for Showing Quarter */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-1.5">
            <span>🏠</span>
            <span>Personal Exigencies (WFH)</span>
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30">
            {exceptionStats.quarterCode}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold ${
                exceptionStats.isExhausted ? 'text-gray-400' : 'text-orange-400'
              }`}
            >
              {exceptionStats.available}
            </span>
            <span className="text-xs text-gray-400">/ {exceptionStats.quota} days left</span>
          </div>
          <div className="text-right text-xs text-gray-400">
            <span>Used: <strong className="text-white">{exceptionStats.used}</strong></span>
          </div>
        </div>

        <p className="text-[10.5px] text-gray-400 mt-2">
          {exceptionStats.quarterName} · {exceptionStats.quota} per quarter (no carry forward).
        </p>
      </div>

      {/* Attendance Percentage */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Attendance Percentage
        </h3>
        <p className={`text-3xl font-bold ${getAttendanceColor()}`}>
          {attendancePercentage === 'N/A' ? 'N/A' : `${attendancePercentage}%`}
        </p>
        {attendancePercentage !== 'N/A' && (
          <p className="text-xs text-gray-400 mt-1">
            Target: {settings.minAttendancePercentage}%
          </p>
        )}
      </div>

      {/* Average Hours (Completed Days) */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Avg. Hours (Completed Days)
        </h3>
        <p className={`text-3xl font-bold ${getAvgHoursColor()}`}>
          {avgHoursTillYesterday}
        </p>
        {avgHoursTillYesterday !== 'N/A' && (
          <p className="text-xs text-gray-400 mt-1">
            Target: {Math.floor(settings.minHoursPerDay / 60)}h {settings.minHoursPerDay % 60}m
          </p>
        )}
      </div>

      {/* Average Hours Needed (Remaining Days) - Only show for current month */}
      {avgHoursNeeded?.average !== null && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Avg. Hours Needed (Remaining {avgHoursNeeded.remainingDays} {avgHoursNeeded.remainingDays === 1 ? 'day' : 'days'})
          </h3>
          <p className="text-3xl font-bold text-white">
            {avgHoursNeeded.average}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Total: {avgHoursNeeded.totalNeeded}
          </p>
        </div>
      )}

      {/* Days Can Skip or Need More SHOW Days - Only show for current month */}
      {daysCanSkip !== null && (
        <div className="bg-gray-700 rounded-lg p-4">
          {daysCanSkip.needShowDays ? (
            <>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Days You need to come on Weekends
              </h3>
              <p className="text-3xl font-bold text-red-400">
                {daysCanSkip.needShowDays} {daysCanSkip.needShowDays === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                If you go Remaining {daysCanSkip.emptyDaysLeft} day{daysCanSkip.emptyDaysLeft === 1 ? '' : 's'}
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Days You Can Skip (NO SHOW)
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                {daysCanSkip.canSkip} {daysCanSkip.canSkip === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                If you go Remaining {daysCanSkip.emptyDaysLeft - daysCanSkip.canSkip} day{daysCanSkip.emptyDaysLeft === 1 ? '' : 's'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
