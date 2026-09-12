import React, { useRef } from 'react';

/**
 * ActionDock - Persistent Thumb-Zone Action Bar for Mobile & Desktop
 * 
 * Features:
 * - 1-tap chip application for Office, WFH, EL, SL, CL, FL, Comp Off, No Show, Clear.
 * - Long-press on any chip activates "Stamp / Paint Mode".
 * - Live remaining balances/quotas on each chip with auto-exhaustion disabling.
 * - Selected day indicator with current status.
 */
const ActionDock = ({
  selectedDate,
  selectedDayData,
  leaveBalances,
  exceptionStats,
  compOffBalances,
  paintMode,
  onApplyChip,
  onActivatePaintMode,
  onExitPaintMode,
  onOpenDetailedEdit
}) => {
  const longPressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);

  // Format date display (e.g. "Mon, Sep 15")
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Select a date';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get human-readable badge for the day's current status
  const getCurrentStatusBadge = () => {
    if (!selectedDayData) return { label: 'Empty', color: 'bg-white/[0.06] text-white/40' };
    const { status, leaveCategory, leaveDuration, exceptionCategory, earnedCompOff } = selectedDayData;

    if (status === 'SHOW') return { label: 'Office', color: 'bg-emerald-500/20 text-emerald-400' };
    if (status === 'NO SHOW') return { label: 'No Show', color: 'bg-red-500/20 text-red-400' };
    if (status === 'LEAVE') {
      const dur = leaveDuration === 0.5 ? ' ½' : '';
      return { label: `${leaveCategory || 'Leave'}${dur}`, color: 'bg-amber-500/20 text-amber-400' };
    }
    if (status === 'EXCEPTION') {
      if (exceptionCategory === 'PE') return { label: 'WFH', color: 'bg-orange-500/20 text-orange-400' };
      if (exceptionCategory === 'COMP_OFF') return { label: 'Comp Off', color: 'bg-emerald-500/20 text-emerald-400' };
      return { label: 'Other', color: 'bg-orange-500/20 text-orange-400' };
    }
    if (status === 'HOLIDAY') {
      return { label: earnedCompOff ? 'Holiday CO' : 'Holiday', color: 'bg-blue-500/20 text-blue-400' };
    }
    if (status === 'WEEKEND') {
      return { label: earnedCompOff ? 'Weekend CO' : 'Weekend', color: 'bg-white/[0.06] text-white/40' };
    }
    return { label: 'Empty', color: 'bg-white/[0.06] text-white/40' };
  };

  // Handle pointer down for long press (Paint Mode)
  const handlePointerDown = (chip) => {
    if (chip.disabled) return;
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      if (navigator.vibrate) {
        try { navigator.vibrate(50); } catch (_) {}
      }
      onActivatePaintMode(chip);
    }, 450); // 450ms long-press threshold
  };

  const handlePointerUp = (chip) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = (chip) => {
    if (chip.disabled) return;
    // If long press was triggered, don't execute regular click
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    if (paintMode?.active) {
      // If already in paint mode, clicking a chip switches the active brush
      onActivatePaintMode(chip);
    } else {
      // Normal 1-tap apply to selected date
      onApplyChip(selectedDate, chip);
    }
  };

  // Define Chips configuration with live balances
  const chips = [
    {
      id: 'SHOW',
      type: 'SHOW',
      label: 'Office',
      accent: 'emerald',
      color: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25',
      activeColor: 'bg-emerald-500 text-white border-emerald-400',
      disabled: false,
      badge: null
    },
    {
      id: 'WFH',
      type: 'EXCEPTION',
      exceptionCategory: 'PE',
      label: 'WFH',
      accent: 'orange',
      color: 'bg-orange-500/15 border-orange-500/25 text-orange-400 hover:bg-orange-500/25',
      activeColor: 'bg-orange-500 text-white border-orange-400',
      disabled: (exceptionStats?.available ?? 0) <= 0,
      badge: `${exceptionStats?.available ?? 0}`
    },
    {
      id: 'EL',
      type: 'LEAVE',
      leaveCategory: 'EL',
      label: 'EL',
      accent: 'amber',
      color: 'bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25',
      activeColor: 'bg-amber-500 text-white border-amber-400',
      disabled: (leaveBalances?.EL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.EL?.available ?? 0}`
    },
    {
      id: 'SL',
      type: 'LEAVE',
      leaveCategory: 'SL',
      label: 'SL',
      accent: 'yellow',
      color: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-300 hover:bg-yellow-500/25',
      activeColor: 'bg-yellow-500 text-white border-yellow-400',
      disabled: (leaveBalances?.SL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.SL?.available ?? 0}`
    },
    {
      id: 'CL',
      type: 'LEAVE',
      leaveCategory: 'CL',
      label: 'CL',
      accent: 'rose',
      color: 'bg-rose-500/15 border-rose-500/25 text-rose-400 hover:bg-rose-500/25',
      activeColor: 'bg-rose-500 text-white border-rose-400',
      disabled: (leaveBalances?.CL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.CL?.available ?? 0}`
    },
    {
      id: 'FL',
      type: 'LEAVE',
      leaveCategory: 'FL',
      label: 'FL',
      accent: 'teal',
      color: 'bg-teal-500/15 border-teal-500/25 text-teal-400 hover:bg-teal-500/25',
      activeColor: 'bg-teal-500 text-white border-teal-400',
      disabled: (leaveBalances?.FL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.FL?.available ?? 0}`
    },
    {
      id: 'COMP_OFF',
      type: 'EXCEPTION',
      exceptionCategory: 'COMP_OFF',
      label: 'CO',
      accent: 'emerald',
      color: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25',
      activeColor: 'bg-emerald-500 text-white border-emerald-400',
      disabled: (compOffBalances?.available ?? 0) <= 0,
      badge: `${compOffBalances?.available ?? 0}`
    },
    {
      id: 'NO_SHOW',
      type: 'NO SHOW',
      label: 'Off',
      accent: 'red',
      color: 'bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25',
      activeColor: 'bg-red-500 text-white border-red-400',
      disabled: false,
      badge: null
    },
    {
      id: 'CLEAR',
      type: 'CLEAR',
      label: 'Clear',
      accent: 'gray',
      color: 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.08]',
      activeColor: 'bg-white/20 text-white border-white/30',
      disabled: false,
      badge: null
    }
  ];

  const currentBadge = getCurrentStatusBadge();

  return (
    <div className="w-full p-2.5 md:p-3 transition-all">
      {/* Top Header Row: Selected Date + Current Status OR Paint Mode Banner */}
      {paintMode?.active ? (
        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/25 rounded-lg px-3 py-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-300">
              Paint: <strong className="text-white">{paintMode.chip?.label}</strong>
            </span>
            <span className="text-[10px] text-indigo-300/60 hidden sm:inline">
              — tap calendar days to apply
            </span>
          </div>
          <button
            onClick={onExitPaintMode}
            className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-semibold rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/70">
              {formatDateDisplay(selectedDate)}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${currentBadge.color}`}>
              {currentBadge.label}
            </span>
          </div>
          <button
            onClick={() => onOpenDetailedEdit(selectedDate)}
            className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors"
            title="Open full editor (or double-tap a day)"
          >
            Edit →
          </button>
        </div>
      )}

      {/* Action Chips Grid */}
      <div className="flex flex-wrap gap-1 md:gap-1.5 justify-center">
        {chips.map((chip) => {
          const isCurrentActive = paintMode?.active && paintMode?.chip?.id === chip.id;

          return (
            <button
              key={chip.id}
              onClick={() => handleClick(chip)}
              onPointerDown={() => handlePointerDown(chip)}
              onPointerUp={() => handlePointerUp(chip)}
              onPointerLeave={() => handlePointerUp(chip)}
              disabled={chip.disabled}
              className={`
                relative flex items-center gap-1 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg border text-center transition-all duration-150 select-none
                ${chip.disabled
                  ? 'opacity-30 bg-white/[0.02] border-white/[0.04] text-white/30 cursor-not-allowed'
                  : isCurrentActive
                  ? `${chip.activeColor} ring-1 ring-indigo-400 shadow-sm scale-105`
                  : `${chip.color} active:scale-95`}
              `}
              title={
                chip.disabled
                  ? `${chip.label} (0 left)`
                  : `Tap to apply · Hold for paint mode`
              }
            >
              <span className="text-[11px] md:text-xs font-semibold leading-none">
                {chip.label}
              </span>
              {chip.badge !== null && (
                <span className={`text-[9px] md:text-[10px] font-bold leading-none ${
                  chip.disabled ? 'text-red-400/60' : 'opacity-60'
                }`}>
                  {chip.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActionDock;
