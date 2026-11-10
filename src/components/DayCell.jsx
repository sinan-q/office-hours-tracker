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

  // Restrained semantic status styling from the direction
  const getCellTheme = () => {
    // Special case: WEEKEND or HOLIDAY with time logged
    if ((status === 'WEEKEND' || status === 'HOLIDAY') && time && time > 0) {
      return {
        bg: 'bg-[#1b172a] border-[#382b52]',
        badgeBg: 'bg-[#291f42] text-[#c4b5fd]'
      };
    }

    switch (status) {
      case 'SHOW':
        return {
          bg: 'bg-[#121c17] border-[#1d3527]',
          badgeBg: 'bg-[#193223] text-[#6ee7b7]'
        };
      case 'NO SHOW':
        return {
          bg: 'bg-[#211417] border-[#3f1e24]',
          badgeBg: 'bg-[#3b171f] text-[#fca5a5]'
        };
      case 'LEAVE':
        return {
          bg: 'bg-[#211b13] border-[#3d2e18]',
          badgeBg: 'bg-[#352512] text-[#fcd34d]'
        };
      case 'EXCEPTION':
        return {
          bg: 'bg-[#211812] border-[#3d2716]',
          badgeBg: 'bg-[#382012] text-[#fdba74]'
        };
      case 'HOLIDAY':
        return {
          bg: 'bg-[#141b27] border-[#1f2d42]',
          badgeBg: 'bg-[#1b2b43] text-[#93c5fd]'
        };
      case 'WEEKEND':
        return {
          bg: 'bg-[#0f1117] border-white/[0.03]',
          badgeBg: 'bg-white/[0.04] text-[#a1a1a6]'
        };
      case 'EMPTY':
      default:
        return {
          bg: 'bg-[#141720] border-white/[0.05]',
          badgeBg: 'bg-white/[0.04] text-[#7a8296]'
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
          ? 'ring-1 ring-[#ededed] border-white/20 z-10'
          : (isToday ? 'ring-1 ring-white/30' : '')}
        ${isPaintMode ? 'cursor-crosshair' : 'cursor-pointer'}
        p-1 md:p-1.5 min-h-[52px] md:min-h-[68px] rounded-lg
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
        <span className={`text-[11px] md:text-xs font-medium tabular-nums ${
          status === 'EMPTY' || status === 'WEEKEND' ? 'text-[#7a8296]' : 'text-[#ededed]'
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
