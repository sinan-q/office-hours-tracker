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
      // In paint mode, just forward the click immediately
      onClick();
      return;
    }

    if (isSelected && timeSinceLastTap < 400) {
      // Double-tap on the already-selected day → open editor
      clearTimeout(tapTimeout.current);
      onEdit();
    } else {
      // Single tap → select the day
      onClick();
    }

    lastTapTime.current = now;
  }, [isSelected, isPaintMode, onClick, onEdit]);

  // Determine background color based on status
  const getBackgroundColor = () => {
    // Special case: WEEKEND or HOLIDAY with time logged
    if ((status === 'WEEKEND' || status === 'HOLIDAY') && time && time > 0) {
      return 'bg-purple-500/80';
    }

    switch (status) {
      case 'SHOW':
        return 'bg-emerald-500/80';
      case 'NO SHOW':
        return 'bg-red-400/70';
      case 'LEAVE':
        return 'bg-amber-500/75';
      case 'EXCEPTION':
        return 'bg-orange-500/75';
      case 'HOLIDAY':
        return 'bg-blue-500/70';
      case 'WEEKEND':
        return 'bg-white/[0.04]';
      case 'EMPTY':
      default:
        return 'bg-white/[0.03]';
    }
  };

  // Convert time to responsive display elements
  const renderTime = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const suffix = dayData?.earnedCompOff ? ' CO' : '';
    return (
      <div className="text-[9px] md:text-[11px] font-medium bg-black/25 rounded px-1 py-0.5 text-white/90 text-center mt-auto w-full truncate leading-tight">
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
        <div
          className="text-[8px] md:text-[11px] font-medium bg-black/25 rounded px-1 py-0.5 text-white/90 text-center mt-auto w-full truncate leading-tight"
          title="Holiday (Earned Comp Off)"
        >
          Holiday CO
        </div>
      );
    }
    if (status === 'WEEKEND' && dayData?.earnedCompOff) {
      return (
        <div
          className="text-[8px] md:text-[11px] font-medium bg-black/25 rounded px-1 py-0.5 text-white/90 text-center mt-auto w-full truncate leading-tight"
          title="Weekend (Earned Comp Off)"
        >
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
        <div
          className="text-[8px] md:text-[11px] font-medium bg-black/25 rounded px-1 py-0.5 text-white/90 text-center mt-auto w-full truncate leading-tight"
          title={label}
        >
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
        <div
          className="text-[8px] md:text-[11px] font-medium bg-black/25 rounded px-1 py-0.5 text-white/90 text-center mt-auto w-full truncate leading-tight"
          title={excCat === 'PE' ? 'Personal Exigency (WFH)' : (excCat === 'COMP_OFF' ? 'Comp Off' : (excCat === 'OTHER' ? 'Other Exception' : 'Exception'))}
        >
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
        ${getBackgroundColor()}
        ${isSelected
          ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-[#0f1419] shadow-lg shadow-blue-500/10 scale-[1.04] z-10'
          : (isToday ? 'ring-1.5 ring-white/30' : '')}
        ${isPaintMode ? 'cursor-crosshair hover:scale-105 active:scale-95' : 'cursor-pointer hover:brightness-110 active:scale-[0.97]'}
        p-1 md:p-1.5 min-h-[48px] md:min-h-[68px] rounded-lg
        transition-all duration-150 select-none
        flex flex-col justify-between
        relative
      `}
    >
      {/* Day number at the top right */}
      <div className={`text-right font-semibold text-[11px] md:text-sm leading-none pr-0.5 ${
        status === 'EMPTY' || status === 'WEEKEND' ? 'text-white/40' : 'text-white/90'
      }`}>
        {dayNumber}
      </div>

      {/* Time or status display at the bottom */}
      {renderBottomContent()}
    </div>
  );
};

export default DayCell;
