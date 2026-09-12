/**
 * Comp Off Management Service
 * 
 * Rules:
 * - User sets a starting available Comp Off balance as of a defined baseline date in Settings.
 * - Holidays and Weekends marked for Comp Off after the asOfDate increment the earned balance (+1 day each).
 * - Exception days marked as "COMP_OFF" after the asOfDate deduct from the balance (-1 day each).
 * - Balance carries forward indefinitely (no expiration).
 * - Full-day only (1.0 day).
 */

/**
 * Calculate Comp Off balances based on settings and calendarData
 */
export const calculateCompOffBalances = (compOffSettings = {}, calendarData = {}) => {
  const startingBalance = parseFloat(compOffSettings?.startingBalance) || 0;
  const asOfDateStr = compOffSettings?.asOfDate || '';

  let earned = 0;
  let used = 0;

  if (calendarData && typeof calendarData === 'object') {
    Object.keys(calendarData).forEach((year) => {
      const yearData = calendarData[year];
      if (!yearData) return;

      Object.keys(yearData).forEach((month) => {
        const monthData = yearData[month];
        if (!monthData) return;

        Object.keys(monthData).forEach((day) => {
          const entry = monthData[day];
          if (!entry) return;

          const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          // Only events strictly AFTER asOfDate affect the dynamic balance
          if (asOfDateStr && dateStr <= asOfDateStr) {
            return;
          }

          // Check if marked to earn comp off (on Weekend, Holiday, etc.)
          if (entry.earnedCompOff === true) {
            earned += 1;
          }

          // Check if consumed as Comp Off Exception
          if (entry.status === 'EXCEPTION' && entry.exceptionCategory === 'COMP_OFF') {
            used += 1;
          }
        });
      });
    });
  }

  const available = Math.max(0, startingBalance + earned - used);

  return {
    startingBalance,
    asOfDate: asOfDateStr,
    earned,
    used,
    available,
    isExhausted: available <= 0
  };
};

/**
 * Check if user can select Comp Off for a specific day
 */
export const canSelectCompOff = (compOffSettings = {}, calendarData = {}, dayDateStr, currentDayData = {}) => {
  const asOfDateStr = compOffSettings?.asOfDate || '';
  const stats = calculateCompOffBalances(compOffSettings, calendarData);

  // If this day is on or before asOfDate, it was already factored into baseline
  if (asOfDateStr && dayDateStr <= asOfDateStr) {
    return true;
  }

  let effectiveAvailable = stats.available;

  // Refund if this day is already counted as used Comp Off
  if (currentDayData?.status === 'EXCEPTION' && currentDayData?.exceptionCategory === 'COMP_OFF') {
    effectiveAvailable += 1;
  }

  return effectiveAvailable >= 1;
};
