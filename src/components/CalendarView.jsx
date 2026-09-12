import React from 'react';
import DayCell from './DayCell';

const CalendarView = ({ currentDate, calendarData, onDayClick, onNavigate, onDayEdit }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days of the week header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get day data from calendarData
  const getDayData = (day) => {
    const yearStr = year.toString();
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    
    const dayData = calendarData?.[yearStr]?.[monthStr]?.[dayStr];
    
    // Check if it's a weekend by default
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (!dayData) {
      return {
        date: `${yearStr}-${monthStr}-${dayStr}`,
        status: isWeekend ? 'WEEKEND' : 'EMPTY',
        time: null
      };
    }

    return {
      date: `${yearStr}-${monthStr}-${dayStr}`,
      status: dayData.status,
      time: dayData.time,
      originalStatus: dayData.originalStatus
    };
  };

  // Check if a date is today
  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Generate calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="bg-gray-900 min-h-[56px] md:min-h-[80px] rounded-md md:rounded-lg"></div>
    );
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = getDayData(day);
    calendarDays.push(
      <DayCell
        key={day}
        dayData={dayData}
        isToday={isToday(day)}
        onClick={() => onDayClick(dayData.date)}
        onEdit={() => onDayEdit(dayData.date)}
      />
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-2 md:p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button
          onClick={() => onNavigate('prev')}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold text-sm md:text-base"
        >
          ◀
        </button>
        <h2 className="text-lg md:text-2xl font-bold text-white">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={() => onNavigate('next')}
          className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold text-sm md:text-base"
        >
          ▶
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-400 py-1 md:py-2 text-[10px] sm:text-xs md:text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-700/60 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-gray-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-500 inline-block shadow-sm"></span>
          <span>Show</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500 inline-block shadow-sm"></span>
          <span>No Show</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500 inline-block shadow-sm"></span>
          <span>Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-500 inline-block shadow-sm"></span>
          <span>Exception</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block shadow-sm"></span>
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-600 inline-block shadow-sm"></span>
          <span>Worked Off-Day</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
