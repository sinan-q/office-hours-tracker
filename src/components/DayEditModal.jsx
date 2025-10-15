import React, { useState, useEffect } from 'react';

const DayEditModal = ({ dayData, onSave, onClose }) => {
  const [status, setStatus] = useState(dayData?.status || 'EMPTY');
  const [time, setTime] = useState(dayData?.time || 0);

  useEffect(() => {
    if (dayData) {
      setStatus(dayData.status);
      setTime(dayData.time || 0);
    }
  }, [dayData]);

  // Determine if time input should be disabled
  const isTimeDisabled = () => {
    return status === 'NO SHOW' || status === 'LEAVE' || status === 'EXCEPTION';
  };

  const handleSave = () => {
    const timeValue = isTimeDisabled() ? null : parseInt(time) || 0;
    onSave({
      date: dayData.date,
      status,
      time: timeValue
    });
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    
    // Clear time if switching to a status that doesn't allow time
    if (newStatus === 'NO SHOW' || newStatus === 'LEAVE' || newStatus === 'EXCEPTION') {
      setTime(0);
    }
  };

  // Handle time change - auto-switch to SHOW if typing in time when status is EMPTY
  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    
    // If status is EMPTY and time is being entered (changed from 0), switch to SHOW
    if (status === 'EMPTY' && parseInt(newTime) > 0) {
      setStatus('SHOW');
    }
  };

  // Handle clear status button - reset to EMPTY
  const handleClearStatus = () => {
    setStatus('EMPTY');
    setTime(0);
  };

  // Handle add status button - show dropdown by setting a default status
  const handleAddStatus = () => {
    setStatus('NO SHOW');
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Save is always enabled now - we allow saving any state
  const isSaveDisabled = false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Day</h2>
        
        {/* Date Display */}
        <div className="mb-4">
          <p className="text-gray-300">{formatDate(dayData.date)}</p>
        </div>

        {/* Status Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Status
          </label>
          {status === 'EMPTY' || status === 'SHOW' ? (
            // Show "Add Status" button when status is EMPTY or SHOW
            <button
              onClick={handleAddStatus}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              Add Status
            </button>
          ) : (
            // Show dropdown and clear button for other statuses
            <div className="flex gap-2">
              <select
                value={status}
                onChange={handleStatusChange}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NO SHOW">No Show</option>
                <option value="LEAVE">Leave</option>
                <option value="EXCEPTION">Exception</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="WEEKEND">Weekend</option>
              </select>
              <button
                onClick={handleClearStatus}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                title="Clear status (set to EMPTY)"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Time Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Time (minutes)
          </label>
          <input
            type="number"
            value={time}
            onChange={handleTimeChange}
            disabled={isTimeDisabled()}
            min="0"
            max="1440"
            className={`
              w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isTimeDisabled() 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-700 text-white'}
            `}
          />
          {!isTimeDisabled() && (
            <p className="text-xs text-gray-400 mt-1">
              {Math.floor(time / 60)}h {time % 60}m
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`
              flex-1 px-4 py-2 rounded-lg font-semibold transition-colors
              ${isSaveDisabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
            `}
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

export default DayEditModal;
