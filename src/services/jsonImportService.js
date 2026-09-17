/**
 * Process imported JSON and map to internal calendar data structure
 * 
 * Mapping Rules:
 * - "No Show" -> NO SHOW
 * - "Branch Holiday" -> HOLIDAY
 * - "Weekend" -> WEEKEND
 * - "Leave" -> LEAVE
 * - "Exception" -> EXCEPTION
 * - "At Office" -> SHOW
 * 
 * Override Rule: If dayStatus is "At Office" AND backgroundStatus is not empty,
 * map the backgroundStatus value instead
 */

const mapStatus = (dayStatus, backgroundStatus, dayName, dateStr) => {
  // Override rule: If At Office and backgroundStatus exists, use backgroundStatus
  if (dayStatus === 'At Office' && backgroundStatus && backgroundStatus.trim() !== '') {
    // Map the background status
    if (backgroundStatus === 'Weekend') return 'WEEKEND';
    if (backgroundStatus === 'Branch Holiday') return 'HOLIDAY';
    if (backgroundStatus === 'Leave') return 'LEAVE';
    if (backgroundStatus === 'Exception') return 'EXCEPTION';
  }

  // Normal mapping
  if (dayStatus === 'No Show') return 'NO SHOW';
  if (dayStatus === 'Branch Holiday') return 'HOLIDAY';
  if (dayStatus === 'Weekend') return 'WEEKEND';
  if (dayStatus === 'Leave') return 'LEAVE';
  if (dayStatus === 'Exception') return 'EXCEPTION';
  if (dayStatus === 'At Office') return 'SHOW';

  // Fallback for unpopulated upcoming days:
  // Check dayName from JSON or calculate day of week from date
  const upperDayName = dayName ? dayName.toUpperCase() : '';
  if (upperDayName === 'SATURDAY' || upperDayName === 'SUNDAY') {
    return 'WEEKEND';
  }
  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND';
      }
    }
  }

  // Default to EMPTY if unknown
  return 'EMPTY';
};

/**
 * Check if the imported data or existing calendar data has dates after today
 */
export const checkHasUpcomingDays = (jsonData, existingCalendarData) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Array.isArray(jsonData)) {
    // 1. Check if any entry in jsonData is in the future
    for (const entry of jsonData) {
      if (entry?.date) {
        const [y, m, d] = entry.date.split('-').map(Number);
        if (y && m && d) {
          const entryDate = new Date(y, m - 1, d);
          entryDate.setHours(0, 0, 0, 0);
          if (entryDate > today) return true;
        }
      }
    }

    // 2. Check if existingCalendarData has future entries in any months touched by jsonData
    const touchedMonths = new Set();
    for (const entry of jsonData) {
      if (entry?.date) {
        const [y, m] = entry.date.split('-');
        if (y && m) touchedMonths.add(`${y}-${m}`);
      }
    }

    if (existingCalendarData) {
      for (const ym of touchedMonths) {
        const [yStr, mStr] = ym.split('-');
        const monthData = existingCalendarData[yStr]?.[mStr];
        if (monthData) {
          for (const dStr of Object.keys(monthData)) {
            const d = parseInt(dStr);
            const entryDate = new Date(parseInt(yStr), parseInt(mStr) - 1, d);
            entryDate.setHours(0, 0, 0, 0);
            if (entryDate > today) return true;
          }
        }
      }
    }
  } else if (jsonData?.calendarData) {
    // Check imported calendarData
    for (const yStr of Object.keys(jsonData.calendarData)) {
      for (const mStr of Object.keys(jsonData.calendarData[yStr] || {})) {
        for (const dStr of Object.keys(jsonData.calendarData[yStr][mStr] || {})) {
          const entryDate = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));
          entryDate.setHours(0, 0, 0, 0);
          if (entryDate > today) return true;
        }
      }
    }
  }

  return false;
};

/**
 * Process imported JSON data
 * Expected format of imported JSON:
 * [
 *   {
 *     "swipeDtls": [
 *       { "timeSpentCategory": "3-5" }
 *     ],
 *     "dayStatus": "At Office",
 *     "backgroundStatus": "",
 *     "dayName": "THURSDAY",
 *     "booking": false,
 *     "date": "2025-09-18"
 *   },
 *   ...
 * ]
 * 
 * @param {Array} jsonData Array of day entries from company attendance portal
 * @param {Object} existingData Existing application data { settings, calendarData }
 * @param {Object} options Configuration options:
 *   - replaceUpcomingAsEmpty: if true, resets upcoming days to EMPTY (or WEEKEND); if false, preserves existing upcoming entries
 */
export const processImportedJson = (jsonData, existingData, options = {}) => {
  const { replaceUpcomingAsEmpty = false } = options;
  const newCalendarData = { ...existingData?.calendarData };

  if (!Array.isArray(jsonData)) {
    throw new Error('Invalid JSON format: Expected an array of day entries');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Keep track of touched months in case we need to reset all upcoming days in those months
  const touchedMonths = new Set();

  jsonData.forEach((entry) => {
    const { date, dayStatus, backgroundStatus, dayName, swipeDtls } = entry;

    if (!date) {
      console.warn('Skipping entry without date:', entry);
      return;
    }

    // Parse date (expected format: YYYY-MM-DD)
    const [year, month, day] = date.split('-');

    if (!year || !month || !day) {
      console.warn('Invalid date format:', date);
      return;
    }

    touchedMonths.add(`${year}-${month}`);

    const entryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    entryDate.setHours(0, 0, 0, 0);
    const isUpcoming = entryDate > today;

    // Check existing entry
    const existingEntry = existingData?.calendarData?.[year]?.[month]?.[day];

    // Ensure nested structure exists
    if (!newCalendarData[year]) {
      newCalendarData[year] = {};
    }
    if (!newCalendarData[year][month]) {
      newCalendarData[year][month] = {};
    }

    // If this is an upcoming date and user chose to preserve existing plans:
    if (isUpcoming && !replaceUpcomingAsEmpty && existingEntry) {
      newCalendarData[year][month][day] = { ...existingEntry };
      return;
    }

    // Map the status (with fallback to dayName/date for upcoming weekends)
    const internalStatus = mapStatus(dayStatus, backgroundStatus, dayName, date);

    // If upcoming and replaceUpcomingAsEmpty is true:
    if (isUpcoming && replaceUpcomingAsEmpty) {
      const dayOfWeek = entryDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Keep holidays if explicitly recognized in import
      if (internalStatus === 'HOLIDAY') {
        newCalendarData[year][month][day] = {
          status: 'HOLIDAY',
          time: null,
          originalStatus: 'HOLIDAY',
          leaveCategory: null,
          leaveDuration: null,
          originalLeaveCategory: null,
          originalLeaveDuration: null,
          exceptionCategory: null,
          originalExceptionCategory: null,
          earnedCompOff: false,
          originalEarnedCompOff: false
        };
      } else {
        newCalendarData[year][month][day] = {
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
      return;
    }

    // Determine time value - parse from swipeDtls[0].timeSpentCategory (e.g., "3-5" -> 3 hours -> 180 minutes)
    let time = null;
    if (swipeDtls && Array.isArray(swipeDtls) && swipeDtls.length > 0) {
      const timeCat = swipeDtls[0].timeSpentCategory;
      if (timeCat && typeof timeCat === 'string') {
        const firstVal = timeCat.split('-')[0];
        const hours = parseInt(firstVal);
        if (!isNaN(hours)) {
          // If extracted hour is 0, set to 1 minute, otherwise convert to minutes
          time = hours === 0 ? 1 : hours * 60;
        }
      }
    }

    // Determine originalStatus for toggle behavior
    let originalStatus;
    if (internalStatus !== 'SHOW' && internalStatus !== 'NO SHOW') {
      originalStatus = internalStatus;
    } else {
      const upperDayName = dayName ? dayName.toUpperCase() : '';
      const dayOfWeek = entryDate.getDay();
      const isWeekend = upperDayName === 'SATURDAY' || upperDayName === 'SUNDAY' || dayOfWeek === 0 || dayOfWeek === 6;
      originalStatus = isWeekend ? 'WEEKEND' : 'EMPTY';
    }

    // Check existing entry to preserve user-assigned leave and exception categorization
    let leaveCategory = null;
    let leaveDuration = null;
    let originalLeaveCategory = existingEntry?.originalLeaveCategory || null;
    let originalLeaveDuration = existingEntry?.originalLeaveDuration || null;

    if (internalStatus === 'LEAVE') {
      leaveCategory = existingEntry?.leaveCategory || existingEntry?.originalLeaveCategory || null;
      leaveDuration = existingEntry?.leaveDuration || existingEntry?.originalLeaveDuration || null;
      originalLeaveCategory = leaveCategory;
      originalLeaveDuration = leaveDuration;
    }

    let exceptionCategory = null;
    let originalExceptionCategory = existingEntry?.originalExceptionCategory || null;

    if (internalStatus === 'EXCEPTION') {
      exceptionCategory = existingEntry?.exceptionCategory || existingEntry?.originalExceptionCategory || null;
      originalExceptionCategory = exceptionCategory;
    }

    const isWeekendOrHoliday = internalStatus === 'HOLIDAY' || internalStatus === 'WEEKEND';
    let earnedCompOff = false;
    let originalEarnedCompOff = existingEntry?.originalEarnedCompOff ?? false;

    if (isWeekendOrHoliday) {
      earnedCompOff = existingEntry?.earnedCompOff ?? existingEntry?.originalEarnedCompOff ?? false;
      originalEarnedCompOff = earnedCompOff;
    }

    // Set the day data
    newCalendarData[year][month][day] = {
      status: internalStatus,
      time: time,
      originalStatus: originalStatus,
      leaveCategory: leaveCategory,
      leaveDuration: leaveDuration,
      originalLeaveCategory: originalLeaveCategory,
      originalLeaveDuration: originalLeaveDuration,
      exceptionCategory: exceptionCategory,
      originalExceptionCategory: originalExceptionCategory,
      earnedCompOff: earnedCompOff,
      originalEarnedCompOff: originalEarnedCompOff
    };
  });

  // If user requested to replace upcoming days as EMPTY, also ensure any upcoming days
  // in the touched months that might not have been in the array are reset to EMPTY / WEEKEND
  if (replaceUpcomingAsEmpty) {
    touchedMonths.forEach((ym) => {
      const [yStr, mStr] = ym.split('-');
      const y = parseInt(yStr);
      const m = parseInt(mStr);
      const daysInMonth = new Date(y, m, 0).getDate();

      if (!newCalendarData[yStr]) newCalendarData[yStr] = {};
      if (!newCalendarData[yStr][mStr]) newCalendarData[yStr][mStr] = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const dDate = new Date(y, m - 1, d);
        dDate.setHours(0, 0, 0, 0);
        if (dDate > today) {
          const dStr = d.toString().padStart(2, '0');
          const dayOfWeek = dDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const currentEntry = newCalendarData[yStr][mStr][dStr];
          const isHoliday = currentEntry?.status === 'HOLIDAY';

          if (isHoliday) {
            newCalendarData[yStr][mStr][dStr] = {
              ...currentEntry,
              time: null
            };
          } else {
            newCalendarData[yStr][mStr][dStr] = {
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
      }
    });
  }

  return {
    ...existingData,
    calendarData: newCalendarData,
  };
};
