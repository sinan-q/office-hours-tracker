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

  const attValue = attendancePercentage === 'N/A' ? null : parseFloat(attendancePercentage);
  const attColor = attValue === null
    ? 'text-[#85858b]'
    : attValue >= settings.minAttendancePercentage
      ? 'text-[#4cc38a]'
      : 'text-[#e5484d]';
  const attBarColor = attValue === null
    ? 'bg-white/10'
    : attValue >= settings.minAttendancePercentage
      ? 'bg-[#4cc38a]'
      : 'bg-[#e5484d]';

  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-[#85858b]';
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-[#85858b]';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    return totalMinutes >= settings.minHoursPerDay ? 'text-[#4cc38a]' : 'text-[#e5484d]';
  };

  const avgColor = getAvgHoursColor();
  const totalLeaveDays = Object.keys(LEAVE_TYPES).reduce(
    (sum, code) => sum + (leaveBalances[code]?.available ?? 0),
    0
  );

  return (
    <button
      onClick={onOpenDrawer}
      className="w-full surface-card px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#232325] transition-colors duration-150 cursor-pointer group text-left"
      aria-label="View attendance statistics"
    >
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-5 gap-y-2 tabular-nums">
        {/* Attendance + Progress Bar */}
        <div className="flex items-center gap-3 min-w-[140px]">
          <div>
            <div className="text-xs text-[#85858b]">Attendance</div>
            <div className={`text-sm font-medium font-mono ${attColor}`}>
              {attValue === null ? '—' : `${attendancePercentage}%`}
            </div>
          </div>
          <div className="w-16 h-1 bg-white/[0.08] rounded-full overflow-hidden hidden sm:block" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${attBarColor}`}
              style={{ width: `${Math.min(100, Math.max(0, attValue ?? 0))}%` }}
            />
          </div>
        </div>

        {/* Avg Hours */}
        <div>
          <div className="text-xs text-[#85858b]">Avg hours</div>
          <div className={`text-sm font-medium font-mono ${avgColor}`}>
            {avgHoursTillYesterday === 'N/A' ? '—' : avgHoursTillYesterday}
          </div>
        </div>

        {/* WFH & Comp Off */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-[#85858b]">WFH</div>
            <div className="text-sm font-medium font-mono text-[#ededed]">
              {exceptionStats?.available ?? 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#85858b]">Comp off</div>
            <div className="text-sm font-medium font-mono text-[#ededed]">
              {compOffBalances?.available ?? 0}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-[#85858b]">Leaves</div>
            <div className="text-sm font-medium font-mono text-[#a1a1a6]">
              {totalLeaveDays}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[#85858b] group-hover:text-[#ededed] transition-colors shrink-0">
        <span className="hidden sm:inline">Details</span>
        <IconChevronDown className="w-4 h-4" />
      </div>
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
            <h2 className="text-base font-medium text-[#ededed]">Statistics</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#85858b] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
              aria-label="Close statistics"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>

          {/* Top-level stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Attendance */}
            <div className="surface-card p-3 bg-[#141415]">
              <div className="text-xs text-[#a1a1a6] mb-1">Attendance</div>
              <div className={`text-2xl font-medium font-mono tabular-nums ${getAttendanceColor()}`}>
                {attendancePercentage === 'N/A' ? '—' : `${attendancePercentage}%`}
              </div>
              {attendancePercentage !== 'N/A' && (
                <div className="text-xs text-[#85858b] mt-1 tabular-nums">Target: {settings.minAttendancePercentage}%</div>
              )}
            </div>

            {/* Avg Hours */}
            <div className="surface-card p-3 bg-[#141415]">
              <div className="text-xs text-[#a1a1a6] mb-1">Average hours</div>
              <div className={`text-2xl font-medium font-mono tabular-nums ${getAvgHoursColor()}`}>
                {avgHoursTillYesterday}
              </div>
              {avgHoursTillYesterday !== 'N/A' && (
                <div className="text-xs text-[#85858b] mt-1 tabular-nums">
                  Target: {Math.floor(settings.minHoursPerDay / 60)}h {settings.minHoursPerDay % 60}m
                </div>
              )}
            </div>

            {/* Hours Needed */}
            {avgHoursNeeded?.average !== null && (
              <div className="surface-card p-3 bg-[#141415]">
                <div className="text-xs text-[#a1a1a6] mb-1">
                  Hours needed ({avgHoursNeeded.remainingDays}d left)
                </div>
                <div className="text-2xl font-medium font-mono text-[#ededed] tabular-nums">
                  {avgHoursNeeded.average}
                </div>
                <div className="text-xs text-[#85858b] mt-1 tabular-nums">
                  Total required: {avgHoursNeeded.totalNeeded}
                </div>
              </div>
            )}

            {/* Days Can Skip */}
            {daysCanSkip !== null && (
              <div className="surface-card p-3 bg-[#141415]">
                {daysCanSkip.needShowDays ? (
                  <>
                    <div className="text-xs text-[#a1a1a6] mb-1">Extra days needed</div>
                    <div className="text-2xl font-medium font-mono text-[#e5484d] tabular-nums">
                      {daysCanSkip.needShowDays}d
                    </div>
                    <div className="text-xs text-[#85858b] mt-1">
                      Weekend days required
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-[#a1a1a6] mb-1">Days can skip</div>
                    <div className="text-2xl font-medium font-mono text-[#ededed] tabular-nums">
                      {daysCanSkip.canSkip}d
                    </div>
                    <div className="text-xs text-[#85858b] mt-1 tabular-nums">
                      {daysCanSkip.emptyDaysLeft - daysCanSkip.canSkip} remaining workdays
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Leave Balances */}
          <div className="surface-card p-4 bg-[#141415]">
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
                    className={`p-3 rounded-lg border transition-colors ${
                      isExhausted
                        ? 'bg-white/[0.02] border-white/[0.04] text-[#85858b]'
                        : 'bg-[#19191b] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className="text-[#ededed]">{type.code}</span>
                      <span className="text-xs text-[#85858b] truncate max-w-[90px]">
                        {type.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-medium font-mono tabular-nums ${isExhausted ? 'text-[#85858b]' : 'text-[#ededed]'}`}>
                        {data.available}
                      </span>
                      <span className="text-xs text-[#85858b]">days</span>
                    </div>
                    <div className="text-xs text-[#85858b] mt-1 flex justify-between tabular-nums">
                      <span>Used: {data.used}</span>
                      {code === 'CL' && <span>Lapses Mar</span>}
                      {code === 'FL' && <span>Lapses Dec</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasConfiguredLeaves && (
              <p className="text-xs text-[#85858b] mt-3 text-center">
                Configure your starting balances in Settings
              </p>
            )}
          </div>

          {/* WFH / Personal Exigency */}
          <div className="surface-card p-4 bg-[#141415]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-[#ededed]">Work from home quota</h3>
              <span className="text-xs font-mono px-2 py-0.5 bg-white/[0.04] text-[#a1a1a6] rounded">
                {exceptionStats.quarterCode}
              </span>
            </div>

            <div className="flex items-baseline justify-between tabular-nums">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-medium font-mono ${exceptionStats.isExhausted ? 'text-[#85858b]' : 'text-[#ededed]'}`}>
                  {exceptionStats.available}
                </span>
                <span className="text-xs text-[#85858b]">/ {exceptionStats.quota} days left</span>
              </div>
              <span className="text-xs text-[#85858b]">Used: <span className="text-[#ededed] font-medium font-mono">{exceptionStats.used}</span></span>
            </div>

            <p className="text-xs text-[#85858b] mt-2">
              {exceptionStats.quarterName} · {exceptionStats.quota} per quarter, no carry forward
            </p>
          </div>

          {/* Comp Off */}
          <div className="surface-card p-4 bg-[#141415]">
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
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-medium font-mono ${compOffBalances.isExhausted ? 'text-[#85858b]' : 'text-[#ededed]'}`}>
                  {compOffBalances.available}
                </span>
                <span className="text-xs text-[#85858b]">days available</span>
              </div>
              <div className="text-xs text-[#85858b] space-x-3">
                <span>Earned: <span className="text-[#4cc38a] font-medium font-mono">+{compOffBalances.earned}</span></span>
                <span>Used: <span className="text-[#ededed] font-medium font-mono">{compOffBalances.used}</span></span>
              </div>
            </div>

            <div className="text-xs text-[#85858b] mt-2 flex justify-between tabular-nums">
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
