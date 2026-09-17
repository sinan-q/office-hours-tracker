import React, { useState } from 'react';
import {
  calculateAttendancePercentage,
  calculateAvgHoursTillYesterday,
  calculateAvgHoursNeeded,
  calculateDaysCanSkip
} from '../services/statsService';
import { calculateLeaveBalances, LEAVE_TYPES } from '../services/leaveService';
import { calculateExceptionStats } from '../services/exceptionService';
import { calculateCompOffBalances } from '../services/compOffService';

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
    ? 'text-white/40'
    : parseFloat(attendancePercentage) >= settings.minAttendancePercentage
      ? 'text-emerald-400'
      : 'text-red-400';

  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-white/40';
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-white/40';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    return totalMinutes >= settings.minHoursPerDay ? 'text-emerald-400' : 'text-red-400';
  };

  const avgColor = getAvgHoursColor();

  return (
    <button
      onClick={onOpenDrawer}
      className="w-full glass-card px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/[0.05] transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 text-[11px] md:text-xs font-medium overflow-x-auto no-scrollbar">
        {/* Attendance */}
        <span className={`font-bold ${attColor} whitespace-nowrap`}>
          {attendancePercentage === 'N/A' ? '—' : `${attendancePercentage}%`}
        </span>

        <span className="text-white/10">|</span>

        {/* Avg Hours (shown instead of skip) */}
        <span className="text-white/60 whitespace-nowrap">
          Avg <span className={`font-bold ${avgColor}`}>{avgHoursTillYesterday === 'N/A' ? '—' : avgHoursTillYesterday}</span>
        </span>

        <span className="text-white/10">|</span>

        {/* WFH */}
        <span className="text-orange-400/80 whitespace-nowrap">
          WFH <span className="font-bold text-orange-400">{exceptionStats?.available ?? 0}</span>
        </span>

        {/* Comp Off */}
        <span className="text-emerald-400/80 whitespace-nowrap">
          CO <span className="font-bold text-emerald-400">{compOffBalances?.available ?? 0}</span>
        </span>

        <span className="text-white/10">|</span>

        {/* Leave balances inline */}
        {Object.keys(LEAVE_TYPES).map((code) => (
          <span key={code} className="text-white/40 whitespace-nowrap">
            {code} <span className="font-bold text-white/60">{leaveBalances[code]?.available ?? 0}</span>
          </span>
        ))}
      </div>

      <span className="text-white/20 group-hover:text-white/40 transition-colors text-xs shrink-0 ml-1">
        ▼
      </span>
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
    if (attendancePercentage === 'N/A') return 'text-white/40';
    return parseFloat(attendancePercentage) >= settings.minAttendancePercentage
      ? 'text-emerald-400'
      : 'text-red-400';
  };

  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-white/40';
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-white/40';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    return totalMinutes >= settings.minHoursPerDay ? 'text-emerald-400' : 'text-red-400';
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

        <div className="px-5 pt-4 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Statistics</h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Top-level stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Attendance */}
            <div className="glass-card p-3">
              <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">Attendance</div>
              <div className={`text-2xl font-bold ${getAttendanceColor()}`}>
                {attendancePercentage === 'N/A' ? '—' : `${attendancePercentage}%`}
              </div>
              {attendancePercentage !== 'N/A' && (
                <div className="text-[10px] text-white/30 mt-0.5">Target: {settings.minAttendancePercentage}%</div>
              )}
            </div>

            {/* Avg Hours */}
            <div className="glass-card p-3">
              <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">Avg Hours</div>
              <div className={`text-2xl font-bold ${getAvgHoursColor()}`}>
                {avgHoursTillYesterday}
              </div>
              {avgHoursTillYesterday !== 'N/A' && (
                <div className="text-[10px] text-white/30 mt-0.5">
                  Target: {Math.floor(settings.minHoursPerDay / 60)}h {settings.minHoursPerDay % 60}m
                </div>
              )}
            </div>

            {/* Hours Needed */}
            {avgHoursNeeded?.average !== null && (
              <div className="glass-card p-3">
                <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">
                  Hrs Needed ({avgHoursNeeded.remainingDays}d)
                </div>
                <div className="text-2xl font-bold text-white">
                  {avgHoursNeeded.average}
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">
                  Total: {avgHoursNeeded.totalNeeded}
                </div>
              </div>
            )}

            {/* Days Can Skip */}
            {daysCanSkip !== null && (
              <div className="glass-card p-3">
                {daysCanSkip.needShowDays ? (
                  <>
                    <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">Need Extra</div>
                    <div className="text-2xl font-bold text-red-400">
                      {daysCanSkip.needShowDays}d
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">
                      Weekend days needed
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">Can Skip</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {daysCanSkip.canSkip}d
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">
                      Remaining: {daysCanSkip.emptyDaysLeft - daysCanSkip.canSkip}d
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Leave Balances */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-amber-400">Leave Balances</h3>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
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
                    className={`p-2.5 rounded-lg border transition-all ${
                      isExhausted
                        ? 'bg-white/[0.02] border-white/[0.04] text-white/30'
                        : 'bg-white/[0.03] border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-0.5">
                      <span className="text-white/60">{type.code}</span>
                      <span className="text-[9px] text-white/30 font-normal truncate max-w-[80px]">
                        {type.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-bold ${isExhausted ? 'text-white/30' : 'text-amber-400'}`}>
                        {data.available}
                      </span>
                      <span className="text-[10px] text-white/30">days</span>
                    </div>
                    <div className="text-[9px] text-white/25 mt-0.5 flex justify-between">
                      <span>Used: {data.used}</span>
                      {code === 'CL' && <span>Lapses Mar</span>}
                      {code === 'FL' && <span>Lapses Dec</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasConfiguredLeaves && (
              <p className="text-[10px] text-white/25 mt-2 italic text-center">
                Set your starting balances in Settings.
              </p>
            )}
          </div>

          {/* WFH / Personal Exigency */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-orange-400">Personal Exigencies (WFH)</h3>
              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-orange-500/15 text-orange-300/80 rounded">
                {exceptionStats.quarterCode}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${exceptionStats.isExhausted ? 'text-white/30' : 'text-orange-400'}`}>
                  {exceptionStats.available}
                </span>
                <span className="text-xs text-white/30">/ {exceptionStats.quota} left</span>
              </div>
              <span className="text-xs text-white/30">Used: <strong className="text-white/60">{exceptionStats.used}</strong></span>
            </div>

            <p className="text-[10px] text-white/25 mt-1.5">
              {exceptionStats.quarterName} · {exceptionStats.quota}/quarter, no carry forward
            </p>
          </div>

          {/* Comp Off */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-emerald-400">Comp Off Balance</h3>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Configure
                </button>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${compOffBalances.isExhausted ? 'text-white/30' : 'text-emerald-400'}`}>
                  {compOffBalances.available}
                </span>
                <span className="text-xs text-white/30">days available</span>
              </div>
              <div className="text-xs text-white/30 space-x-2">
                <span>Earned: <strong className="text-emerald-300/80">+{compOffBalances.earned}</strong></span>
                <span>Used: <strong className="text-white/60">{compOffBalances.used}</strong></span>
              </div>
            </div>

            <div className="text-[10px] text-white/25 mt-1.5 flex justify-between">
              <span>Starting: {compOffBalances.startingBalance}</span>
              <span>Indefinite carry forward</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


/**
 * StatsPanel — Legacy export for backward compatibility
 * (Delegates to StatsDrawer content rendered inline)
 */
const StatsPanel = ({ appData, currentDate, onOpenSettings }) => {
  return (
    <div className="space-y-4">
      <StatsStrip appData={appData} currentDate={currentDate} onOpenDrawer={() => {}} />
    </div>
  );
};

export default StatsPanel;
