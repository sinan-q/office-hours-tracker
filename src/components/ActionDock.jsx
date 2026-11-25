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

  // Chips configuration with live balances (restrained semantic palette)
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
      dotColor: 'bg-[#fb923c]',
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
      dotColor: 'bg-[#f59e0b]',
      disabled: (leaveBalances?.SL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.SL?.available ?? 0}`
    },
    {
      id: 'CL',
      type: 'LEAVE',
      leaveCategory: 'CL',
      label: 'CL',
      dotColor: 'bg-[#f59e0b]',
      disabled: (leaveBalances?.CL?.available ?? 0) <= 0,
      badge: `${leaveBalances?.CL?.available ?? 0}`
    },
    {
      id: 'FL',
      type: 'LEAVE',
      leaveCategory: 'FL',
      label: 'FL',
      dotColor: 'bg-[#f59e0b]',
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
    <div className="w-full p-3">
      {/* Top Header Row: Selected Date + Current Status OR Paint Mode Banner */}
      {paintMode?.active ? (
        <div className="flex items-center justify-between bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3F51BD]" />
            <span className="text-xs font-medium text-[#1e1b4b]">
              Paint: <strong>{paintMode.chip?.label}</strong>
            </span>
            <span className="text-xs text-[#4f46e5] hidden sm:inline">
              Tap days to apply · Esc to exit
            </span>
          </div>
          <button
            onClick={onExitPaintMode}
            className="px-2.5 py-1 bg-[#3F51BD] hover:bg-[#33419c] text-white text-xs font-medium rounded transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium font-mono text-[#111827] tabular-nums">
              {formatDateDisplay(selectedDate)}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f3f4f6] border border-[#e5e7eb] text-xs text-[#4b5563]">
              <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dot}`} />
              <span>{currentBadge.label}</span>
            </div>
          </div>
          <button
            onClick={() => onOpenDetailedEdit(selectedDate)}
            className="text-xs font-medium text-[#3F51BD] hover:text-[#33419c] transition-colors"
            title="Open editor"
          >
            Edit details
          </button>
        </div>
      )}

      {/* Action Chips Grid */}
      <div className="flex flex-wrap gap-1.5 justify-center">
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
                relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors duration-150 select-none
                ${chip.disabled
                  ? 'opacity-40 bg-[#f9fafb] border-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                  : isCurrentActive
                  ? 'bg-[#3F51BD] text-white border-[#3F51BD]'
                  : 'bg-[#f9fafb] hover:bg-[#f3f4f6] border-[#e5e7eb] text-[#1f2937] active:scale-[0.98]'}
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
                <span className={`text-[11px] font-mono tabular-nums ${
                  isCurrentActive ? 'text-white/80' : 'text-[#6b7280]'
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
