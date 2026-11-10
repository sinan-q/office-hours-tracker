import React from 'react';
import {
  calculateAttendancePercentage,
  calculateAvgHoursTillYesterday,
  calculateAvgHoursNeeded,
  calculateDaysCanSkip
} from '../services/statsService';
import { calculateLeaveBalances, LEAVE_TYPES } from '../services/leaveService';
import { calculateExceptionStats } from '../services/exceptionService';
import { calculateCompOffBalances } from '../services/compOffService';
import { IconChevronDown, IconClose } from './Icons';

/**
 * StatsStrip — Compact inline metric row (always visible above calendar)
 */
export const StatsStrip = ({ appData, currentDate, onOpenDrawer }) => {
  const { calendarData, settings } = appData;
  const attendancePercentage = calculateAttendancePercentage(calendarData, settings, currentDate);
  const avgHoursTillYesterday = calculateAvgHoursTillYesterday(calendarData, settings, currentDate);
  const exceptionStats = calculateExceptionStats(calendarData, currentDate);
  const compOffBalances = calculateCompOffBalances(settings?.compOffSettings, calendarData);
  const leaveBalances = calculateLeaveBalances(settings, calendarData);

  const attColor = attendancePercentage === 'N/A'
    ? 'text-[#7a8296]'
    : parseFloat(attendancePercentage) >= settings.minAttendancePercentage
      ? 'text-[#4cc38a]'
      : 'text-[#e5484d]';

  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-[#7a8296]';
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-[#7a8296]';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    return totalMinutes >= settings.minHoursPerDay ? 'text-[#4cc38a]' : 'text-[#e5484d]';
  };

  const avgColor = getAvgHoursColor();

  return (
    <button
      onClick={onOpenDrawer}
      className="w-full surface-card px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.04] transition-colors cursor-pointer group text-left"
      aria-label="View attendance statistics"
    >
      <div className="flex items-center gap-2.5 text-xs font-normal overflow-x-auto no-scrollbar tabular-nums">
        {/* Attendance */}
        <span className="text-[#a1a1a6] whitespace-nowrap">
          Attendance <span className={`font-medium ${attColor}`}>{attendancePercentage === 'N/A' ? '—' : `${attendancePercentage}%`}</span>
        </span>

        <span className="text-white/10">/</span>

        {/* Avg Hours */}
        <span className="text-[#a1a1a6] whitespace-nowrap">
          Avg <span className={`font-medium ${avgColor}`}>{avgHoursTillYesterday === 'N/A' ? '—' : avgHoursTillYesterday}</span>
        </span>

        <span className="text-white/10">/</span>

        {/* WFH */}
        <span className="text-[#a1a1a6] whitespace-nowrap">
          WFH <span className="font-medium text-[#ededed]">{exceptionStats?.available ?? 0}</span>
        </span>

        {/* Comp Off */}
        <span className="text-[#a1a1a6] whitespace-nowrap">
          CO <span className="font-medium text-[#ededed]">{compOffBalances?.available ?? 0}</span>
        </span>

        <span className="text-white/10">/</span>

        {/* Leave balances inline */}
        {Object.keys(LEAVE_TYPES).map((code) => (
          <span key={code} className="text-[#7a8296] whitespace-nowrap">
            {code} <span className="font-medium text-[#a1a1a6]">{leaveBalances[code]?.available ?? 0}</span>
          </span>
        ))}
      </div>

      <IconChevronDown className="w-3.5 h-3.5 text-[#7a8296] group-hover:text-[#ededed] transition-colors shrink-0 ml-1" />
    </button>
  );
};

/**
 * StatsDrawer — Full stats panel shown as slide-up bottom sheet
 */
export const StatsDrawer = ({ appData, currentDate, onClose, onOpenSettings }) => {
  const { calendarData, settings } = appData;

  const attendancePercentage = calculateAttendancePercentage(calendarData, settings, currentDate);
  const avgHoursTillYesterday = calculateAvgHoursTillYesterday(calendarData, settings, currentDate);
  const avgHoursNeeded = calculateAvgHoursNeeded(calendarData, settings, currentDate);
  const daysCanSkip = calculateDaysCanSkip(calendarData, settings, currentDate);
  const leaveBalances = calculateLeaveBalances(settings, calendarData);
  const exceptionStats = calculateExceptionStats(calendarData, currentDate);
  const compOffBalances = calculateCompOffBalances(settings?.compOffSettings, calendarData);

  const getAttendanceColor = () => {
    if (attendancePercentage === 'N/A') return 'text-[#7a8296]';
    return parseFloat(attendancePercentage) >= settings.minAttendancePercentage
      ? 'text-[#4cc38a]'
      : 'text-[#e5484d]';
  };

  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-[#7a8296]';
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-[#7a8296]';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    return totalMinutes >= settings.minHoursPerDay ? 'text-[#4cc38a]' : 'text-[#e5484d]';
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
    <>
      {/* Overlay */}
      <div className="stats-drawer-overlay" onClick={onClose} />

      {/* Drawer panel */}
      <div className="stats-drawer-panel">
        <div className="drawer-handle" />

        <div className="px-5 pt-3 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#ededed]">Statistics</h2>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#7a8296] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
              aria-label="Close statistics"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>

          {/* Top-level stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Attendance */}
            <div className="surface-card p-3">
              <div className="text-xs text-[#a1a1a6] mb-1">Attendance</div>
              <div className={`text-2xl font-semibold tabular-nums ${getAttendanceColor()}`}>
                {attendancePercentage === 'N/A' ? '—' : `${attendancePercentage}%`}
              </div>
              {attendancePercentage !== 'N/A' && (
                <div className="text-[11px] text-[#7a8296] mt-0.5 tabular-nums">Target: {settings.minAttendancePercentage}%</div>
              )}
            </div>

            {/* Avg Hours */}
            <div className="surface-card p-3">
              <div className="text-xs text-[#a1a1a6] mb-1">Average hours</div>
              <div className={`text-2xl font-semibold tabular-nums ${getAvgHoursColor()}`}>
                {avgHoursTillYesterday}
              </div>
              {avgHoursTillYesterday !== 'N/A' && (
                <div className="text-[11px] text-[#7a8296] mt-0.5 tabular-nums">
                  Target: {Math.floor(settings.minHoursPerDay / 60)}h {settings.minHoursPerDay % 60}m
                </div>
              )}
            </div>

            {/* Hours Needed */}
            {avgHoursNeeded?.average !== null && (
              <div className="surface-card p-3">
                <div className="text-xs text-[#a1a1a6] mb-1">
                  Hours needed ({avgHoursNeeded.remainingDays}d left)
                </div>
                <div className="text-2xl font-semibold text-[#ededed] tabular-nums">
                  {avgHoursNeeded.average}
                </div>
                <div className="text-[11px] text-[#7a8296] mt-0.5 tabular-nums">
                  Total required: {avgHoursNeeded.totalNeeded}
                </div>
              </div>
            )}

            {/* Days Can Skip */}
            {daysCanSkip !== null && (
              <div className="surface-card p-3">
                {daysCanSkip.needShowDays ? (
                  <>
                    <div className="text-xs text-[#a1a1a6] mb-1">Extra days needed</div>
                    <div className="text-2xl font-semibold text-[#e5484d] tabular-nums">
                      {daysCanSkip.needShowDays}d
                    </div>
                    <div className="text-[11px] text-[#7a8296] mt-0.5">
                      Weekend days required
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-[#a1a1a6] mb-1">Days can skip</div>
                    <div className="text-2xl font-semibold text-[#ededed] tabular-nums">
                      {daysCanSkip.canSkip}d
                    </div>
                    <div className="text-[11px] text-[#7a8296] mt-0.5 tabular-nums">
                      {daysCanSkip.emptyDaysLeft - daysCanSkip.canSkip} remaining workdays
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Leave Balances */}
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-[#ededed]">Leave balances</h3>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-xs text-[#a1a1a6] hover:text-[#ededed] transition-colors"
                >
                  Configure
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.keys(LEAVE_TYPES).map((code) => {
                const type = LEAVE_TYPES[code];
                const data = leaveBalances[code];
                const isExhausted = data.available <= 0;

                return (
                  <div
                    key={code}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      isExhausted
                        ? 'bg-white/[0.02] border-white/[0.04] text-[#7a8296]'
                        : 'bg-white/[0.03] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-0.5">
                      <span className="text-[#ededed]">{type.code}</span>
                      <span className="text-[11px] text-[#7a8296] truncate max-w-[80px]">
                        {type.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-semibold tabular-nums ${isExhausted ? 'text-[#7a8296]' : 'text-[#ededed]'}`}>
                        {data.available}
                      </span>
                      <span className="text-xs text-[#7a8296]">days</span>
                    </div>
                    <div className="text-[11px] text-[#7a8296] mt-0.5 flex justify-between tabular-nums">
                      <span>Used: {data.used}</span>
                      {code === 'CL' && <span>Lapses Mar</span>}
                      {code === 'FL' && <span>Lapses Dec</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasConfiguredLeaves && (
              <p className="text-xs text-[#7a8296] mt-2.5 text-center">
                Configure your starting balances in Settings.
              </p>
            )}
          </div>

          {/* WFH / Personal Exigency */}
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-[#ededed]">Work from home quota</h3>
              <span className="text-[11px] font-medium px-2 py-0.5 bg-white/[0.04] text-[#a1a1a6] rounded">
                {exceptionStats.quarterCode}
              </span>
            </div>

            <div className="flex items-baseline justify-between tabular-nums">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-semibold ${exceptionStats.isExhausted ? 'text-[#7a8296]' : 'text-[#ededed]'}`}>
                  {exceptionStats.available}
                </span>
                <span className="text-xs text-[#7a8296]">/ {exceptionStats.quota} days left</span>
              </div>
              <span className="text-xs text-[#7a8296]">Used: <span className="text-[#ededed] font-medium">{exceptionStats.used}</span></span>
            </div>

            <p className="text-[11px] text-[#7a8296] mt-1.5">
              {exceptionStats.quarterName} · {exceptionStats.quota} per quarter, no carry forward
            </p>
          </div>

          {/* Comp Off */}
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-[#ededed]">Comp off balance</h3>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-xs text-[#a1a1a6] hover:text-[#ededed] transition-colors"
                >
                  Configure
                </button>
              )}
            </div>

            <div className="flex items-baseline justify-between tabular-nums">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-semibold ${compOffBalances.isExhausted ? 'text-[#7a8296]' : 'text-[#ededed]'}`}>
                  {compOffBalances.available}
                </span>
                <span className="text-xs text-[#7a8296]">days available</span>
              </div>
              <div className="text-xs text-[#7a8296] space-x-2">
                <span>Earned: <span className="text-[#4cc38a] font-medium">+{compOffBalances.earned}</span></span>
                <span>Used: <span className="text-[#ededed] font-medium">{compOffBalances.used}</span></span>
              </div>
            </div>

            <div className="text-[11px] text-[#7a8296] mt-1.5 flex justify-between tabular-nums">
              <span>Starting balance: {compOffBalances.startingBalance}</span>
              <span>Carried forward</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * StatsPanel — Legacy export for backward compatibility
 */
const StatsPanel = ({ appData, currentDate, onOpenSettings }) => {
  return (
    <div className="space-y-4">
      <StatsStrip appData={appData} currentDate={currentDate} onOpenDrawer={() => {}} />
    </div>
  );
};

export default StatsPanel;
