import React, { useCallback, useRef } from 'react';

const DayCell = ({ dayData, isToday, isSelected = false, isPaintMode = false, onClick, onEdit = () => {} }) => {
  const { date, status, time } = dayData;
  const lastTapTime = useRef(0);
  const tapTimeout = useRef(null);

  const dayNumber = date ? String(new Date(date).getDate()).padStart(2, '0') : '';

  // Double-tap handler: first tap selects, second tap on already-selected day opens edit
  const handleClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    if (isPaintMode) {
      onClick();
      return;
    }

    if (isSelected && timeSinceLastTap < 400) {
      clearTimeout(tapTimeout.current);
      onEdit();
    } else {
      onClick();
    }

    lastTapTime.current = now;
  }, [isSelected, isPaintMode, onClick, onEdit]);

  // 2Office light status styling
  const getCellTheme = () => {
    if ((status === 'WEEKEND' || status === 'HOLIDAY') && time && time > 0) {
      return {
        bg: 'bg-[#eff6ff] border-[#bfdbfe]',
        dateBox: 'bg-[#3F51BD] text-white',
        topLabel: status === 'HOLIDAY' ? 'Holiday' : 'Weekend'
      };
    }

    switch (status) {
      case 'SHOW':
        return {
          bg: 'bg-white border-[#e5e7eb] hover:border-[#cbd5e1]',
          dateBox: 'bg-[#f3f4f6] text-[#111827]',
          topLabel: null
        };
      case 'NO SHOW':
        return {
          bg: 'bg-[#fff5f5] border-[#fecaca]',
          dateBox: 'bg-[#fee2e2] text-[#b91c1c]',
          topLabel: null
        };
      case 'LEAVE':
        return {
          bg: 'bg-[#f0fdf4] border-[#bbf7d0]',
          dateBox: 'bg-[#B0EEAE] text-[#14532d]',
          topLabel: dayData?.leaveCategory
            ? `${dayData.leaveCategory}${dayData?.leaveDuration === 0.5 ? ' ½' : ''}`
            : 'Leave'
        };
      case 'EXCEPTION':
        if (dayData?.exceptionCategory === 'COMP_OFF') {
          return {
            bg: 'bg-[#f0f9ff] border-[#bae6fd]',
            dateBox: 'bg-[#B2DDF9] text-[#0c4a6e]',
            topLabel: 'Comp Off'
          };
        }
        return {
          bg: 'bg-[#fff7ed] border-[#fed7aa]',
          dateBox: 'bg-[#FFC488] text-[#7c2d12]',
          topLabel: dayData?.exceptionCategory === 'PE' ? 'WFH' : 'Exception'
        };
      case 'HOLIDAY':
        return {
          bg: 'bg-[#fff1f2] border-[#fecdd3]',
          dateBox: 'bg-[#FCC1C1] text-[#881337]',
          topLabel: 'Branch Holiday'
        };
      case 'WEEKEND':
        return {
          bg: 'bg-[#f3f4f6] border-[#e5e7eb]',
          dateBox: 'bg-[#e5e7eb] text-[#6b7280]',
          topLabel: null
        };
      case 'EMPTY':
      default:
        return {
          bg: 'bg-white border-[#e5e7eb] hover:border-[#cbd5e1]',
          dateBox: 'bg-[#f3f4f6] text-[#4b5563]',
          topLabel: null
        };
    }
  };

  const theme = getCellTheme();

  const renderBottomContent = () => {
    if (time && time > 0) {
      const hours = Math.floor(time / 60);
      const mins = time % 60;
      const timeStr = `${hours}h ${mins}m`;
      const compactStr = `${hours}:${String(mins).padStart(2, '0')}`;
      return (
        <div className="mt-auto pt-1 text-left">
          <div className="hidden md:flex items-center gap-1 text-xs text-[#1f2937] font-medium truncate">
            <span>At Office</span>
            <span className="text-[#9ca3af]">|</span>
            <span className="font-mono tabular-nums text-[#374151]">{timeStr}</span>
          </div>
          <div className="flex md:hidden items-center justify-center rounded px-1 py-0.5 bg-[#f3f4f6] text-[11px] font-mono tabular-nums text-[#1f2937]">
            {compactStr}
          </div>
          {dayData?.earnedCompOff && (
            <div className="text-[11px] text-[#3F51BD] font-medium truncate hidden md:block">
              +1 Comp Off
            </div>
          )}
        </div>
      );
    }

    if (status === 'NO SHOW') {
      return (
        <div className="mt-auto pt-1 text-left">
          <span className="hidden md:inline text-xs font-medium text-[#dc2626]">
            No Show <span className="text-[#ef4444]/70">›››</span>
          </span>
          <span className="inline md:hidden text-[11px] font-medium text-[#dc2626]">
            Absent
          </span>
        </div>
      );
    }

    if ((status === 'HOLIDAY' || status === 'WEEKEND') && dayData?.earnedCompOff) {
      return (
        <div className="mt-auto pt-1 text-xs font-medium text-[#3F51BD] truncate">
          +1 CO
        </div>
      );
    }

    if (theme.topLabel) {
      return (
        <div className="mt-auto pt-1 text-[11px] md:hidden font-medium text-[#374151] truncate">
          {theme.topLabel}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      onClick={handleClick}
      className={`
        ${theme.bg}
        border
        ${isSelected
          ? 'ring-2 ring-[#3F51BD] border-[#3F51BD] z-10'
          : (isToday ? 'ring-1 ring-[#3F51BD]/60' : '')}
        ${isPaintMode ? 'cursor-crosshair' : 'cursor-pointer'}
        p-1.5 min-h-[68px] md:min-h-[92px] rounded-md
        transition-colors duration-150 select-none
        flex flex-col justify-between
        relative
      `}
    >
      {/* Top Row: Date Box + Status Label (Desktop) */}
      <div className="flex items-start gap-1.5">
        <div className={`w-6 h-6 md:w-7 md:h-7 rounded flex items-center justify-center text-xs font-mono font-medium shrink-0 ${theme.dateBox}`}>
          {dayNumber}
        </div>
        {theme.topLabel && (
          <span className="hidden md:inline text-xs font-medium text-[#374151] leading-tight pt-1 truncate">
            {theme.topLabel}
          </span>
        )}
        {isToday && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#3F51BD] ml-auto mt-1 shrink-0" title="Today" />
        )}
      </div>

      {/* Bottom Row: Office / Time / No Show */}
      {renderBottomContent()}
    </div>
  );
};

export default DayCell;
