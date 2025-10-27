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
 * Calculate attendance percentage for the current month
 * Numerator: Days where status is SHOW OR (status is WEEKEND/HOLIDAY AND time > 0)
 * Denominator: Days where status is SHOW OR NO SHOW
 */
export const calculateAttendancePercentage = (calendarData, settings, currentDate) => {
  let numerator = 0;
  let denominator = 0;

  const year = currentDate.getFullYear().toString();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');

  // Only iterate through the current month
  if (calendarData[year] && calendarData[year][month]) {
    for (const day in calendarData[year][month]) {
      const dayData = calendarData[year][month][day];
      const status = dayData.status;
      const time = dayData.time || 0;

      // Count for denominator: SHOW, NO SHOW, or EXCEPTION
      if (status === 'SHOW' || status === 'NO SHOW' || status === 'EXCEPTION' || status === 'LEAVE') {
        denominator++;
      }

      // Count for numerator using isAttendanceDay helper
      if (isAttendanceDay(status, time)) {
        numerator++;
      }
    }
  }

  if (denominator === 0) {
    return 'N/A';
  }

  return ((numerator / denominator) * 100).toFixed(2);
};

/**
 * Calculate average hours for all days with logged time, including today if logged
 */
export const calculateAvgHoursTillYesterday = (calendarData, settings, currentDate) => {
  let totalMinutes = 0;
  let count = 0;

  const year = currentDate.getFullYear().toString();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const today = new Date();
  const todayStr = today.getDate().toString().padStart(2, '0');
  const isCurrentMonth = 
    currentDate.getFullYear() === today.getFullYear() && 
    currentDate.getMonth() === today.getMonth();

  // Only iterate through the current month
  if (calendarData[year] && calendarData[year][month]) {
    for (const day in calendarData[year][month]) {
      const dayData = calendarData[year][month][day];
      const time = dayData.time || 0;
      const isToday = isCurrentMonth && day === todayStr;
      
      // Include days before today and today if it has time logged
      if (time > 0 && (isBeforeToday(parseInt(year), parseInt(month), parseInt(day)) || isToday)) {
        totalMinutes += time;
        count++;
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
 * Calculate average hours needed per day for remaining days in the current month
 * Formula: (TotalRequired - TotalLogged) / RemainingDays
 * - TotalRequired: minHoursPerDay * (SHOW days + EMPTY/unlogged weekdays)
 * - TotalLogged: Sum of all logged time
 * - RemainingDays: EMPTY/unlogged weekdays from today to end of month
 */
export const calculateAvgHoursNeeded = (calendarData, settings, currentDate) => {
  const year = currentDate.getFullYear().toString();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  
  // Check if we're viewing the current month
  const today = new Date();
  const isCurrentMonth = 
    currentDate.getFullYear() === today.getFullYear() && 
    currentDate.getMonth() === today.getMonth();
  
  if (!isCurrentMonth) {
    return {
      average: null,
      remainingDays: 0
    }; // Return null for non-current months
  }
  
  let totalLogged = 0;
  let showDaysCount = 0;
  let remainingEmptyWeekdays = 0;
  const todayDay = today.getDate();

  // Get the last day of the current month
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const dayStr = day.toString().padStart(2, '0');
    const dayData = getDayData(calendarData, year, month, dayStr);
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isTodayOrLater = day >= todayDay;
    
    if (dayData && (dayData.status === 'SHOW' || (dayData.status && dayData.status !== 'EMPTY'))) {
      // Day has a status that's been explicitly set (not EMPTY)
      const isToday = day === todayDay;
      const time = dayData.time || 0;
      const isUnloggedToday = isToday && (!time || time === 0);

      if (dayData.status === 'SHOW') {
        // For today, only count in showDaysCount if time is logged
        if (!isToday || time > 0) {
          showDaysCount++;
          totalLogged += time;
        }
        // If today has no time logged, count it in remaining days
        if (isUnloggedToday) {
          remainingEmptyWeekdays++;
        }
      } else if (time > 0) {
        // Any other status with time logged (e.g., worked on weekend/holiday)
        showDaysCount++;
        totalLogged += time;
      }
      // If status is NO SHOW, LEAVE, EXCEPTION, HOLIDAY, or WEEKEND without time, don't count toward requirements
    } else {
      // No data OR status is EMPTY - treat as unlogged day
      if (!isWeekend) {
        const isToday = day === todayDay
        // Count as remaining if after today, or if it's today
        if (day > todayDay || isToday) {
          remainingEmptyWeekdays++;
        }
      }
    }
  }

  if (remainingEmptyWeekdays === 0) {
    return {
      average: 'N/A',
      remainingDays: 0
    };
  }

  // There are no separate "total empty weekdays" in this calculation;
  // use the remainingEmptyWeekdays (weekdays still to be worked) when
  // computing total required days for the remaining-period calculation.
  const totalRequiredDays = showDaysCount + remainingEmptyWeekdays;
  const totalRequiredMinutes = totalRequiredDays * settings.minHoursPerDay;
  const remainingMinutes = totalRequiredMinutes - totalLogged;
  const avgMinutesNeeded = remainingMinutes / remainingEmptyWeekdays;

  if (avgMinutesNeeded <= 0) {
    return {
      average: '0h 0m',
      remainingDays: remainingEmptyWeekdays
    };
  }

  const hours = Math.floor(avgMinutesNeeded / 60);
  const minutes = Math.round(avgMinutesNeeded % 60);
  return {
    average: `${hours}h ${minutes}m`,
    remainingDays: remainingEmptyWeekdays
  };
};

/**
 * Calculate how many days can be skipped (NO SHOW) while maintaining minimum attendance
 * Only for current month
 */
export const calculateDaysCanSkip = (calendarData, settings, currentDate) => {
  const today = new Date();
  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();
  if (!isCurrentMonth) {
    return null;
  }

  // Gather all workdays and their statuses
  const year = currentDate.getFullYear().toString();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  let showDays = [];
  let noShowDays = [];
  let emptyDays = [];
  for (let day = 1; day <= lastDay; day++) {
    const dayStr = day.toString().padStart(2, '0');
    const dayData = getDayData(calendarData, year, month, dayStr);
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend) {
      if (dayData) {
        if (dayData.status === 'SHOW') {
          showDays.push(day);
        } else if (dayData.status === 'NO SHOW') {
          noShowDays.push(day);
        } else if (dayData.status === 'EMPTY') {
          emptyDays.push(day);
        } else if (dayData.status === 'EXCEPTION') {
          showDays.push(day); // Treat EXCEPTION as a SHOW day
        }
      } else {
        emptyDays.push(day);
      }
    }
  }

  // Simulate converting EMPTY days to NO SHOW, rest as SHOW, using attendance logic
  let maxSkippable = 0;
  const minAttendancePercentage = settings.minAttendancePercentage;
  if (showDays.length + noShowDays.length + emptyDays.length === 0) {
    return { canSkip: 'N/A', needShowDays: null, emptyDaysLeft: 0 };
  }
  let lastPercent = 0;
  for (let skips = 0; skips <= emptyDays.length; skips++) {
    // Build a simulated calendar for this scenario
    let numerator = 0;
    let denominator = 0;
    let skipCount = 0;
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const dayData = getDayData(calendarData, year, month, dayStr);
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      let status, time;
      if (!isWeekend) {
        if (dayData) {
          status = dayData.status;
          time = dayData.time || 0;
        } else {
          status = 'EMPTY';
          time = 0;
        }
        if (status === 'EMPTY') {
          // Simulate skips as NO SHOW, rest as SHOW
          if (skipCount < skips) {
            status = 'NO SHOW';
            skipCount++;
          } else {
            status = 'SHOW';
          }
        }
        // Denominator: SHOW, NO SHOW, or EXCEPTION
        if (status === 'SHOW' || status === 'NO SHOW' || status === 'EXCEPTION') {
          denominator++;
        }
        // Numerator: Use isAttendanceDay helper
        if (isAttendanceDay(status, time)) {
          numerator++;
        }
      } else {
        // For weekends, use original logic
        if (dayData) {
          status = dayData.status;
          time = dayData.time || 0;
        } else {
          status = 'EMPTY';
          time = 0;
        }
        // Numerator: (WEEKEND/HOLIDAY with time > 0)
        if ((status === 'WEEKEND' || status === 'HOLIDAY') && time > 0) {
          numerator++;
        }
      }
    }
    const percent = denominator === 0 ? 0 : (numerator / denominator) * 100;
    lastPercent = percent;
    if (percent >= minAttendancePercentage) {
      maxSkippable = skips;
    } else {
      break;
    }
  }
  // If even with all EMPTY days as SHOW, percent is below required, show how many more SHOW days needed
  if (maxSkippable === 0 && lastPercent < minAttendancePercentage) {
    // Calculate how many more SHOW days needed
    // Denominator: all SHOW and NO SHOW days (including all EMPTY as SHOW)
    let numerator = 0;
    let denominator = 0;
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const dayData = getDayData(calendarData, year, month, dayStr);
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      let status, time;
      if (!isWeekend) {
        if (dayData) {
          status = dayData.status;
          time = dayData.time || 0;
        } else {
          status = 'SHOW'; // treat all EMPTY as SHOW
          time = 0;
        }
        if (status === 'SHOW' || status === 'NO SHOW' || status === 'EXCEPTION') {
          denominator++;
        }
        if (isAttendanceDay(status, time)) {
          numerator++;
        }
      } else {
        // For weekends, use original logic
        if (dayData) {
          status = dayData.status;
          time = dayData.time || 0;
        } else {
          status = 'EMPTY';
          time = 0;
        }
        // Numerator: (WEEKEND/HOLIDAY with time > 0)
        if ((status === 'WEEKEND' || status === 'HOLIDAY') && time > 0) {
          numerator++;
        }
      }
    }
    const percent = denominator === 0 ? 0 : (numerator / denominator) * 100;
    if (percent >= minAttendancePercentage) {
      maxSkippable = emptyDays.length;
    } else {
      // Calculate exact number of additional SHOW days needed
      const additionalShowsNeeded = Math.ceil(((minAttendancePercentage / 100) * denominator) - numerator);
      return { canSkip: 0, needShowDays: additionalShowsNeeded, emptyDaysLeft: emptyDays.length };
    }
  }
  return { canSkip: maxSkippable, needShowDays: null, emptyDaysLeft: emptyDays.length - maxSkippable };
};

// Helper function to determine if a day should be included in attendance calculations
const isAttendanceDay = (status, time) => {
  // Include SHOW, WEEKEND/HOLIDAY with time > 0, EXCEPTION, and LEAVE days
  if (status === 'SHOW' || status === 'EXCEPTION' || status === 'LEAVE') {
    return true;
  } else if ((status === 'WEEKEND' || status === 'HOLIDAY') && time > 0) {
    return true;
  }
  return false;
};
