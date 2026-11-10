import React, { useRef, useState } from 'react';
import { processImportedJson, checkHasUpcomingDays } from '../services/jsonImportService';
import { saveData, getData } from '../services/supabaseStorageService';
import { IconClose, IconCalendar, IconUpload, IconDownload } from './Icons';

const DataManager = ({ appData, onImport, onClose }) => {
  const fileInputRef = useRef(null);
  const [pastedJson, setPastedJson] = useState('');
  const [importMethod, setImportMethod] = useState('paste');
  const [pendingImport, setPendingImport] = useState(null);

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
        updatedData = processImportedJson(jsonData, appData, { replaceUpcomingAsEmpty });
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (replaceUpcomingAsEmpty) {
          const mergedCalendar = { ...appData?.calendarData, ...jsonData.calendarData };
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
        className="bg-[#141720] rounded-t-2xl sm:rounded-2xl p-5 md:p-6 w-full sm:max-w-xl max-h-[92vh] max-h-[92dvh] overflow-y-auto shadow-2xl border border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden drawer-handle mb-3" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#ededed]">Data management</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#7a8296] hover:text-[#ededed] hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Import Section */}
          <div className="surface-card p-4">
            <h3 className="text-xs font-medium text-[#ededed] mb-3">Import attendance data</h3>
            
            {/* Import Method Toggle */}
            <div className="flex gap-1 mb-3 bg-[#0f1117] p-1 rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setImportMethod('paste')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  importMethod === 'paste'
                    ? 'bg-[#1a1e28] text-[#ededed] shadow-sm'
                    : 'text-[#7a8296] hover:text-[#ededed]'
                }`}
              >
                Paste JSON
              </button>
              <button
                onClick={() => setImportMethod('file')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  importMethod === 'file'
                    ? 'bg-[#1a1e28] text-[#ededed] shadow-sm'
                    : 'text-[#7a8296] hover:text-[#ededed]'
                }`}
              >
                Upload file
              </button>
            </div>

            {/* Paste JSON Method */}
            {importMethod === 'paste' && (
              <div>
                <p className="text-[11px] text-[#7a8296] mb-2">
                  Paste attendance records array or previous exported backup.
                </p>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='[{"swipeDtls":[{"timeSpentCategory":"3-5"}],"dayStatus":"At Office","date":"2025-09-18"}, ...]'
                  className="w-full px-3 py-2 bg-[#1a1e28] border border-white/[0.08] text-[#ededed] rounded-lg focus:outline-none focus:border-white/30 font-mono text-xs min-h-[110px] resize-y placeholder:text-[#7a8296]/40"
                />
                <button
                  onClick={handlePasteImport}
                  className="w-full mt-2.5 px-4 py-2 bg-[#ededed] hover:bg-white text-[#0f1115] rounded-lg font-medium transition-colors text-xs"
                >
                  Import data
                </button>
              </div>
            )}

            {/* File Upload Method */}
            {importMethod === 'file' && (
              <div>
                <p className="text-[11px] text-[#7a8296] mb-3">
                  Upload a JSON attendance export file to merge with existing data.
                </p>
                <button
                  onClick={handleImportClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1e28] hover:bg-white/[0.08] text-[#ededed] border border-white/[0.08] rounded-lg font-medium transition-colors text-xs"
                >
                  <IconUpload className="w-4 h-4 text-[#a1a1a6]" />
                  <span>Choose JSON file</span>
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
          <div className="surface-card p-4">
            <h3 className="text-xs font-medium text-[#ededed] mb-1.5">Export backup</h3>
            <p className="text-[11px] text-[#7a8296] mb-3">
              Download your calendar records and configuration as a JSON file.
            </p>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#ededed] border border-white/[0.08] rounded-lg font-medium transition-colors text-xs"
            >
              <IconDownload className="w-4 h-4 text-[#a1a1a6]" />
              <span>Download JSON backup</span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-transparent hover:bg-white/[0.04] text-[#a1a1a6] hover:text-[#ededed] rounded-lg font-medium transition-colors text-xs"
        >
          Close
        </button>

        {/* Pending Import Confirmation Modal */}
        {pendingImport && (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={(e) => {
              e.stopPropagation();
              setPendingImport(null);
            }}
          >
            <div
              className="bg-[#141720] border border-white/[0.1] rounded-xl p-5 w-full max-w-sm shadow-2xl relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 text-[#a1a1a6]">
                <IconCalendar className="w-4 h-4" />
              </div>

              <h3 className="text-sm font-semibold text-[#ededed] mb-1">
                Upcoming days detected
              </h3>
              <p className="text-xs text-[#a1a1a6] leading-relaxed mb-4">
                The imported data contains future dates. Choose how to handle upcoming days:
              </p>

              <div className="space-y-2 mb-4">
                {/* Option 1: Keep existing plans */}
                <button
                  onClick={() => executeImport(pendingImport.jsonData, pendingImport.isExportFormat, false)}
                  className="w-full text-left p-3 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-[#ededed]">
                      Keep existing plans
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#a1a1a6]">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7a8296] leading-snug">
                    Preserves your planned office days, leaves, and WFH entries after today.
                  </p>
                </button>

                {/* Option 2: Replace upcoming as EMPTY */}
                <button
                  onClick={() => executeImport(pendingImport.jsonData, pendingImport.isExportFormat, true)}
                  className="w-full text-left p-3 rounded-lg border border-white/[0.06] bg-transparent hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-xs font-medium text-[#a1a1a6] block mb-0.5">
                    Clear upcoming days
                  </span>
                  <p className="text-[11px] text-[#7a8296] leading-snug">
                    Resets future days to empty for a fresh planning state.
                  </p>
                </button>
              </div>

              {/* Cancel button */}
              <button
                onClick={() => setPendingImport(null)}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-[#7a8296] hover:text-[#ededed] transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManager;
