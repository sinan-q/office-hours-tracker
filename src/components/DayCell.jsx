import React, { useCallback, useRef } from 'react';

const DayCell = ({ dayData, isToday, isSelected = false, isPaintMode = false, onClick, onEdit = () => {} }) => {
  const { date, status, time } = dayData;
  const lastTapTime = useRef(0);
  const tapTimeout = useRef(null);

  // Extract day number from date
  const dayNumber = date ? new Date(date).getDate() : '';

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

  // Quiet Graphite surface styling — status carries via the bottom stamp
  const getCellTheme = () => {
    // Weekend or Holiday with logged time (no purple slop)
    if ((status === 'WEEKEND' || status === 'HOLIDAY') && time && time > 0) {
      return {
        bg: 'bg-[#1a1d1b] border-[#4cc38a]/25',
        badgeBg: 'bg-[#4cc38a]/15 text-[#4cc38a]'
      };
    }

    switch (status) {
      case 'SHOW':
        return {
          bg: 'bg-[#161c18] border-[#4cc38a]/20',
          badgeBg: 'bg-[#4cc38a]/15 text-[#4cc38a]'
        };
      case 'NO SHOW':
        return {
          bg: 'bg-[#1c1617] border-[#e5484d]/20',
          badgeBg: 'bg-[#e5484d]/15 text-[#e5484d]'
        };
      case 'LEAVE':
        return {
          bg: 'bg-[#1c1a16] border-[#f59e0b]/20',
          badgeBg: 'bg-[#f59e0b]/15 text-[#f59e0b]'
        };
      case 'EXCEPTION':
        return {
          bg: 'bg-[#1c1816] border-[#ea580c]/20',
          badgeBg: 'bg-[#ea580c]/15 text-[#fb923c]'
        };
      case 'HOLIDAY':
        return {
          bg: 'bg-[#16191e] border-[#38bdf8]/20',
          badgeBg: 'bg-[#38bdf8]/15 text-[#7dd3fc]'
        };
      case 'WEEKEND':
        return {
          bg: 'bg-[#141415] border-white/[0.04]',
          badgeBg: 'bg-white/[0.05] text-[#a1a1a6]'
        };
      case 'EMPTY':
      default:
        return {
          bg: 'bg-[#19191b] border-white/[0.06]',
          badgeBg: 'bg-white/[0.05] text-[#85858b]'
        };
    }
  };

  const theme = getCellTheme();

  // Convert time to clean tabular display
  const renderTime = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const suffix = dayData?.earnedCompOff ? ' CO' : '';
    return (
      <div className={`text-[10px] md:text-[11px] font-medium rounded px-1 py-0.5 text-center mt-auto w-full truncate leading-tight tabular-nums font-mono ${theme.badgeBg}`}>
        <span className="hidden md:inline">{hours}h {mins}m{suffix}</span>
        <span className="inline md:hidden">{hours}:{mins.toString().padStart(2, '0')}{suffix}</span>
      </div>
    );
  };

  const renderBottomContent = () => {
    if (time && time > 0) {
      return renderTime(time);
    }
    if (status === 'HOLIDAY' && dayData?.earnedCompOff) {
      return (
        <div className={`text-[10px] md:text-[11px] font-medium rounded px-1 py-0.5 text-center mt-auto w-full truncate leading-tight ${theme.badgeBg}`} title="Holiday (Earned Comp Off)">
          Holiday CO
        </div>
      );
    }
    if (status === 'WEEKEND' && dayData?.earnedCompOff) {
      return (
        <div className={`text-[10px] md:text-[11px] font-medium rounded px-1 py-0.5 text-center mt-auto w-full truncate leading-tight ${theme.badgeBg}`} title="Weekend (Earned Comp Off)">
          Wknd CO
        </div>
      );
    }
    if (status === 'LEAVE') {
      const isHalfDay = dayData?.leaveDuration === 0.5;
      const cat = dayData?.leaveCategory;
      let label = 'Leave';
      if (cat) {
        label = isHalfDay ? `${cat} ½` : cat;
      } else if (isHalfDay) {
        label = 'Leave ½';
      }
      return (
        <div className={`text-[10px] md:text-[11px] font-medium rounded px-1 py-0.5 text-center mt-auto w-full truncate leading-tight ${theme.badgeBg}`} title={label}>
          {label}
        </div>
      );
    }
    if (status === 'EXCEPTION') {
      const excCat = dayData?.exceptionCategory;
      let label = 'Exception';
      if (excCat === 'PE') {
        label = 'WFH';
      } else if (excCat === 'COMP_OFF') {
        label = 'Comp Off';
      } else if (excCat === 'OTHER') {
        label = 'Other';
      }
      return (
        <div className={`text-[10px] md:text-[11px] font-medium rounded px-1 py-0.5 text-center mt-auto w-full truncate leading-tight ${theme.badgeBg}`} title={label}>
          {label}
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
          ? 'ring-1 ring-[#ededed] border-[#ededed]/30 z-10'
          : (isToday ? 'ring-1 ring-white/25' : '')}
        ${isPaintMode ? 'cursor-crosshair' : 'cursor-pointer'}
        p-1 md:p-1.5 min-h-[56px] md:min-h-[72px] rounded-lg
        transition-colors duration-150 select-none
        flex flex-col justify-between
        relative
      `}
    >
      {/* Day number at the top right */}
      <div className="flex items-center justify-between">
        {isToday ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#ededed] ml-0.5" title="Today" />
        ) : (
          <span />
        )}
        <span className={`text-xs font-medium font-mono tabular-nums ${
          status === 'EMPTY' || status === 'WEEKEND' ? 'text-[#85858b]' : 'text-[#ededed]'
        }`}>
          {dayNumber}
        </span>
      </div>

      {/* Time or status display at the bottom */}
      {renderBottomContent()}
    </div>
  );
};

export default DayCell;
