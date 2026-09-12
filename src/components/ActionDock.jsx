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
    if (!selectedDayData) return { label: 'Empty', color: 'bg-gray-700 text-gray-300' };
    const { status, leaveCategory, leaveDuration, exceptionCategory, earnedCompOff } = selectedDayData;

    if (status === 'SHOW') return { label: 'Office (SHOW)', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (status === 'NO SHOW') return { label: 'No Show', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (status === 'LEAVE') {
      const dur = leaveDuration === 0.5 ? ' (0.5)' : '';
      return { label: `${leaveCategory || 'Leave'}${dur}`, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    }
    if (status === 'EXCEPTION') {
      if (exceptionCategory === 'PE') return { label: 'WFH', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      if (exceptionCategory === 'COMP_OFF') return { label: 'Comp Off', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      return { label: 'Other', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    }
    if (status === 'HOLIDAY') {
      return { label: earnedCompOff ? 'Holiday (CO)' : 'Holiday', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
    if (status === 'WEEKEND') {
      return { label: earnedCompOff ? 'Weekend (CO)' : 'Weekend', color: 'bg-gray-700/60 text-gray-300 border-gray-600/40' };
    }
    return { label: 'Empty', color: 'bg-gray-800 text-gray-400 border-gray-700' };
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
      icon: '🏢',
      color: 'bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600/30',
      activeColor: 'bg-green-600 text-white border-green-400 shadow-green-500/30',
      disabled: false,
      badge: null
    },
    {
      id: 'WFH',
      type: 'EXCEPTION',
      exceptionCategory: 'PE',
      label: 'WFH',
      icon: '🏠',
      color: 'bg-orange-600/20 border-orange-500/40 text-orange-300 hover:bg-orange-600/30',
      activeColor: 'bg-orange-600 text-white border-orange-400 shadow-orange-500/30',
      disabled: (exceptionStats?.available ?? 0) <= 0,
      badge: `${exceptionStats?.available ?? 0}`
    },
    {
      id: 'EL',
      type: 'LEAVE',
      leaveCategory: 'EL',
      label: 'EL',
      icon: '🏖️',
      color: 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30',
      activeColor: 'bg-amber-600 text-white border-amber-400 shadow-amber-500/30',
      disabled: (leaveBalances?.EL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.EL?.available ?? 0}`
    },
    {
      id: 'SL',
      type: 'LEAVE',
      leaveCategory: 'SL',
      label: 'SL',
      icon: '🤒',
      color: 'bg-yellow-600/20 border-yellow-500/40 text-yellow-300 hover:bg-yellow-600/30',
      activeColor: 'bg-yellow-600 text-white border-yellow-400 shadow-yellow-500/30',
      disabled: (leaveBalances?.SL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.SL?.available ?? 0}`
    },
    {
      id: 'CL',
      type: 'LEAVE',
      leaveCategory: 'CL',
      label: 'CL',
      icon: '☕',
      color: 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30',
      activeColor: 'bg-rose-600 text-white border-rose-400 shadow-rose-500/30',
      disabled: (leaveBalances?.CL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.CL?.available ?? 0}`
    },
    {
      id: 'FL',
      type: 'LEAVE',
      leaveCategory: 'FL',
      label: 'FL',
      icon: '🌴',
      color: 'bg-teal-600/20 border-teal-500/40 text-teal-300 hover:bg-teal-600/30',
      activeColor: 'bg-teal-600 text-white border-teal-400 shadow-teal-500/30',
      disabled: (leaveBalances?.FL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.FL?.available ?? 0}`
    },
    {
      id: 'COMP_OFF',
      type: 'EXCEPTION',
      exceptionCategory: 'COMP_OFF',
      label: 'Comp Off',
      icon: '🎁',
      color: 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30',
      activeColor: 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30',
      disabled: (compOffBalances?.available ?? 0) <= 0,
      badge: `${compOffBalances?.available ?? 0}`
    },
    {
      id: 'NO_SHOW',
      type: 'NO SHOW',
      label: 'No Show',
      icon: '🚫',
      color: 'bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600/30',
      activeColor: 'bg-red-600 text-white border-red-400 shadow-red-500/30',
      disabled: false,
      badge: null
    },
    {
      id: 'CLEAR',
      type: 'CLEAR',
      label: 'Clear',
      icon: '✖',
      color: 'bg-gray-700/60 border-gray-600/40 text-gray-300 hover:bg-gray-700',
      activeColor: 'bg-gray-600 text-white border-gray-400',
      disabled: false,
      badge: null
    }
  ];

  const currentBadge = getCurrentStatusBadge();

  return (
    <div className="w-full bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-2xl shadow-2xl p-3 md:p-4 transition-all">
      {/* Top Header Row: Selected Date + Current Status OR Paint Mode Banner */}
      {paintMode?.active ? (
        <div className="flex items-center justify-between bg-indigo-950/50 border border-indigo-500/40 rounded-xl px-3 py-2 mb-2.5 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">🖌️</span>
            <div>
              <span className="text-xs md:text-sm font-semibold text-indigo-300">
                Paint Mode Active: <strong className="text-white">{paintMode.chip?.label}</strong>
              </span>
              <p className="text-[10px] text-indigo-300/70">
                Tap any calendar dates to apply immediately
              </p>
            </div>
          </div>
          <button
            onClick={onExitPaintMode}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1"
          >
            <span>Done</span>
            <span>✕</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-200">
              📅 {formatDateDisplay(selectedDate)}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentBadge.color}`}>
              {currentBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDetailedEdit(selectedDate)}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              title="Open full editor for hours, half-day, or comp off"
            >
              <span>✏️ More...</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Chips Grid: 1-tap apply, long-press to paint */}
      <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 md:gap-2">
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
                relative flex flex-col items-center justify-center p-1.5 md:p-2 rounded-xl border text-center transition-all select-none
                ${chip.disabled
                  ? 'opacity-35 bg-gray-800/40 border-gray-700/30 text-gray-500 cursor-not-allowed'
                  : isCurrentActive
                  ? `${chip.activeColor} ring-2 ring-indigo-400 shadow-md scale-105`
                  : `${chip.color} active:scale-95`}
              `}
              title={
                chip.disabled
                  ? `${chip.label} (Exhausted / 0 left)`
                  : `Tap: Apply to ${formatDateDisplay(selectedDate)} · Hold: Paint Mode`
              }
            >
              <span className="text-sm md:text-base leading-none mb-1">
                {chip.icon}
              </span>
              <span className="text-[10px] md:text-xs font-semibold truncate w-full leading-tight">
                {chip.label}
              </span>
              {chip.badge !== null && (
                <span className={`text-[9px] font-bold px-1 rounded-full mt-0.5 ${
                  chip.disabled ? 'bg-red-950/60 text-red-400' : 'bg-black/40 text-gray-300'
                }`}>
                  {chip.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-[9.5px] text-gray-400 text-center mt-2 font-medium">
        💡 Tap a date $\rightarrow$ tap chip to apply &nbsp;·&nbsp; <strong>Long-press any chip</strong> for Paint Mode
      </p>
    </div>
  );
};

export default ActionDock;
