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
    ? 'text-[#6b7280]'
    : attValue >= settings.minAttendancePercentage
      ? 'text-[#16a34a]'
      : 'text-[#dc2626]';
  const attBarColor = attValue === null
    ? 'bg-[#e5e7eb]'
    : attValue >= settings.minAttendancePercentage
      ? 'bg-[#4f85d9]'
      : 'bg-[#dc2626]';

  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-[#6b7280]';
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-[#6b7280]';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    return totalMinutes >= settings.minHoursPerDay ? 'text-[#16a34a]' : 'text-[#dc2626]';
  };

  const avgColor = getAvgHoursColor();
  const totalLeaveDays = Object.keys(LEAVE_TYPES).reduce(
    (sum, code) => sum + (leaveBalances[code]?.available ?? 0),
    0
  );

  return (
    <button
      onClick={onOpenDrawer}
      className="w-full surface-card px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#f9fafb] transition-colors duration-150 cursor-pointer group text-left"
      aria-label="View attendance statistics"
    >
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-5 gap-y-2 tabular-nums">
        {/* Attendance + Progress Bar */}
        <div className="flex items-center gap-3 min-w-[130px]">
          <div>
            <div className="text-xs text-[#6b7280]">WFO Index</div>
            <div className={`text-sm font-medium font-mono ${attColor}`}>
              {attValue === null ? '—' : `${attendancePercentage}%`}
            </div>
          </div>
          <div className="w-16 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden hidden sm:block" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${attBarColor}`}
              style={{ width: `${Math.min(100, Math.max(0, attValue ?? 0))}%` }}
            />
          </div>
        </div>

        {/* Avg Hours */}
        <div>
          <div className="text-xs text-[#6b7280]">Avg hours</div>
          <div className={`text-sm font-medium font-mono ${avgColor}`}>
            {avgHoursTillYesterday === 'N/A' ? '—' : avgHoursTillYesterday}
          </div>
        </div>

        {/* WFH & Comp Off */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-[#6b7280]">WFH</div>
            <div className="text-sm font-medium font-mono text-[#111827]">
              {exceptionStats?.available ?? 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6b7280]">Comp off</div>
            <div className="text-sm font-medium font-mono text-[#111827]">
              {compOffBalances?.available ?? 0}
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-[#6b7280]">Leaves</div>
            <div className="text-sm font-medium font-mono text-[#4b5563]">
              {totalLeaveDays}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[#6b7280] group-hover:text-[#111827] transition-colors shrink-0">
        <span className="hidden sm:inline">Details</span>
        <IconChevronDown className="w-4 h-4" />
      </div>
    </button>
  );
};

/**
 * WfoIndexSidebar — 2Office-style right sidebar with quarterly conic-gradient rings & balances
 */
export const WfoIndexSidebar = ({ appData, currentDate, onOpenSettings }) => {
  const { calendarData, settings } = appData;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Indian FY: Apr-Mar
  const fyStart = month >= 3 ? year : year - 1;
  const fyEndShort = String((fyStart + 1) % 100).padStart(2, '0');
  const fyLabel = `FY ${String(fyStart % 100).padStart(2, '0')}-${fyEndShort}`;

  const quarters = [
    { name: `Q1, FY ${fyEndShort}`, months: [{ m: 3, y: fyStart, label: 'Apr' }, { m: 4, y: fyStart, label: 'May' }, { m: 5, y: fyStart, label: 'Jun' }] },
    { name: `Q2, FY ${fyEndShort}`, months: [{ m: 6, y: fyStart, label: 'Jul' }, { m: 7, y: fyStart, label: 'Aug' }, { m: 8, y: fyStart, label: 'Sep' }] },
    { name: `Q3, FY ${fyEndShort}`, months: [{ m: 9, y: fyStart, label: 'Oct' }, { m: 10, y: fyStart, label: 'Nov' }, { m: 11, y: fyStart, label: 'Dec' }] },
    { name: `Q4, FY ${fyEndShort}`, months: [{ m: 0, y: fyStart + 1, label: 'Jan' }, { m: 1, y: fyStart + 1, label: 'Feb' }, { m: 2, y: fyStart + 1, label: 'Mar' }] }
  ];

  // Current quarter first, then previous quarters in the FY
  const currentQIdx = month >= 3 && month <= 5 ? 0 : month >= 6 && month <= 8 ? 1 : month >= 9 && month <= 11 ? 2 : 3;
  const visibleQuarters = [];
  for (let i = currentQIdx; i >= 0; i--) {
    visibleQuarters.push(quarters[i]);
  }

  const avgHoursTillYesterday = calculateAvgHoursTillYesterday(calendarData, settings, currentDate);
  const avgHoursNeeded = calculateAvgHoursNeeded(calendarData, settings, currentDate);
  const daysCanSkip = calculateDaysCanSkip(calendarData, settings, currentDate);
  const leaveBalances = calculateLeaveBalances(settings, calendarData);
  const exceptionStats = calculateExceptionStats(calendarData, currentDate);
  const compOffBalances = calculateCompOffBalances(settings?.compOffSettings, calendarData);

  return (
    <aside className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-[#374151]">My WFO Index</h2>
        <span className="text-xs font-medium text-[#3F51BD]">{fyLabel}</span>
      </div>

      {/* Quarterly Progress Ring Cards */}
      {visibleQuarters.map((q) => {
        const monthStats = q.months.map((item) => {
          const pctStr = calculateAttendancePercentage(calendarData, settings, new Date(item.y, item.m, 1));
          const pct = pctStr === 'N/A' ? null : Math.round(parseFloat(pctStr));
          return { ...item, pct };
        });
        const validPcts = monthStats.filter((m) => m.pct !== null).map((m) => m.pct);
        const qAvg = validPcts.length > 0
          ? Math.round(validPcts.reduce((a, b) => a + b, 0) / validPcts.length)
          : null;

        return (
          <div key={q.name} className="surface-card overflow-hidden">
            <div className="px-3 py-2 bg-[#f8f9fa] border-b border-[#e5e7eb] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1f2937]">{q.name}</span>
              {qAvg !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4f85d9] rounded-full"
                      style={{ width: `${Math.min(100, qAvg)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold font-mono text-[#1f2937]">{qAvg}%</span>
                </div>
              )}
            </div>

            <div className="p-3 flex items-center justify-around gap-1">
              {monthStats.map((m) => {
                const pct = m.pct ?? 0;
                const isSelectedMonth = m.m === month && m.y === year;
                return (
                  <div key={m.label} className="flex flex-col items-center gap-1.5">
                    <div
                      role="img"
                      aria-label={`${m.label} WFO index ${m.pct !== null ? `${pct}%` : 'not available'}`}
                      className="progress-ring"
                      style={{
                        background: `conic-gradient(rgb(79, 133, 217) ${pct}%, rgb(233, 233, 233) ${pct}%)`
                      }}
                    >
                      <span className="progress-value font-mono">
                        {m.pct !== null ? `${pct}%` : '—'}
                      </span>
                    </div>
                    <span className={`text-xs ${isSelectedMonth ? 'font-semibold text-[#3F51BD]' : 'text-[#6b7280]'}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Monthly Pace & Hours Card */}
      <div className="surface-card p-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6b7280]">Avg hours</span>
          <span className="font-mono font-medium text-[#111827]">{avgHoursTillYesterday}</span>
        </div>
        {avgHoursNeeded?.average !== null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6b7280]">Needed ({avgHoursNeeded.remainingDays}d)</span>
            <span className="font-mono font-medium text-[#111827]">{avgHoursNeeded.average}</span>
          </div>
        )}
        {daysCanSkip !== null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6b7280]">{daysCanSkip.needShowDays ? 'Extra days needed' : 'Days can skip'}</span>
            <span className={`font-mono font-medium ${daysCanSkip.needShowDays ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
              {daysCanSkip.needShowDays ? `${daysCanSkip.needShowDays}d` : `${daysCanSkip.canSkip}d`}
            </span>
          </div>
        )}
      </div>

      {/* Balances Summary Card */}
      <div className="surface-card p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#374151]">Balances</span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs text-[#3F51BD] hover:underline"
            >
              Configure
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded px-2 py-1.5 flex items-center justify-between">
            <span className="text-[#6b7280]">WFH</span>
            <span className="font-mono font-medium text-[#111827]">{exceptionStats.available}/{exceptionStats.quota}</span>
          </div>
          <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded px-2 py-1.5 flex items-center justify-between">
            <span className="text-[#6b7280]">CO</span>
            <span className="font-mono font-medium text-[#111827]">{compOffBalances.available}</span>
          </div>
          {Object.keys(LEAVE_TYPES).map((code) => (
            <div key={code} className="bg-[#f8f9fa] border border-[#e5e7eb] rounded px-2 py-1.5 flex items-center justify-between">
              <span className="text-[#6b7280]">{code}</span>
              <span className="font-mono font-medium text-[#111827]">{leaveBalances[code]?.available ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
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
    if (attendancePercentage === 'N/A') return 'text-[#6b7280]';
    return parseFloat(attendancePercentage) >= settings.minAttendancePercentage
      ? 'text-[#16a34a]'
      : 'text-[#dc2626]';
  };

  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-[#6b7280]';
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-[#6b7280]';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    return totalMinutes >= settings.minHoursPerDay ? 'text-[#16a34a]' : 'text-[#dc2626]';
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
            <h2 className="text-base font-semibold text-[#111827]">My WFO Index &amp; Stats</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
              aria-label="Close statistics"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>

          {/* Top-level stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Attendance */}
            <div className="surface-card p-3 bg-[#f9fafb]">
              <div className="text-xs text-[#6b7280] mb-1">Attendance</div>
              <div className={`text-2xl font-medium font-mono tabular-nums ${getAttendanceColor()}`}>
                {attendancePercentage === 'N/A' ? '—' : `${attendancePercentage}%`}
              </div>
              {attendancePercentage !== 'N/A' && (
                <div className="text-xs text-[#6b7280] mt-1 tabular-nums">Target: {settings.minAttendancePercentage}%</div>
              )}
            </div>

            {/* Avg Hours */}
            <div className="surface-card p-3 bg-[#f9fafb]">
              <div className="text-xs text-[#6b7280] mb-1">Average hours</div>
              <div className={`text-2xl font-medium font-mono tabular-nums ${getAvgHoursColor()}`}>
                {avgHoursTillYesterday}
              </div>
              {avgHoursTillYesterday !== 'N/A' && (
                <div className="text-xs text-[#6b7280] mt-1 tabular-nums">
                  Target: {Math.floor(settings.minHoursPerDay / 60)}h {settings.minHoursPerDay % 60}m
                </div>
              )}
            </div>

            {/* Hours Needed */}
            {avgHoursNeeded?.average !== null && (
              <div className="surface-card p-3 bg-[#f9fafb]">
                <div className="text-xs text-[#6b7280] mb-1">
                  Hours needed ({avgHoursNeeded.remainingDays}d left)
                </div>
                <div className="text-2xl font-medium font-mono text-[#111827] tabular-nums">
                  {avgHoursNeeded.average}
                </div>
                <div className="text-xs text-[#6b7280] mt-1 tabular-nums">
                  Total required: {avgHoursNeeded.totalNeeded}
                </div>
              </div>
            )}

            {/* Days Can Skip */}
            {daysCanSkip !== null && (
              <div className="surface-card p-3 bg-[#f9fafb]">
                {daysCanSkip.needShowDays ? (
                  <>
                    <div className="text-xs text-[#6b7280] mb-1">Extra days needed</div>
                    <div className="text-2xl font-medium font-mono text-[#dc2626] tabular-nums">
                      {daysCanSkip.needShowDays}d
                    </div>
                    <div className="text-xs text-[#6b7280] mt-1">
                      Weekend days required
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-[#6b7280] mb-1">Days can skip</div>
                    <div className="text-2xl font-medium font-mono text-[#111827] tabular-nums">
                      {daysCanSkip.canSkip}d
                    </div>
                    <div className="text-xs text-[#6b7280] mt-1 tabular-nums">
                      {daysCanSkip.emptyDaysLeft - daysCanSkip.canSkip} remaining workdays
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Leave Balances */}
          <div className="surface-card p-4 bg-[#f9fafb]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#111827]">Leave balances</h3>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-xs text-[#3F51BD] hover:underline"
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
                        ? 'bg-[#f3f4f6] border-[#e5e7eb] text-[#9ca3af]'
                        : 'bg-white border-[#e5e7eb]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className="text-[#111827]">{type.code}</span>
                      <span className="text-xs text-[#6b7280] truncate max-w-[90px]">
                        {type.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-medium font-mono tabular-nums ${isExhausted ? 'text-[#9ca3af]' : 'text-[#111827]'}`}>
                        {data.available}
                      </span>
                      <span className="text-xs text-[#6b7280]">days</span>
                    </div>
                    <div className="text-xs text-[#6b7280] mt-1 flex justify-between tabular-nums">
                      <span>Used: {data.used}</span>
                      {code === 'CL' && <span>Lapses Mar</span>}
                      {code === 'FL' && <span>Lapses Dec</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasConfiguredLeaves && (
              <p className="text-xs text-[#6b7280] mt-3 text-center">
                Configure your starting balances in Settings
              </p>
            )}
          </div>

          {/* WFH / Personal Exigency */}
          <div className="surface-card p-4 bg-[#f9fafb]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[#111827]">Work from home quota</h3>
              <span className="text-xs font-mono px-2 py-0.5 bg-[#e5e7eb] text-[#374151] rounded">
                {exceptionStats.quarterCode}
              </span>
            </div>

            <div className="flex items-baseline justify-between tabular-nums">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-medium font-mono ${exceptionStats.isExhausted ? 'text-[#9ca3af]' : 'text-[#111827]'}`}>
                  {exceptionStats.available}
                </span>
                <span className="text-xs text-[#6b7280]">/ {exceptionStats.quota} days left</span>
              </div>
              <span className="text-xs text-[#6b7280]">Used: <span className="text-[#111827] font-medium font-mono">{exceptionStats.used}</span></span>
            </div>

            <p className="text-xs text-[#6b7280] mt-2">
              {exceptionStats.quarterName} · {exceptionStats.quota} per quarter, no carry forward
            </p>
          </div>

          {/* Comp Off */}
          <div className="surface-card p-4 bg-[#f9fafb]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[#111827]">Comp off balance</h3>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-xs text-[#3F51BD] hover:underline"
                >
                  Configure
                </button>
              )}
            </div>

            <div className="flex items-baseline justify-between tabular-nums">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-medium font-mono ${compOffBalances.isExhausted ? 'text-[#9ca3af]' : 'text-[#111827]'}`}>
                  {compOffBalances.available}
                </span>
                <span className="text-xs text-[#6b7280]">days available</span>
              </div>
              <div className="text-xs text-[#6b7280] space-x-3">
                <span>Earned: <span className="text-[#16a34a] font-medium font-mono">+{compOffBalances.earned}</span></span>
                <span>Used: <span className="text-[#111827] font-medium font-mono">{compOffBalances.used}</span></span>
              </div>
            </div>

            <div className="text-xs text-[#6b7280] mt-2 flex justify-between tabular-nums">
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
