import React, { useRef } from 'react';
import { processImportedJson } from '../services/jsonImportService';

const DataManager = ({ appData, onImport, onClose }) => {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `office-hours-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      
      // Process the imported JSON
      const updatedData = processImportedJson(jsonData, appData);
      onImport(updatedData);
      
      alert('Data imported successfully!');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Data Management</h2>

        <div className="space-y-4">
          {/* Import Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Import Data</h3>
            <p className="text-sm text-gray-300 mb-4">
              Import calendar data from a JSON file. This will merge with your existing data.
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
