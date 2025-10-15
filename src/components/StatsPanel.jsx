import React from 'react';
import {
  calculateAttendancePercentage,
  calculateAvgHoursTillYesterday,
  calculateAvgHoursNeeded
} from '../services/statsService';

const StatsPanel = ({ appData, currentDate }) => {
  const { calendarData, settings } = appData;

  const attendancePercentage = calculateAttendancePercentage(calendarData, settings, currentDate);
  const avgHoursTillYesterday = calculateAvgHoursTillYesterday(calendarData, settings, currentDate);
  const avgHoursNeeded = calculateAvgHoursNeeded(calendarData, settings, currentDate);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>

      {/* Attendance Percentage */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Attendance Percentage
        </h3>
        <p className="text-3xl font-bold text-white">
          {attendancePercentage === 'N/A' ? 'N/A' : `${attendancePercentage}%`}
        </p>
      </div>

      {/* Average Hours (Completed Days) */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Avg. Hours (Completed Days)
        </h3>
        <p className="text-3xl font-bold text-white">
          {avgHoursTillYesterday}
        </p>
      </div>

      {/* Average Hours Needed (Remaining Days) - Only show for current month */}
      {avgHoursNeeded !== null && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Avg. Hours Needed (Remaining Days)
          </h3>
          <p className="text-3xl font-bold text-white">
            {avgHoursNeeded}
          </p>
        </div>
      )}

      {/* Settings Display */}
      <div className="bg-gray-700 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Current Settings
        </h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            Min Hours/Day: <span className="font-semibold">{Math.floor(settings.minHoursPerDay / 60)}h {settings.minHoursPerDay % 60}m</span>
          </p>
          <p>
            Min Attendance: <span className="font-semibold">{settings.minAttendancePercentage}%</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
