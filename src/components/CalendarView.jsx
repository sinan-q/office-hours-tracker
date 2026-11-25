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

  // Monday-first week offset (0 = Mon, 6 = Sun)
  const firstDaySunday = new Date(year, month, 1).getDay();
  const leadingEmptyDays = (firstDaySunday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Days of the week header (Monday - Sunday like 2Office)
  const weekDaysDesktop = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDaysMobile = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const today = new Date();
  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

  // Generate calendar grid (leading prev-month days, current month, trailing next-month days)
  const calendarDays = [];

  for (let i = leadingEmptyDays - 1; i >= 0; i--) {
    const prevDay = prevMonthLastDay - i;
    calendarDays.push(
      <div
        key={`prev-${prevDay}`}
        className="min-h-[68px] md:min-h-[92px] rounded-md bg-[#f8f9fa] border border-[#e5e7eb] p-1.5 flex flex-col justify-between opacity-65 select-none"
      >
        <div className="w-7 h-7 rounded bg-[#e5e7eb]/70 text-[#6b7280] flex items-center justify-center text-xs font-mono font-medium">
          {String(prevDay).padStart(2, '0')}
        </div>
      </div>
    );
  }

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

  const totalCells = leadingEmptyDays + daysInMonth;
  const trailingDays = (7 - (totalCells % 7)) % 7;
  const nextMonthShort = shortMonthNames[(month + 1) % 12];
  for (let d = 1; d <= trailingDays; d++) {
    calendarDays.push(
      <div
        key={`next-${d}`}
        className="min-h-[68px] md:min-h-[92px] rounded-md bg-[#f8f9fa] border border-[#e5e7eb] p-1.5 flex flex-col justify-between opacity-65 select-none"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded bg-[#e5e7eb]/70 text-[#6b7280] flex items-center justify-center text-xs font-mono font-medium">
            {String(d).padStart(2, '0')}
          </div>
          {d === 1 && <span className="text-xs text-[#6b7280] hidden sm:inline">{nextMonthShort}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card p-3 md:p-4">
      {/* Top Bar: My WFO Tab + Month Picker + Legends + Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#e5e7eb]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[#3F51BD] border-b-2 border-[#3F51BD] pb-1">
              My WFO
            </span>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#6b7280] hidden sm:inline mr-1">Month:</span>
            <button
              onClick={() => onNavigate('prev')}
              className="w-7 h-7 flex items-center justify-center rounded-md text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
              title="Previous month"
              aria-label="Previous month"
            >
              <IconChevronLeft className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-medium text-[#111827] tabular-nums px-1 min-w-[96px] text-center">
              {shortMonthNames[month]} {year}
            </h2>

            <button
              onClick={() => onNavigate('next')}
              className="w-7 h-7 flex items-center justify-center rounded-md text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
              title="Next month"
              aria-label="Next month"
            >
              <IconChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={() => onNavigate('today')}
                className="ml-1 px-2 h-7 flex items-center justify-center rounded-md text-xs font-medium text-[#3F51BD] bg-[#eef2ff] hover:bg-[#e0e7ff] transition-colors"
                title="Jump to today"
              >
                Today
              </button>
            )}

            {/* Overflow menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
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
                    <IconZap className="w-4 h-4 text-[#16a34a]" />
                    <span>Mark remaining as Office</span>
                  </button>
                  <button
                    onClick={() => {
                      onResetRemaining();
                      setIsMenuOpen(false);
                    }}
                  >
                    <IconReset className="w-4 h-4 text-[#6b7280]" />
                    <span>Reset upcoming days</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2Office Color Legends */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#4b5563]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#FCC1C1] border border-[#f87171]/40" />
            <span>Branch Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#B0EEAE] border border-[#4ade80]/40" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#B2DDF9] border border-[#60a5fa]/40" />
            <span>Comp Off</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#FFC488] border border-[#fb923c]/40" />
            <span>WFO Exception</span>
          </div>
        </div>
      </div>

      {/* Weekday headers (Desktop: full names, Mobile: short) */}
      <div className="hidden md:grid grid-cols-7 gap-1.5 mb-1.5">
        {weekDaysDesktop.map((day, i) => (
          <div
            key={day}
            className={`text-left px-1 font-medium py-1 text-xs ${
              i >= 5 ? 'text-[#9ca3af]' : 'text-[#4b5563]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid md:hidden grid-cols-7 gap-1 mb-1">
        {weekDaysMobile.map((day, i) => (
          <div
            key={day}
            className={`text-center font-medium py-0.5 text-xs ${
              i >= 5 ? 'text-[#9ca3af]' : 'text-[#4b5563]'
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
