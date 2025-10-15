import React, { useState, useEffect } from 'react';
import CalendarView from './components/CalendarView';
import StatsPanel from './components/StatsPanel';
import DayEditModal from './components/DayEditModal';
import Settings from './components/Settings';
import DataManager from './components/DataManager';
import { getData, saveData } from './services/supabaseStorageService';
import './App.css';

function App() {
  // State Management
  const [appData, setAppData] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    (async () => {
      const data = await getData();
      setAppData(data);
    })();
  }, []);

  // Save data to localStorage whenever appData changes
  useEffect(() => {
    if (appData) {
      saveData(appData);
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

  // Day click handler
  const handleDayClick = (date) => {
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

      // Update the day data
      newData.calendarData[year][month][day] = {
        status: dayData.status,
        time: dayData.time
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
        time: null
      };
    }

    return {
      date: selectedDay,
      status: dayData.status,
      time: dayData.time
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

  return (
  <div className="min-h-screen text-white" style={{ background: '#181f2a', boxShadow: 'none', border: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold">Office Hours Tracker</h1>
            <div className="flex gap-3">
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
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel appData={appData} currentDate={currentDate} />
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-2">
            <CalendarView
              currentDate={currentDate}
              calendarData={appData.calendarData}
              onDayClick={handleDayClick}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {isModalOpen && (
        <DayEditModal
          dayData={getSelectedDayData()}
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
