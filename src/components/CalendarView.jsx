import React, { useState, useRef, useEffect } from 'react';
import DayCell from './DayCell';
import { IconChevronLeft, IconChevronRight, IconMore, IconZap, IconReset } from './Icons';

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
      <div key={`empty-${i}`} className="min-h-[52px] md:min-h-[68px] rounded-lg bg-transparent"></div>
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
    <div className="surface-card p-3 md:p-4">
      {/* Header with navigation & overflow menu */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onNavigate('prev')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#a1a1a6] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
          title="Previous month"
          aria-label="Previous month"
        >
          <IconChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="text-base md:text-lg font-semibold text-[#ededed] tracking-tight tabular-nums">
          {monthNames[month]} {year}
        </h2>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('next')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#a1a1a6] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
            title="Next month"
            aria-label="Next month"
          >
            <IconChevronRight className="w-4 h-4" />
          </button>

          {/* Overflow menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#a1a1a6] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
              title="More options"
              aria-label="More options"
            >
              <IconMore className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="overflow-menu">
                <button
                  onClick={() => {
                    onFillRemainingShow();
                    setIsMenuOpen(false);
                  }}
                >
                  <IconZap className="w-3.5 h-3.5 text-[#4cc38a]" />
                  <span>Mark remaining as Office</span>
                </button>
                <button
                  onClick={() => {
                    onResetRemaining();
                    setIsMenuOpen(false);
                  }}
                >
                  <IconReset className="w-3.5 h-3.5 text-[#a1a1a6]" />
                  <span>Reset upcoming days</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1.5">
        {weekDays.map((day, i) => (
          <div
            key={`${day}-${i}`}
            className={`text-center font-medium py-0.5 text-[11px] ${
              i === 0 || i === 6 ? 'text-[#7a8296]/60' : 'text-[#7a8296]'
            }`}
          >
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
