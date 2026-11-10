import React, { useRef } from 'react';

/**
 * ActionDock - Persistent Thumb-Zone Action Bar for Mobile & Desktop
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
    if (!selectedDayData) return { label: 'Empty', dot: 'bg-[#7a8296]' };
    const { status, leaveCategory, leaveDuration, exceptionCategory, earnedCompOff } = selectedDayData;

    if (status === 'SHOW') return { label: 'Office', dot: 'bg-[#4cc38a]' };
    if (status === 'NO SHOW') return { label: 'Absent', dot: 'bg-[#e5484d]' };
    if (status === 'LEAVE') {
      const dur = leaveDuration === 0.5 ? ' ½' : '';
      return { label: `${leaveCategory || 'Leave'}${dur}`, dot: 'bg-[#f59e0b]' };
    }
    if (status === 'EXCEPTION') {
      if (exceptionCategory === 'PE') return { label: 'WFH', dot: 'bg-[#ea580c]' };
      if (exceptionCategory === 'COMP_OFF') return { label: 'Comp Off', dot: 'bg-[#4cc38a]' };
      return { label: 'Other', dot: 'bg-[#ea580c]' };
    }
    if (status === 'HOLIDAY') {
      return { label: earnedCompOff ? 'Holiday CO' : 'Holiday', dot: 'bg-[#38bdf8]' };
    }
    if (status === 'WEEKEND') {
      return { label: earnedCompOff ? 'Weekend CO' : 'Weekend', dot: 'bg-[#7a8296]' };
    }
    return { label: 'Empty', dot: 'bg-[#7a8296]' };
  };

  // Handle pointer down for long press (Paint Mode)
  const handlePointerDown = (chip) => {
    if (chip.disabled) return;
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch (_) {}
      }
      onActivatePaintMode(chip);
    }, 400);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = (chip) => {
    if (chip.disabled) return;
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    if (paintMode?.active) {
      onActivatePaintMode(chip);
    } else {
      onApplyChip(selectedDate, chip);
    }
  };

  // Chips configuration with live balances
  const chips = [
    {
      id: 'SHOW',
      type: 'SHOW',
      label: 'Office',
      dotColor: 'bg-[#4cc38a]',
      disabled: false,
      badge: null
    },
    {
      id: 'WFH',
      type: 'EXCEPTION',
      exceptionCategory: 'PE',
      label: 'WFH',
      dotColor: 'bg-[#ea580c]',
      disabled: (exceptionStats?.available ?? 0) <= 0,
      badge: `${exceptionStats?.available ?? 0}`
    },
    {
      id: 'EL',
      type: 'LEAVE',
      leaveCategory: 'EL',
      label: 'EL',
      dotColor: 'bg-[#f59e0b]',
      disabled: (leaveBalances?.EL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.EL?.available ?? 0}`
    },
    {
      id: 'SL',
      type: 'LEAVE',
      leaveCategory: 'SL',
      label: 'SL',
      dotColor: 'bg-[#eab308]',
      disabled: (leaveBalances?.SL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.SL?.available ?? 0}`
    },
    {
      id: 'CL',
      type: 'LEAVE',
      leaveCategory: 'CL',
      label: 'CL',
      dotColor: 'bg-[#f43f5e]',
      disabled: (leaveBalances?.CL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.CL?.available ?? 0}`
    },
    {
      id: 'FL',
      type: 'LEAVE',
      leaveCategory: 'FL',
      label: 'FL',
      dotColor: 'bg-[#14b8a6]',
      disabled: (leaveBalances?.FL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.FL?.available ?? 0}`
    },
    {
      id: 'COMP_OFF',
      type: 'EXCEPTION',
      exceptionCategory: 'COMP_OFF',
      label: 'CO',
      dotColor: 'bg-[#4cc38a]',
      disabled: (compOffBalances?.available ?? 0) <= 0,
      badge: `${compOffBalances?.available ?? 0}`
    },
    {
      id: 'NO_SHOW',
      type: 'NO SHOW',
      label: 'Absent',
      dotColor: 'bg-[#e5484d]',
      disabled: false,
      badge: null
    },
    {
      id: 'CLEAR',
      type: 'CLEAR',
      label: 'Clear',
      dotColor: null,
      disabled: false,
      badge: null
    }
  ];

  const currentBadge = getCurrentStatusBadge();

  return (
    <div className="w-full p-2.5 md:p-3">
      {/* Top Header Row: Selected Date + Current Status OR Paint Mode Banner */}
      {paintMode?.active ? (
        <div className="flex items-center justify-between bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ededed]" />
            <span className="text-xs font-medium text-[#ededed]">
              Paint: <strong>{paintMode.chip?.label}</strong>
            </span>
            <span className="text-[11px] text-[#7a8296] hidden sm:inline">
              Tap days to apply
            </span>
          </div>
          <button
            onClick={onExitPaintMode}
            className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.12] text-[#ededed] text-xs font-medium rounded transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#ededed] tabular-nums">
              {formatDateDisplay(selectedDate)}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-xs text-[#a1a1a6]">
              <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dot}`} />
              <span>{currentBadge.label}</span>
            </div>
          </div>
          <button
            onClick={() => onOpenDetailedEdit(selectedDate)}
            className="text-xs font-medium text-[#a1a1a6] hover:text-[#ededed] transition-colors"
            title="Open editor"
          >
            Edit
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
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              disabled={chip.disabled}
              className={`
                relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors select-none
                ${chip.disabled
                  ? 'opacity-30 bg-transparent border-white/[0.04] text-[#7a8296] cursor-not-allowed'
                  : isCurrentActive
                  ? 'bg-[#ededed] text-[#0f1115] border-[#ededed]'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] text-[#ededed] active:scale-[0.98]'}
              `}
              title={
                chip.disabled
                  ? `${chip.label} (0 left)`
                  : `${chip.label} · Hold to paint`
              }
            >
              {chip.dotColor && !isCurrentActive && (
                <span className={`w-1.5 h-1.5 rounded-full ${chip.dotColor}`} />
              )}
              <span>{chip.label}</span>
              {chip.badge !== null && (
                <span className={`text-[10px] font-mono tabular-nums ${
                  isCurrentActive ? 'text-[#0f1115]/70' : 'text-[#7a8296]'
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
