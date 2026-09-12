import React from 'react';

const DayCell = ({ dayData, isToday, onClick, onEdit = () => {} }) => {
  const { date, status, time } = dayData;
  
  // Extract day number from date
  const dayNumber = date ? new Date(date).getDate() : '';

  // Determine background color based on status
  const getBackgroundColor = () => {
    // Special case: WEEKEND or HOLIDAY with time logged
    if ((status === 'WEEKEND' || status === 'HOLIDAY') && time && time > 0) {
      return 'bg-purple-600';
    }

    switch (status) {
      case 'SHOW':
        return 'bg-green-500';
      case 'NO SHOW':
        return 'bg-red-500';
      case 'LEAVE':
        return 'bg-amber-500';
      case 'EXCEPTION':
        return 'bg-orange-500';
      case 'HOLIDAY':
        return 'bg-blue-500';
      case 'WEEKEND':
        return 'bg-gray-700';
      case 'EMPTY':
      default:
        return 'bg-gray-800';
    }
  };

  // Convert time to responsive display elements
  const renderTime = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return (
      <div className="text-[10px] md:text-xs bg-black bg-opacity-30 rounded px-1 md:px-2 py-0.5 md:py-1 text-white text-center mt-auto w-full truncate">
        <span className="hidden md:inline">{hours}h {mins}m</span>
        <span className="inline md:hidden">{hours}:{mins.toString().padStart(2, '0')}</span>
      </div>
    );
  };

  const renderBottomContent = () => {
    if (time && time > 0) {
      return renderTime(time);
    }
    if (status === 'LEAVE') {
      const isHalfDay = dayData?.leaveDuration === 0.5;
      const cat = dayData?.leaveCategory;
      let label = 'Leave';
      if (cat) {
        label = isHalfDay ? `${cat} - Half Day` : cat;
      } else if (isHalfDay) {
        label = 'Leave (0.5)';
      }
      return (
        <div
          className="text-[8.5px] md:text-xs bg-black bg-opacity-30 rounded px-1 md:px-1.5 py-0.5 text-white text-center mt-auto w-full truncate font-medium"
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
      } else if (excCat === 'OTHER') {
        label = 'Other';
      }
      return (
        <div
          className="text-[9px] md:text-xs bg-black bg-opacity-30 rounded px-1 md:px-2 py-0.5 md:py-1 text-white text-center mt-auto w-full truncate font-medium"
          title={excCat === 'PE' ? 'Personal Exigency (WFH)' : (excCat === 'OTHER' ? 'Other Exception' : 'Exception')}
        >
          {label}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${getBackgroundColor()}
        ${isToday ? 'ring-2 md:ring-4 ring-blue-400' : ''}
        p-1 md:p-2 min-h-[56px] md:min-h-[80px] rounded-md md:rounded-lg cursor-pointer
        hover:opacity-90 transition-opacity
        flex flex-col justify-between
        relative
        group
      `}
    >
      {/* Edit button absolute-positioned to save space */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-0.5 left-0.5 text-[10px] md:text-xs text-gray-400 hover:text-white bg-black bg-opacity-20 hover:bg-opacity-40 rounded p-0.5 md:p-1 transition-opacity md:opacity-0 md:group-hover:opacity-100 opacity-60"
        title="Edit day details"
      >
        ✏️
      </button>

      {/* Day number at the top right */}
      <div className="text-right font-semibold text-xs md:text-base text-white w-full pr-0.5 pt-0.5">
        {dayNumber}
      </div>

      {/* Time or status display at the bottom */}
      {renderBottomContent()}
    </div>
  );
};

export default DayCell;
