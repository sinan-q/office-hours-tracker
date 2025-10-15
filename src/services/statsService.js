// Helper function to check if a date is before today
const isBeforeToday = (year, month, day) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(year, month - 1, day);
  return checkDate < today;
};

// Helper function to check if a date is today or after
const isTodayOrAfter = (year, month, day) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(year, month - 1, day);
  return checkDate >= today;
};

// Get day data safely
const getDayData = (calendarData, year, month, day) => {
  return calendarData?.[year]?.[month]?.[day] || null;
};

/**
 * Calculate attendance percentage
 * Numerator: Days where status is SHOW OR (status is WEEKEND/HOLIDAY AND time > 0)
 * Denominator: Days where status is SHOW OR NO SHOW
 */
export const calculateAttendancePercentage = (calendarData, settings) => {
  let numerator = 0;
  let denominator = 0;

  // Iterate through all years, months, and days in calendarData
  for (const year in calendarData) {
    for (const month in calendarData[year]) {
      for (const day in calendarData[year][month]) {
        const dayData = calendarData[year][month][day];
        const status = dayData.status;
        const time = dayData.time || 0;

        // Count for denominator: SHOW or NO SHOW
        if (status === 'SHOW' || status === 'NO SHOW') {
          denominator++;
        }

        // Count for numerator: SHOW or (WEEKEND/HOLIDAY with time > 0)
        if (status === 'SHOW') {
          numerator++;
        } else if ((status === 'WEEKEND' || status === 'HOLIDAY') && time > 0) {
          numerator++;
        }
      }
    }
  }

  if (denominator === 0) {
    return 'N/A';
  }

  return ((numerator / denominator) * 100).toFixed(2);
};

/**
 * Calculate average hours for all completed days before today
 * Only considers days with status SHOW
 */
export const calculateAvgHoursTillYesterday = (calendarData, settings) => {
  let totalMinutes = 0;
  let count = 0;

  for (const year in calendarData) {
    for (const month in calendarData[year]) {
      for (const day in calendarData[year][month]) {
        const dayData = calendarData[year][month][day];
        
        // Only consider SHOW days before today
        if (dayData.status === 'SHOW' && isBeforeToday(parseInt(year), parseInt(month), parseInt(day))) {
          totalMinutes += dayData.time || 0;
          count++;
        }
      }
    }
  }

  if (count === 0) {
    return 'N/A';
  }

  const avgMinutes = totalMinutes / count;
  const hours = Math.floor(avgMinutes / 60);
  const minutes = Math.round(avgMinutes % 60);
  return `${hours}h ${minutes}m`;
};

/**
 * Calculate average hours needed per day for remaining days
 * Formula: (TotalRequired - TotalLogged) / RemainingDays
 * - TotalRequired: minHoursPerDay * (SHOW days + EMPTY days)
 * - TotalLogged: Sum of all logged time
 * - RemainingDays: EMPTY days from today to end of month
 */
export const calculateAvgHoursNeeded = (calendarData, settings, currentDate) => {
  const year = currentDate.getFullYear().toString();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  
  let totalLogged = 0;
  let showDaysCount = 0;
  let emptyDaysCount = 0;
  let remainingEmptyDays = 0;

  // Get the last day of the current month
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const dayStr = day.toString().padStart(2, '0');
    const dayData = getDayData(calendarData, year, month, dayStr);
    
    if (dayData) {
      if (dayData.status === 'SHOW') {
        showDaysCount++;
        totalLogged += dayData.time || 0;
      } else if (dayData.time) {
        // Any other status with time logged
        totalLogged += dayData.time;
      }
    } else {
      // EMPTY day
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayOfWeek = date.getDay();
      
      // Don't count weekends as empty workdays
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        emptyDaysCount++;
        
        // Count as remaining if today or after
        if (isTodayOrAfter(parseInt(year), parseInt(month), day)) {
          remainingEmptyDays++;
        }
      }
    }
  }

  if (remainingEmptyDays === 0) {
    return 'N/A';
  }

  const totalRequiredDays = showDaysCount + emptyDaysCount;
  const totalRequiredMinutes = totalRequiredDays * settings.minHoursPerDay;
  const remainingMinutes = totalRequiredMinutes - totalLogged;
  const avgMinutesNeeded = remainingMinutes / remainingEmptyDays;

  if (avgMinutesNeeded <= 0) {
    return '0h 0m';
  }

  const hours = Math.floor(avgMinutesNeeded / 60);
  const minutes = Math.round(avgMinutesNeeded % 60);
  return `${hours}h ${minutes}m`;
};
