import React, { useRef, useState } from 'react';
import { processImportedJson } from '../services/jsonImportService';
import { saveData, getData } from '../services/supabaseStorageService';

const DataManager = ({ appData, onImport, onClose }) => {
  const fileInputRef = useRef(null);
  const [pastedJson, setPastedJson] = useState('');
  const [importMethod, setImportMethod] = useState('paste'); // 'paste' or 'file'

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      // Check if it's company format (array) or exported format (object with settings and calendarData)
      let updatedData;
      if (Array.isArray(jsonData)) {
        // Company format - process with mapping
        updatedData = processImportedJson(jsonData, appData);
      } else if (jsonData.settings && jsonData.calendarData) {
        // Exported format - merge directly
        updatedData = {
          settings: jsonData.settings,
          calendarData: { ...appData.calendarData, ...jsonData.calendarData }
        };
      } else {
        throw new Error('Invalid JSON format. Expected company format (array) or exported format (object with settings and calendarData).');
      }
      
      await saveData(updatedData);
      onImport(updatedData);
      alert('Data imported successfully from file!');
      onClose();
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
      
      // Check if it's company format (array) or exported format (object)
      let updatedData;
      if (Array.isArray(jsonData)) {
        // Company format - process with mapping
        updatedData = processImportedJson(jsonData, appData);
      } else if (jsonData.settings && jsonData.calendarData) {
        // Exported format - merge directly
        updatedData = {
          settings: jsonData.settings,
          calendarData: { ...appData.calendarData, ...jsonData.calendarData }
        };
      } else {
        throw new Error('Invalid JSON format. Expected company format (array) or exported format (object with settings and calendarData).');
      }
      
      await saveData(updatedData);
      onImport(updatedData);
      alert('Data imported successfully from pasted JSON!');
      setPastedJson('');
      onClose();
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
      </div>
    </div>
  );
};

export default DataManager;
