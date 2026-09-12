import React, { useState, useRef, useEffect } from 'react';
import DayCell from './DayCell';

const CalendarView = ({
  currentDate,
  calendarData,
  selectedDate,
  paintMode,
  onSelectDay,
  onDayClick,
  onNavigate,
  onDayEdit,
  onFillRemainingShow,
  onResetRemaining
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days of the week header
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
        time: null,
        leaveCategory: null,
        leaveDuration: null,
        exceptionCategory: null
      };
    }

    return {
      date: `${yearStr}-${monthStr}-${dayStr}`,
      status: dayData.status,
      time: dayData.time,
      originalStatus: dayData.originalStatus,
      leaveCategory: (dayData.status === 'LEAVE' ? dayData.leaveCategory : null) || dayData.originalLeaveCategory || null,
      leaveDuration: (dayData.status === 'LEAVE' ? dayData.leaveDuration : null) || dayData.originalLeaveDuration || null,
      originalLeaveCategory: dayData.originalLeaveCategory,
      originalLeaveDuration: dayData.originalLeaveDuration,
      exceptionCategory: (dayData.status === 'EXCEPTION' ? dayData.exceptionCategory : null) || dayData.originalExceptionCategory || null,
      originalExceptionCategory: dayData.originalExceptionCategory || null,
      earnedCompOff: dayData.earnedCompOff ?? false,
      originalEarnedCompOff: dayData.originalEarnedCompOff ?? false
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
      <div key={`empty-${i}`} className="min-h-[48px] md:min-h-[68px] rounded-lg"></div>
    );
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = getDayData(day);
    const isSelected = selectedDate === dayData.date;
    const isPaintActive = paintMode?.active ?? false;

    calendarDays.push(
      <DayCell
        key={day}
        dayData={dayData}
        isToday={isToday(day)}
        isSelected={isSelected}
        isPaintMode={isPaintActive}
        onClick={() => onSelectDay(dayData.date)}
        onEdit={() => onDayEdit(dayData.date)}
      />
    );
  }

  return (
    <div className="glass-card-strong p-2.5 md:p-5">
      {/* Header with navigation & overflow menu */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <button
          onClick={() => onNavigate('prev')}
          className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm md:text-base"
          title="Previous month"
        >
          ◀
        </button>

        <h2 className="text-base md:text-xl font-bold text-white tracking-tight">
          {monthNames[month]} {year}
        </h2>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('next')}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm md:text-base"
            title="Next month"
          >
            ▶
          </button>

          {/* Overflow menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-bold"
              title="More options"
            >
              ⋮
            </button>

            {isMenuOpen && (
              <div className="overflow-menu">
                <button
                  onClick={() => {
                    onFillRemainingShow();
                    setIsMenuOpen(false);
                  }}
                >
                  <span className="text-emerald-400">⚡</span>
                  <span>Fill remaining as Show</span>
                </button>
                <button
                  onClick={() => {
                    onResetRemaining();
                    setIsMenuOpen(false);
                  }}
                >
                  <span className="text-white/50">↺</span>
                  <span>Reset remaining</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1">
        {weekDays.map((day, i) => (
          <div key={`${day}-${i}`} className={`text-center font-semibold py-1 text-[10px] md:text-xs ${
            i === 0 || i === 6 ? 'text-white/25' : 'text-white/40'
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-1.5">
        {calendarDays}
      </div>
    </div>
  );
};

export default CalendarView;
