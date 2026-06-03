/**
 * Process imported JSON and map to internal calendar data structure
 * 
 * Mapping Rules:
 * - "No Show" -> NO SHOW
 * - "Branch Holiday" -> HOLIDAY
 * - "Weekend" -> WEEKEND
 * - "Leave" / "Exception" -> LEAVE
 * - "At Office" -> SHOW
 * 
 * Override Rule: If dayStatus is "At Office" AND backgroundStatus is not empty,
 * map the backgroundStatus value instead
 */

const mapStatus = (dayStatus, backgroundStatus) => {
  // Override rule: If At Office and backgroundStatus exists, use backgroundStatus
  if (dayStatus === 'At Office' && backgroundStatus && backgroundStatus.trim() !== '') {
    // Map the background status
    if (backgroundStatus === 'Weekend') return 'WEEKEND';
    if (backgroundStatus === 'Branch Holiday') return 'HOLIDAY';
    if (backgroundStatus === 'Leave' || backgroundStatus === 'Exception') return 'LEAVE';
  }

  // Normal mapping
  if (dayStatus === 'No Show') return 'NO SHOW';
  if (dayStatus === 'Branch Holiday') return 'HOLIDAY';
  if (dayStatus === 'Weekend') return 'WEEKEND';
  if (dayStatus === 'Leave') return 'LEAVE';
  if (dayStatus === 'Exception') return 'EXCEPTION';
  if (dayStatus === 'At Office') return 'SHOW';

  // Default to EMPTY if unknown
  return 'EMPTY';
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
 */
export const processImportedJson = (jsonData, existingData) => {
  const newCalendarData = { ...existingData.calendarData };

  if (!Array.isArray(jsonData)) {
    throw new Error('Invalid JSON format: Expected an array of day entries');
  }

  jsonData.forEach((entry) => {
    const { date, dayStatus, backgroundStatus, swipeDtls } = entry;

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

    // Map the status
    const internalStatus = mapStatus(dayStatus, backgroundStatus);

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

    // Ensure nested structure exists
    if (!newCalendarData[year]) {
      newCalendarData[year] = {};
    }
    if (!newCalendarData[year][month]) {
      newCalendarData[year][month] = {};
    }

    // Determine originalStatus for toggle behavior
    let originalStatus;
    if (internalStatus !== 'SHOW' && internalStatus !== 'NO SHOW') {
      originalStatus = internalStatus;
    } else {
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      originalStatus = isWeekend ? 'WEEKEND' : 'EMPTY';
    }

    // Set the day data
    newCalendarData[year][month][day] = {
      status: internalStatus,
      time: time,
      originalStatus: originalStatus,
    };
  });

  return {
    ...existingData,
    calendarData: newCalendarData,
  };
};
