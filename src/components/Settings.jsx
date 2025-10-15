import React, { useState } from 'react';

const Settings = ({ settings, onSave, onClose }) => {
  const [minHoursPerDay, setMinHoursPerDay] = useState(settings.minHoursPerDay);
  const [minAttendancePercentage, setMinAttendancePercentage] = useState(settings.minAttendancePercentage);

  const handleSave = () => {
    onSave({
      minHoursPerDay: parseInt(minHoursPerDay) || 300,
      minAttendancePercentage: parseInt(minAttendancePercentage) || 80
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

        {/* Min Hours Per Day */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Minimum Hours Per Day (minutes)
          </label>
          <input
            type="number"
            value={minHoursPerDay}
            onChange={(e) => setMinHoursPerDay(e.target.value)}
            min="0"
            max="1440"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            {Math.floor(minHoursPerDay / 60)}h {minHoursPerDay % 60}m
          </p>
        </div>

        {/* Min Attendance Percentage */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Minimum Attendance Percentage
          </label>
          <input
            type="number"
            value={minAttendancePercentage}
            onChange={(e) => setMinAttendancePercentage(e.target.value)}
            min="0"
            max="100"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            {minAttendancePercentage}%
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
