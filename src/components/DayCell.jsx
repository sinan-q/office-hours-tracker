import React from 'react';

const DayCell = ({ dayData, isToday, onClick }) => {
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
      case 'EXCEPTION':
        return 'bg-yellow-500';
      case 'HOLIDAY':
        return 'bg-blue-500';
      case 'WEEKEND':
        return 'bg-gray-700';
      case 'EMPTY':
      default:
        return 'bg-gray-800';
    }
  };

  // Convert time to hours and minutes display
  const formatTime = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const timeDisplay = formatTime(time);

  return (
    <div
      onClick={onClick}
      className={`
        ${getBackgroundColor()}
        ${isToday ? 'ring-4 ring-blue-400' : ''}
        p-2 min-h-[80px] rounded-lg cursor-pointer
        hover:opacity-90 transition-opacity
        flex flex-col justify-between
        relative
      `}
    >
      <div className="text-right font-semibold text-white">
        {dayNumber}
      </div>
      {timeDisplay && (
        <div className="text-xs bg-black bg-opacity-30 rounded px-2 py-1 text-white text-center">
          {timeDisplay}
        </div>
      )}
    </div>
  );
};

export default DayCell;
