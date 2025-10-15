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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-2xl font-bold text-white mb-6">Data Management</h2>

        <div className="space-y-4">
          {/* Import Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Import Data</h3>
            
            {/* Import Method Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setImportMethod('paste')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  importMethod === 'paste'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Paste JSON
              </button>
              <button
                onClick={() => setImportMethod('file')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  importMethod === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Upload File
              </button>
            </div>

            {/* Paste JSON Method */}
            {importMethod === 'paste' && (
              <div>
                <p className="text-sm text-gray-300 mb-3">
                  Paste JSON data from your company website (array format with date, dayStatus, backgroundStatus, timeCat) or exported app data.
                </p>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='[{"swipeDtls":[],"dayStatus":"At Office","backgroundStatus":"","timeCat":"363","dayName":"THURSDAY","booking":false,"date":"2025-09-18"}, ...]'
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm min-h-[150px] resize-y"
                />
                <button
                  onClick={handlePasteImport}
                  className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Import from Pasted JSON
                </button>
              </div>
            )}

            {/* File Upload Method */}
            {importMethod === 'file' && (
              <div>
                <p className="text-sm text-gray-300 mb-4">
                  Import from a JSON file (company format or previously exported app data). This will merge with your existing data.
                </p>
                <button
                  onClick={handleImportClick}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
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
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Export Data</h3>
            <p className="text-sm text-gray-300 mb-4">
              Download all your calendar data and settings as a JSON file.
            </p>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Export to JSON
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DataManager;
