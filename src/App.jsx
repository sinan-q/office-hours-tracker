import React, { useState, useEffect } from 'react';
import CalendarView from './components/CalendarView';
import StatsPanel from './components/StatsPanel';
import ActionDock from './components/ActionDock';
import DayEditModal from './components/DayEditModal';
import Settings from './components/Settings';
import DataManager from './components/DataManager';
import * as storageService from './services/unifiedStorageService';
import { calculateLeaveBalances } from './services/leaveService';
import { canSelectPersonalExigency, calculateExceptionStats } from './services/exceptionService';
import { calculateCompOffBalances } from './services/compOffService';
import { calculateAttendancePercentage } from './services/statsService';
import './App.css';

function App() {
  // State Management
  const todayStr = new Date().toISOString().split('T')[0];
  const [appData, setAppData] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [paintMode, setPaintMode] = useState({ active: false, chip: null });
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState('online');

  // Load data from storage on mount
  useEffect(() => {
    (async () => {
      const result = await storageService.getData();
      setAppData(result.data);
      setStorageStatus(result.source === 'cloud' ? 'online' : 'local');
    })();
  }, []);

  // Save data to storage whenever appData changes
  useEffect(() => {
    if (appData) {
      (async () => {
        const result = await storageService.saveData(appData);
        setStorageStatus(result.cloudSynced ? 'online' : 'local');
      })();
    }
  }, [appData]);

  // Navigation handlers
  const handleNavigate = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Day click (toggle) handler
  const handleDayToggle = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const dayData = appData?.calendarData?.[year]?.[month]?.[day];

    const getOriginalStatus = (dateStr, dayData) => {
      if (dayData?.originalStatus) {
        return dayData.originalStatus;
      }
      if (dayData?.status && dayData.status !== 'SHOW' && dayData.status !== 'NO SHOW') {
        return dayData.status;
      }
      // Determine if it's weekend by date
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      return isWeekend ? 'WEEKEND' : 'EMPTY';
    };

    // 1. Determine original status
    const originalStatus = getOriginalStatus(dateStr, dayData);

    // 2. Determine current status
    const currentStatus = dayData?.status || (new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6 ? 'WEEKEND' : 'EMPTY');
    const currentTime = dayData?.time;

    // A day is in a "SHOW" state if status is SHOW or if it is a WEEKEND/HOLIDAY with logged time.
    const isCurrentShow = currentStatus === 'SHOW' || ((currentStatus === 'WEEKEND' || currentStatus === 'HOLIDAY') && currentTime && currentTime > 0);

    let nextStatus;
    let nextTime;
    let nextExceptionCategory = null;

    if (isCurrentShow) {
      nextStatus = 'NO SHOW';
      nextTime = null;
    } else if (currentStatus === 'NO SHOW') {
      // Check if there is WFH (Personal Exigency) quota pending for this quarter
      const canDoWFH = (originalStatus !== 'WEEKEND' && originalStatus !== 'HOLIDAY') &&
        canSelectPersonalExigency(appData?.calendarData, dateStr, dayData);

      if (canDoWFH && originalStatus !== 'EXCEPTION') {
        nextStatus = 'EXCEPTION';
        nextTime = null;
        nextExceptionCategory = 'PE';
      } else {
        nextStatus = originalStatus;
        nextTime = null;
      }
    } else if (currentStatus === 'EXCEPTION' && originalStatus !== 'EXCEPTION') {
      nextStatus = originalStatus;
      nextTime = null;
    } else {
      // Current status is default/original status (EMPTY, WEEKEND, HOLIDAY, LEAVE, EXCEPTION, etc.)
      // For weekends and holidays, we log time on the same status (turns purple).
      // For others (weekdays, leaves, exceptions), we switch to SHOW status (turns green).
      if (originalStatus === 'WEEKEND' || originalStatus === 'HOLIDAY') {
        nextStatus = originalStatus;
      } else {
        nextStatus = 'SHOW';
      }
      nextTime = 1; // 1 minute
    }

    setAppData((prevData) => {
      const newData = { ...prevData };
      if (!newData.calendarData) newData.calendarData = {};
      if (!newData.calendarData[year]) newData.calendarData[year] = {};
      if (!newData.calendarData[year][month]) newData.calendarData[year][month] = {};

      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const naturalStatus = isWeekend ? 'WEEKEND' : 'EMPTY';

      // If next status matches natural default and has no time, we can delete the entry to keep data clean,
      // UNLESS the original status was HOLIDAY, LEAVE, or EXCEPTION (which aren't naturally determined by the date).
      if (nextStatus === naturalStatus && nextTime === null && originalStatus === naturalStatus) {
        delete newData.calendarData[year][month][day];
        // Clean up empty month/year objects
        if (Object.keys(newData.calendarData[year][month]).length === 0) {
          delete newData.calendarData[year][month];
        }
        if (Object.keys(newData.calendarData[year]).length === 0) {
          delete newData.calendarData[year];
        }
      } else {
        const existingEntry = prevData?.calendarData?.[year]?.[month]?.[day];
        const origLeaveCategory = existingEntry?.originalLeaveCategory || (existingEntry?.status === 'LEAVE' ? existingEntry.leaveCategory : null);
        const origLeaveDuration = existingEntry?.originalLeaveDuration || (existingEntry?.status === 'LEAVE' ? existingEntry.leaveDuration : null);
        const origExceptionCategory = existingEntry?.originalExceptionCategory || (existingEntry?.status === 'EXCEPTION' ? existingEntry.exceptionCategory : null);
        const origEarnedCompOff = existingEntry?.originalEarnedCompOff ?? existingEntry?.earnedCompOff ?? false;

        const effectiveExceptionCategory = nextStatus === 'EXCEPTION'
          ? (nextExceptionCategory || origExceptionCategory || 'PE')
          : null;

        newData.calendarData[year][month][day] = {
          status: nextStatus,
          time: nextTime,
          originalStatus: originalStatus,
          leaveCategory: nextStatus === 'LEAVE' ? origLeaveCategory : null,
          leaveDuration: nextStatus === 'LEAVE' ? origLeaveDuration : null,
          originalLeaveCategory: origLeaveCategory,
          originalLeaveDuration: origLeaveDuration,
          exceptionCategory: effectiveExceptionCategory,
          originalExceptionCategory: origExceptionCategory || (originalStatus === 'EXCEPTION' ? effectiveExceptionCategory : null),
          earnedCompOff: (nextStatus === 'HOLIDAY' || nextStatus === 'WEEKEND') ? origEarnedCompOff : false,
          originalEarnedCompOff: origEarnedCompOff
        };
      }

      return newData;
    });
  };

  // Day edit handler (opens modal)
  const handleDayEdit = (date) => {
    setSelectedDay(date);
    setIsModalOpen(true);
  };

  // Open detailed modal for selected day
  const handleOpenDetailedEdit = (dateStr) => {
    setSelectedDay(dateStr || selectedDate);
    setIsModalOpen(true);
  };

  // Day selection from Calendar
  const handleSelectDay = (dateStr) => {
    if (paintMode?.active && paintMode?.chip) {
      handleApplyChip(dateStr, paintMode.chip);
    } else {
      setSelectedDate(dateStr);
    }
  };

  // Activate Stamp / Paint Mode
  const handleActivatePaintMode = (chip) => {
    setPaintMode({ active: true, chip });
    if (selectedDate) {
      handleApplyChip(selectedDate, chip);
    }
  };

  // Exit Stamp / Paint Mode
  const handleExitPaintMode = () => {
    setPaintMode({ active: false, chip: null });
  };

  // 1-tap chip application
  const handleApplyChip = (dateStr, chip) => {
    if (!dateStr || !chip) return;

    const [year, month, day] = dateStr.split('-');
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const naturalStatus = isWeekend ? 'WEEKEND' : 'EMPTY';

    setAppData((prevData) => {
      const newData = { ...prevData };
      if (!newData.calendarData) newData.calendarData = {};
      if (!newData.calendarData[year]) newData.calendarData[year] = {};
      if (!newData.calendarData[year][month]) newData.calendarData[year][month] = {};

      const existingEntry = prevData?.calendarData?.[year]?.[month]?.[day];
      let originalStatus = existingEntry?.originalStatus || naturalStatus;

      const origLeaveCategory = existingEntry?.originalLeaveCategory || (existingEntry?.status === 'LEAVE' ? existingEntry.leaveCategory : null);
      const origLeaveDuration = existingEntry?.originalLeaveDuration || (existingEntry?.status === 'LEAVE' ? existingEntry.leaveDuration : null);
      const origExceptionCategory = existingEntry?.originalExceptionCategory || (existingEntry?.status === 'EXCEPTION' ? existingEntry.exceptionCategory : null);
      const origEarnedCompOff = existingEntry?.originalEarnedCompOff ?? existingEntry?.earnedCompOff ?? false;

      let nextStatus = 'EMPTY';
      let nextTime = null;
      let nextLeaveCategory = null;
      let nextLeaveDuration = null;
      let nextExceptionCategory = null;
      let nextEarnedCompOff = false;

      if (chip.type === 'SHOW') {
        if (originalStatus === 'WEEKEND' || originalStatus === 'HOLIDAY') {
          nextStatus = originalStatus;
        } else {
          nextStatus = 'SHOW';
        }
        nextTime = 1;
        nextEarnedCompOff = origEarnedCompOff;
      } else if (chip.type === 'NO SHOW') {
        nextStatus = 'NO SHOW';
        nextTime = null;
      } else if (chip.type === 'LEAVE') {
        nextStatus = 'LEAVE';
        nextTime = null;
        nextLeaveCategory = chip.leaveCategory;
        nextLeaveDuration = 1.0;
      } else if (chip.type === 'EXCEPTION') {
        nextStatus = 'EXCEPTION';
        nextTime = null;
        nextExceptionCategory = chip.exceptionCategory;
      } else if (chip.type === 'CLEAR') {
        nextStatus = naturalStatus;
        nextTime = null;
        if (originalStatus === 'HOLIDAY' || originalStatus === 'WEEKEND') {
          nextStatus = originalStatus;
          nextEarnedCompOff = origEarnedCompOff;
        }
      }

      if (nextStatus === naturalStatus && nextTime === null && originalStatus === naturalStatus) {
        delete newData.calendarData[year][month][day];
        if (Object.keys(newData.calendarData[year][month]).length === 0) {
          delete newData.calendarData[year][month];
        }
        if (Object.keys(newData.calendarData[year]).length === 0) {
          delete newData.calendarData[year];
        }
      } else {
        newData.calendarData[year][month][day] = {
          status: nextStatus,
          time: nextTime,
          originalStatus: originalStatus,
          leaveCategory: nextStatus === 'LEAVE' ? nextLeaveCategory : null,
          leaveDuration: nextStatus === 'LEAVE' ? nextLeaveDuration : null,
          originalLeaveCategory: nextLeaveCategory || origLeaveCategory,
          originalLeaveDuration: nextLeaveDuration || origLeaveDuration,
          exceptionCategory: nextStatus === 'EXCEPTION' ? nextExceptionCategory : null,
          originalExceptionCategory: nextExceptionCategory || origExceptionCategory,
          earnedCompOff: (nextStatus === 'HOLIDAY' || nextStatus === 'WEEKEND') ? nextEarnedCompOff : false,
          originalEarnedCompOff: origEarnedCompOff
        };
      }

      return newData;
    });

    setSelectedDate(dateStr);
  };

  // Get data for selected date for ActionDock
  const getSelectedDayDataForDock = () => {
    if (!selectedDate || !appData?.calendarData) return null;
    const [year, month, day] = selectedDate.split('-');
    const dayData = appData.calendarData?.[year]?.[month]?.[day];

    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!dayData) {
      return {
        date: selectedDate,
        status: isWeekend ? 'WEEKEND' : 'EMPTY',
        time: null,
        leaveCategory: null,
        leaveDuration: null,
        exceptionCategory: null,
        earnedCompOff: false
      };
    }
    return {
      date: selectedDate,
      status: dayData.status,
      time: dayData.time,
      originalStatus: dayData.originalStatus,
      leaveCategory: dayData.leaveCategory || dayData.originalLeaveCategory || null,
      leaveDuration: dayData.leaveDuration || dayData.originalLeaveDuration || null,
      exceptionCategory: dayData.exceptionCategory || dayData.originalExceptionCategory || null,
      earnedCompOff: dayData.earnedCompOff ?? false
    };
  };

  // Save day handler
  const handleSaveDay = (dayData) => {
    const [year, month, day] = dayData.date.split('-');

    setAppData((prevData) => {
      const newData = { ...prevData };

      // Ensure nested structure exists
      if (!newData.calendarData[year]) {
        newData.calendarData[year] = {};
      }
      if (!newData.calendarData[year][month]) {
        newData.calendarData[year][month] = {};
      }

      // Determine originalStatus
      const existingEntry = prevData?.calendarData?.[year]?.[month]?.[day];
      let originalStatus = existingEntry?.originalStatus;
      
      // If the saved status is a base status (not SHOW and not NO SHOW), update original status
      if (dayData.status !== 'SHOW' && dayData.status !== 'NO SHOW') {
        originalStatus = dayData.status;
      }
      
      // If we don't have an original status yet, default it based on the date
      if (!originalStatus) {
        const date = new Date(dayData.date);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        originalStatus = isWeekend ? 'WEEKEND' : 'EMPTY';
      }

      const origLeaveCategory = dayData.status === 'LEAVE'
        ? dayData.leaveCategory
        : (existingEntry?.originalLeaveCategory || null);
      const origLeaveDuration = dayData.status === 'LEAVE'
        ? dayData.leaveDuration
        : (existingEntry?.originalLeaveDuration || null);
      const origExceptionCategory = dayData.status === 'EXCEPTION'
        ? dayData.exceptionCategory
        : (existingEntry?.originalExceptionCategory || null);
      const isWeekendOrHoliday = dayData.status === 'HOLIDAY' || dayData.status === 'WEEKEND';
      const origEarnedCompOff = isWeekendOrHoliday
        ? (dayData.earnedCompOff ?? false)
        : (existingEntry?.originalEarnedCompOff ?? false);

      // Update the day data
      newData.calendarData[year][month][day] = {
        status: dayData.status,
        time: dayData.time,
        originalStatus: originalStatus,
        leaveCategory: dayData.status === 'LEAVE' ? dayData.leaveCategory : null,
        leaveDuration: dayData.status === 'LEAVE' ? dayData.leaveDuration : null,
        originalLeaveCategory: origLeaveCategory,
        originalLeaveDuration: origLeaveDuration,
        exceptionCategory: dayData.status === 'EXCEPTION' ? dayData.exceptionCategory : null,
        originalExceptionCategory: origExceptionCategory,
        earnedCompOff: isWeekendOrHoliday ? (dayData.earnedCompOff ?? false) : false,
        originalEarnedCompOff: origEarnedCompOff
      };

      return newData;
    });

    setIsModalOpen(false);
    setSelectedDay(null);
  };

  // Batch action: Fill all upcoming EMPTY weekdays in currently viewed month with SHOW
  const handleFillRemainingShow = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const yearStr = year.toString();
    const monthStr = (month + 1).toString().padStart(2, '0');
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setAppData((prevData) => {
      const newData = { ...prevData };
      if (!newData.calendarData) newData.calendarData = {};
      if (!newData.calendarData[yearStr]) newData.calendarData[yearStr] = {};
      if (!newData.calendarData[yearStr][monthStr]) newData.calendarData[yearStr][monthStr] = {};

      let modified = false;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        if (dayDate < today) continue; // Skip past days

        const dayOfWeek = dayDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

        const dayStr = day.toString().padStart(2, '0');
        const existingEntry = newData.calendarData[yearStr][monthStr][dayStr];

        // Only fill if there is no entry or entry is currently EMPTY
        if (!existingEntry || existingEntry.status === 'EMPTY') {
          newData.calendarData[yearStr][monthStr][dayStr] = {
            status: 'SHOW',
            time: 1, // 1 minute (SHOW status)
            originalStatus: 'EMPTY',
            leaveCategory: null,
            leaveDuration: null,
            originalLeaveCategory: null,
            originalLeaveDuration: null,
            exceptionCategory: null,
            originalExceptionCategory: null,
            earnedCompOff: false,
            originalEarnedCompOff: false
          };
          modified = true;
        }
      }

      return modified ? newData : prevData;
    });
  };

  // Batch action: Reverts all upcoming planned days in currently viewed month back to EMPTY
  const handleResetRemaining = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const yearStr = year.toString();
    const monthStr = (month + 1).toString().padStart(2, '0');
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setAppData((prevData) => {
      if (!prevData?.calendarData?.[yearStr]?.[monthStr]) return prevData;

      const newData = { ...prevData };
      let modified = false;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        if (dayDate < today) continue; // Skip past days

        const dayStr = day.toString().padStart(2, '0');
        const entry = newData.calendarData[yearStr]?.[monthStr]?.[dayStr];
        if (!entry) continue;

        // Only revert planned days that were originally EMPTY (or plain weekend without earnedCompOff)
        if (entry.originalStatus === 'EMPTY') {
          delete newData.calendarData[yearStr][monthStr][dayStr];
          modified = true;
        } else if (entry.originalStatus === 'WEEKEND' && !entry.earnedCompOff) {
          delete newData.calendarData[yearStr][monthStr][dayStr];
          modified = true;
        }
      }

      if (modified) {
        if (Object.keys(newData.calendarData[yearStr][monthStr]).length === 0) {
          delete newData.calendarData[yearStr][monthStr];
        }
        if (Object.keys(newData.calendarData[yearStr]).length === 0) {
          delete newData.calendarData[yearStr];
        }
        return newData;
      }

      return prevData;
    });
  };

  // Settings handlers
  const handleSaveSettings = (newSettings) => {
    setAppData((prevData) => ({
      ...prevData,
      settings: newSettings
    }));
    setIsSettingsOpen(false);
  };

  // Data import handler
  const handleImportData = (newData) => {
    setAppData(newData);
  };

  // Get selected day data for modal
  const getSelectedDayData = () => {
    if (!selectedDay) return null;

    const [year, month, day] = selectedDay.split('-');
    const dayData = appData?.calendarData?.[year]?.[month]?.[day];

    // Check if it's a weekend by default
    const date = new Date(selectedDay);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!dayData) {
      return {
        date: selectedDay,
        status: isWeekend ? 'WEEKEND' : 'EMPTY',
        time: null,
        leaveCategory: null,
        leaveDuration: null,
        exceptionCategory: null,
        originalExceptionCategory: null,
        earnedCompOff: false,
        originalEarnedCompOff: false
      };
    }

    return {
      date: selectedDay,
      status: dayData.status,
      time: dayData.time,
      originalStatus: dayData.originalStatus,
      leaveCategory: (dayData.status === 'LEAVE' ? dayData.leaveCategory : null) || dayData.originalLeaveCategory || null,
      leaveDuration: (dayData.status === 'LEAVE' ? dayData.leaveDuration : null) || dayData.originalLeaveDuration || null,
      originalLeaveCategory: dayData.originalLeaveCategory || null,
      originalLeaveDuration: dayData.originalLeaveDuration || null,
      exceptionCategory: (dayData.status === 'EXCEPTION' ? dayData.exceptionCategory : null) || dayData.originalExceptionCategory || null,
      originalExceptionCategory: dayData.originalExceptionCategory || null,
      earnedCompOff: dayData.earnedCompOff ?? dayData.originalEarnedCompOff ?? false,
      originalEarnedCompOff: dayData.originalEarnedCompOff ?? false
    };
  };

  // Don't render until data is loaded
  if (!appData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const leaveBalances = appData ? calculateLeaveBalances(appData.settings, appData.calendarData) : {};
  const exceptionStats = appData ? calculateExceptionStats(appData.calendarData, selectedDate || currentDate) : {};
  const compOffBalances = appData ? calculateCompOffBalances(appData.settings?.compOffSettings, appData.calendarData) : {};
  const attendancePercentage = appData ? calculateAttendancePercentage(appData.calendarData, appData.settings, currentDate) : 'N/A';

  return (
    <div className="min-h-screen text-white" style={{ background: '#181f2a', boxShadow: 'none', border: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Office Hours Tracker</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">Track attendance and manage leaves</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${storageStatus === 'online'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                }`}>
                <div className={`w-2 h-2 rounded-full ${storageStatus === 'online' ? 'bg-green-400' : 'bg-orange-400'
                  }`} />
                {storageStatus === 'online' ? 'Online' : 'Local Mode'}
              </div>
              <button
                onClick={() => setIsDataManagerOpen(true)}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs md:text-sm font-semibold transition-colors"
              >
                Import/Export
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs md:text-sm font-semibold transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 md:px-4 py-3 md:py-6 pb-24 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats Panel (Hidden on small screens by default, expandable) */}
          <div className="hidden lg:block lg:col-span-1">
            <StatsPanel
              appData={appData}
              currentDate={currentDate}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>

          {/* Right Column - Calendar & Action Dock */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mobile Top Stats Bar (< lg screens) */}
            <div className="block lg:hidden bg-gray-800/90 border border-gray-700/80 rounded-xl p-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">
                    📊 {attendancePercentage === 'N/A' ? 'N/A' : `${attendancePercentage}%`}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-orange-300 font-medium">
                    WFH: {exceptionStats?.available ?? 0}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-emerald-300 font-medium">
                    CO: {compOffBalances?.available ?? 0}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileStatsOpen(!isMobileStatsOpen)}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20"
                >
                  {isMobileStatsOpen ? 'Hide Stats ▲' : 'All Stats ▼'}
                </button>
              </div>

              {isMobileStatsOpen && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <StatsPanel
                    appData={appData}
                    currentDate={currentDate}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />
                </div>
              )}
            </div>

            <CalendarView
              currentDate={currentDate}
              calendarData={appData.calendarData}
              selectedDate={selectedDate}
              paintMode={paintMode}
              onSelectDay={handleSelectDay}
              onDayClick={handleSelectDay}
              onNavigate={handleNavigate}
              onDayEdit={handleOpenDetailedEdit}
              onFillRemainingShow={handleFillRemainingShow}
              onResetRemaining={handleResetRemaining}
            />

            {/* Thumb-Zone Action Dock */}
            <ActionDock
              selectedDate={selectedDate}
              selectedDayData={getSelectedDayDataForDock()}
              leaveBalances={leaveBalances}
              exceptionStats={exceptionStats}
              compOffBalances={compOffBalances}
              paintMode={paintMode}
              onApplyChip={handleApplyChip}
              onActivatePaintMode={handleActivatePaintMode}
              onExitPaintMode={handleExitPaintMode}
              onOpenDetailedEdit={handleOpenDetailedEdit}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {isModalOpen && (
        <DayEditModal
          dayData={getSelectedDayData()}
          leaveBalances={leaveBalances}
          asOfDate={appData.settings?.leaveSettings?.asOfDate}
          calendarData={appData.calendarData}
          compOffSettings={appData.settings?.compOffSettings}
          onSave={handleSaveDay}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDay(null);
          }}
        />
      )}

      {isSettingsOpen && (
        <Settings
          settings={appData.settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isDataManagerOpen && (
        <DataManager
          appData={appData}
          onImport={handleImportData}
          onClose={() => setIsDataManagerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
