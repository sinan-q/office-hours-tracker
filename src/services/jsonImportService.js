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
  if (dayStatus === 'Leave' || dayStatus === 'Exception') return 'LEAVE';
  if (dayStatus === 'At Office') return 'SHOW';

  // Default to EMPTY if unknown
  return 'EMPTY';
};

/**
 * Process imported JSON data
 * Expected format of imported JSON:
 * [
 *   {
 *     "date": "2025-10-15",
 *     "dayStatus": "At Office",
 *     "backgroundStatus": "",
 *     "timeInMinutes": 480
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
    const { date, dayStatus, backgroundStatus, timeInMinutes } = entry;

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

    // Determine time value
    let time = null;
    if (internalStatus === 'SHOW' || (timeInMinutes && timeInMinutes > 0)) {
      time = timeInMinutes || 0;
    }

    // Ensure nested structure exists
    if (!newCalendarData[year]) {
      newCalendarData[year] = {};
    }
    if (!newCalendarData[year][month]) {
      newCalendarData[year][month] = {};
    }

    // Set the day data
    newCalendarData[year][month][day] = {
      status: internalStatus,
      time: time,
    };
  });

  return {
    ...existingData,
    calendarData: newCalendarData,
  };
};
