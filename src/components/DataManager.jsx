import React, { useRef, useState } from 'react';
import { processImportedJson, checkHasUpcomingDays } from '../services/jsonImportService';
import { saveData, getData } from '../services/supabaseStorageService';

const DataManager = ({ appData, onImport, onClose }) => {
  const fileInputRef = useRef(null);
  const [pastedJson, setPastedJson] = useState('');
  const [importMethod, setImportMethod] = useState('paste'); // 'paste' or 'file'
  const [pendingImport, setPendingImport] = useState(null); // { jsonData, isExportFormat }

  const handleExport = () => {
    getData().then((data) => {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `office-hours-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const executeImport = async (jsonData, isExportFormat, replaceUpcomingAsEmpty) => {
    try {
      let updatedData;
      if (!isExportFormat) {
        // Company format - process with mapping
        updatedData = processImportedJson(jsonData, appData, { replaceUpcomingAsEmpty });
      } else {
        // Exported backup format
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (replaceUpcomingAsEmpty) {
          const mergedCalendar = { ...appData?.calendarData, ...jsonData.calendarData };
          // Reset any future entries in mergedCalendar
          Object.keys(mergedCalendar).forEach((yStr) => {
            Object.keys(mergedCalendar[yStr] || {}).forEach((mStr) => {
              Object.keys(mergedCalendar[yStr][mStr] || {}).forEach((dStr) => {
                const dDate = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));
                dDate.setHours(0, 0, 0, 0);
                if (dDate > today) {
                  const dayOfWeek = dDate.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const currentEntry = mergedCalendar[yStr][mStr][dStr];
                  if (currentEntry?.status !== 'HOLIDAY') {
                    mergedCalendar[yStr][mStr][dStr] = {
                      status: isWeekend ? 'WEEKEND' : 'EMPTY',
                      time: null,
                      originalStatus: isWeekend ? 'WEEKEND' : 'EMPTY',
                      leaveCategory: null,
                      leaveDuration: null,
                      originalLeaveCategory: null,
                      originalLeaveDuration: null,
                      exceptionCategory: null,
                      originalExceptionCategory: null,
                      earnedCompOff: false,
                      originalEarnedCompOff: false
                    };
                  }
                }
              });
            });
          });

          updatedData = {
            settings: jsonData.settings || appData?.settings,
            calendarData: mergedCalendar
          };
        } else {
          // Preserve existing user upcoming entries if present
          const mergedCalendar = { ...appData?.calendarData };
          Object.keys(jsonData.calendarData || {}).forEach((yStr) => {
            if (!mergedCalendar[yStr]) mergedCalendar[yStr] = {};
            Object.keys(jsonData.calendarData[yStr] || {}).forEach((mStr) => {
              if (!mergedCalendar[yStr][mStr]) mergedCalendar[yStr][mStr] = {};
              Object.keys(jsonData.calendarData[yStr][mStr] || {}).forEach((dStr) => {
                const dDate = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));
                dDate.setHours(0, 0, 0, 0);
                const isUpcoming = dDate > today;
                const existingEntry = appData?.calendarData?.[yStr]?.[mStr]?.[dStr];

                if (isUpcoming && existingEntry) {
                  mergedCalendar[yStr][mStr][dStr] = existingEntry;
                } else {
                  mergedCalendar[yStr][mStr][dStr] = jsonData.calendarData[yStr][mStr][dStr];
                }
              });
            });
          });

          updatedData = {
            settings: jsonData.settings || appData?.settings,
            calendarData: mergedCalendar
          };
        }
      }

      await saveData(updatedData);
      onImport(updatedData);
      setPendingImport(null);
      setPastedJson('');
      alert('Data imported successfully!');
      onClose();
    } catch (error) {
      console.error('Error importing JSON:', error);
      alert('Error importing JSON: ' + error.message);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      const isArray = Array.isArray(jsonData);
      const isExportFormat = !isArray && jsonData.settings && jsonData.calendarData;

      if (!isArray && !isExportFormat) {
        throw new Error('Invalid JSON format. Expected company format (array) or exported format (object with settings and calendarData).');
      }

      const hasUpcoming = checkHasUpcomingDays(jsonData, appData?.calendarData);
      if (hasUpcoming) {
        setPendingImport({ jsonData, isExportFormat });
      } else {
        await executeImport(jsonData, isExportFormat, false);
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
      alert('Error importing JSON: ' + error.message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteImport = async () => {
    if (!pastedJson.trim()) {
      alert('Please paste JSON data first.');
      return;
    }

    try {
      const jsonData = JSON.parse(pastedJson);
      
      const isArray = Array.isArray(jsonData);
      const isExportFormat = !isArray && jsonData.settings && jsonData.calendarData;

      if (!isArray && !isExportFormat) {
        throw new Error('Invalid JSON format. Expected company format (array) or exported format (object with settings and calendarData).');
      }

      const hasUpcoming = checkHasUpcomingDays(jsonData, appData?.calendarData);
      if (hasUpcoming) {
        setPendingImport({ jsonData, isExportFormat });
      } else {
        await executeImport(jsonData, isExportFormat, false);
      }
    } catch (error) {
      console.error('Error parsing pasted JSON:', error);
      alert('Error parsing JSON: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-[#161c24] rounded-t-2xl sm:rounded-2xl p-5 md:p-6 w-full sm:max-w-2xl max-h-[92vh] max-h-[92dvh] overflow-y-auto shadow-2xl border border-white/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for mobile */}
        <div className="sm:hidden w-8 h-1 bg-white/10 rounded-full mx-auto mb-3" />

        <h2 className="text-lg font-bold text-white mb-5">Data Management</h2>

        <div className="space-y-4">
          {/* Import Section */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Import Data</h3>
            
            {/* Import Method Toggle */}
            <div className="flex gap-1.5 mb-4">
              <button
                onClick={() => setImportMethod('paste')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  importMethod === 'paste'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/25'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.05]'
                }`}
              >
                Paste JSON
              </button>
              <button
                onClick={() => setImportMethod('file')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  importMethod === 'file'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/25'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.05]'
                }`}
              >
                Upload File
              </button>
            </div>

            {/* Paste JSON Method */}
            {importMethod === 'paste' && (
              <div>
                <p className="text-[11px] text-white/30 mb-3">
                  Paste JSON data from your company website (array format) or previously exported app data.
                </p>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='[{"swipeDtls":[{"timeSpentCategory":"3-5"}],"dayStatus":"At Office","date":"2025-09-18"}, ...]'
                  className="w-full px-3 py-3 bg-white/[0.03] border border-white/[0.06] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs min-h-[120px] resize-y placeholder:text-white/15"
                />
                <button
                  onClick={handlePasteImport}
                  className="w-full mt-3 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-lg font-semibold transition-all text-sm"
                >
                  Import from Pasted JSON
                </button>
              </div>
            )}

            {/* File Upload Method */}
            {importMethod === 'file' && (
              <div>
                <p className="text-[11px] text-white/30 mb-4">
                  Import from a JSON file (company format or previously exported app data). This will merge with your existing data.
                </p>
                <button
                  onClick={handleImportClick}
                  className="w-full px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-lg font-semibold transition-all text-sm"
                >
                  Select JSON File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Export Data</h3>
            <p className="text-[11px] text-white/30 mb-3">
              Download all your calendar data and settings as a JSON file.
            </p>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 rounded-lg font-semibold transition-all text-sm"
            >
              Export to JSON
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-5 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.06] text-white/40 border border-white/[0.06] rounded-lg font-semibold transition-all text-sm"
        >
          Close
        </button>

        {/* Pending Import Confirmation Modal */}
        {pendingImport && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4"
            onClick={(e) => {
              e.stopPropagation();
              setPendingImport(null);
            }}
          >
            <div
              className="bg-[#1a222d] border border-white/10 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                Upcoming Days Detected
              </h3>
              <p className="text-xs text-white/60 leading-relaxed mb-5">
                The imported data includes records for future dates. How would you like to handle upcoming days?
              </p>

              <div className="space-y-3 mb-5">
                {/* Option 1: Keep existing plans (Recommended) */}
                <button
                  onClick={() => executeImport(pendingImport.jsonData, pendingImport.isExportFormat, false)}
                  className="w-full text-left p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                      Keep Existing Plans
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Recommended
                      </span>
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/60 leading-snug">
                    Safeguards your planned SHOW days, leaves, and WFH exceptions for dates after today.
                  </p>
                </button>

                {/* Option 2: Replace upcoming as EMPTY */}
                <button
                  onClick={() => executeImport(pendingImport.jsonData, pendingImport.isExportFormat, true)}
                  className="w-full text-left p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white/90">
                      Replace as EMPTY
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-snug">
                    Resets all upcoming weekdays to EMPTY (and weekends to WEEKEND) for a fresh planning slate.
                  </p>
                </button>
              </div>

              {/* Cancel button */}
              <button
                onClick={() => setPendingImport(null)}
                className="w-full py-2.5 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/70 text-xs font-medium border border-white/[0.06] transition-colors text-center"
              >
                Cancel Import
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManager;
