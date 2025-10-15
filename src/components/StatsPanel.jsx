import React from 'react';
import {
  calculateAttendancePercentage,
  calculateAvgHoursTillYesterday,
  calculateAvgHoursNeeded,
  calculateDaysCanSkip
} from '../services/statsService';

const StatsPanel = ({ appData, currentDate }) => {
  const { calendarData, settings } = appData;

  const attendancePercentage = calculateAttendancePercentage(calendarData, settings, currentDate);
  const avgHoursTillYesterday = calculateAvgHoursTillYesterday(calendarData, settings, currentDate);
  const avgHoursNeeded = calculateAvgHoursNeeded(calendarData, settings, currentDate);
  const daysCanSkip = calculateDaysCanSkip(calendarData, settings, currentDate);
  // Determine color for attendance percentage
  const getAttendanceColor = () => {
    if (attendancePercentage === 'N/A') return 'text-gray-400';
    const percentage = parseFloat(attendancePercentage);
    if (percentage >= settings.minAttendancePercentage) return 'text-green-400';
    return 'text-red-400';
  };

  // Determine color for average hours
  const getAvgHoursColor = () => {
    if (avgHoursTillYesterday === 'N/A') return 'text-gray-400';
    // Parse hours and minutes from "Xh Ym" format
    const match = avgHoursTillYesterday.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 'text-gray-400';
    const totalMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
    if (totalMinutes >= settings.minHoursPerDay) return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>

      {/* Attendance Percentage */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Attendance Percentage
        </h3>
        <p className={`text-3xl font-bold ${getAttendanceColor()}`}>
          {attendancePercentage === 'N/A' ? 'N/A' : `${attendancePercentage}%`}
        </p>
        {attendancePercentage !== 'N/A' && (
          <p className="text-xs text-gray-400 mt-1">
            Target: {settings.minAttendancePercentage}%
          </p>
        )}
      </div>

      {/* Average Hours (Completed Days) */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Avg. Hours (Completed Days)
        </h3>
        <p className={`text-3xl font-bold ${getAvgHoursColor()}`}>
          {avgHoursTillYesterday}
        </p>
        {avgHoursTillYesterday !== 'N/A' && (
          <p className="text-xs text-gray-400 mt-1">
            Target: {Math.floor(settings.minHoursPerDay / 60)}h {settings.minHoursPerDay % 60}m
          </p>
        )}
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

      {/* Days Can Skip or Need More SHOW Days - Only show for current month */}
      {daysCanSkip !== null && (
        <div className="bg-gray-700 rounded-lg p-4">
          
          {daysCanSkip.needShowDays ? (
            <>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Days You need to come on Weekends
              </h3>
              <p className="text-3xl font-bold text-red-400">
                 {daysCanSkip.needShowDays} {daysCanSkip.needShowDays === 1 ? 'day' : 'days' }
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Attendance is below {settings.minAttendancePercentage}% even if all you go all Remaining days
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Days You Can Skip (NO SHOW)
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                {daysCanSkip.canSkip} {daysCanSkip.canSkip === 1 ? 'day' : 'days'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                While maintaining {settings.minAttendancePercentage}% attendance
              </p>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default StatsPanel;
