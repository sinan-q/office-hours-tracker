import React, { useState, useEffect } from 'react';
import CalendarView from './components/CalendarView';
import StatsPanel from './components/StatsPanel';
import DayEditModal from './components/DayEditModal';
import Settings from './components/Settings';
import DataManager from './components/DataManager';
import * as storageService from './services/unifiedStorageService';
import { calculateLeaveBalances } from './services/leaveService';
import './App.css';

function App() {
  // State Management
  const [appData, setAppData] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
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

    if (isCurrentShow) {
      nextStatus = 'NO SHOW';
      nextTime = null;
    } else if (currentStatus === 'NO SHOW') {
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

        newData.calendarData[year][month][day] = {
          status: nextStatus,
          time: nextTime,
          originalStatus: originalStatus,
          leaveCategory: nextStatus === 'LEAVE' ? origLeaveCategory : null,
          leaveDuration: nextStatus === 'LEAVE' ? origLeaveDuration : null,
          originalLeaveCategory: origLeaveCategory,
          originalLeaveDuration: origLeaveDuration,
          exceptionCategory: nextStatus === 'EXCEPTION' ? origExceptionCategory : null,
          originalExceptionCategory: origExceptionCategory,
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

  const leaveBalances = appData ? calculateLeaveBalances(appData.settings, appData.calendarData) : null;

  return (
    <div className="min-h-screen text-white" style={{ background: '#181f2a', boxShadow: 'none', border: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold">Office Hours Tracker</h1>
            <div className="flex gap-3 items-center">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${storageStatus === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                <div className={`w-2 h-2 rounded-full ${storageStatus === 'online' ? 'bg-green-400' : 'bg-orange-400'
                  }`} />
                {storageStatus === 'online' ? 'Online' : 'Local Mode'}
              </div>
              <button
                onClick={() => setIsDataManagerOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Import/Export Data
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel
              appData={appData}
              currentDate={currentDate}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-2">
            <CalendarView
              currentDate={currentDate}
              calendarData={appData.calendarData}
              onDayClick={handleDayToggle}
              onNavigate={handleNavigate}
              onDayEdit={handleDayEdit}
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
