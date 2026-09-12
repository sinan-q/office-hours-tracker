/**
 * Exception Management Service
 * 
 * Rules:
 * - Two categories:
 *   1. Personal Exigencies (PE / WFH): Quota of 4 per quarter, no carry-forward.
 *   2. Other: Uncapped / official exemptions.
 * - Quarters:
 *   Q1: Jan - Mar (months 01, 02, 03)
 *   Q2: Apr - Jun (months 04, 05, 06)
 *   Q3: Jul - Sep (months 07, 08, 09)
 *   Q4: Oct - Dec (months 10, 11, 12)
 */

export const EXCEPTION_TYPES = {
  PE: {
    code: 'PE',
    name: 'Personal Exigency (WFH)',
    shortBadge: 'WFH',
    quotaPerQuarter: 4
  },
  OTHER: {
    code: 'OTHER',
    name: 'Other Exception',
    shortBadge: 'Other',
    quotaPerQuarter: null
  }
};

/**
 * Get quarter information for a given Date or YYYY-MM-DD string
 */
export const getQuarterInfo = (dateOrStr) => {
  let dateObj;
  if (typeof dateOrStr === 'string') {
    const [y, m, d] = dateOrStr.split('-').map(Number);
    dateObj = new Date(y, (m || 1) - 1, d || 1);
  } else if (dateOrStr instanceof Date) {
    dateObj = dateOrStr;
  } else {
    dateObj = new Date();
  }

  const month = dateObj.getMonth(); // 0 to 11
  const year = dateObj.getFullYear().toString();

  let quarterCode = 'Q1';
  let quarterName = 'Q1 (Jan - Mar)';
  let months = ['01', '02', '03'];

  if (month >= 3 && month <= 5) {
    quarterCode = 'Q2';
    quarterName = 'Q2 (Apr - Jun)';
    months = ['04', '05', '06'];
  } else if (month >= 6 && month <= 8) {
    quarterCode = 'Q3';
    quarterName = 'Q3 (Jul - Sep)';
    months = ['07', '08', '09'];
  } else if (month >= 9 && month <= 11) {
    quarterCode = 'Q4';
    quarterName = 'Q4 (Oct - Dec)';
    months = ['10', '11', '12'];
  }

  return {
    year,
    quarterCode,
    quarterName,
    months
  };
};

/**
 * Calculate Personal Exigency Exception statistics for the quarter containing the given date
 */
export const calculateExceptionStats = (calendarData, dateOrStr = new Date()) => {
  const qInfo = getQuarterInfo(dateOrStr);
  const { year, quarterCode, quarterName, months } = qInfo;

  let used = 0;

  if (calendarData && calendarData[year]) {
    months.forEach((mStr) => {
      const monthData = calendarData[year][mStr];
      if (monthData) {
        Object.keys(monthData).forEach((dayStr) => {
          const entry = monthData[dayStr];
          if (entry?.status === 'EXCEPTION' && entry?.exceptionCategory === 'PE') {
            used += 1;
          }
        });
      }
    });
  }

  const quota = EXCEPTION_TYPES.PE.quotaPerQuarter;
  const available = Math.max(0, quota - used);

  return {
    year,
    quarterCode,
    quarterName,
    quota,
    used,
    available,
    isExhausted: available <= 0
  };
};

/**
 * Check if user can select Personal Exigency on a specific day
 */
export const canSelectPersonalExigency = (calendarData, dayDateStr, currentDayData) => {
  const stats = calculateExceptionStats(calendarData, dayDateStr);
  let effectiveAvailable = stats.available;

  // Refund if this day is already marked as PE
  if (currentDayData?.status === 'EXCEPTION' && currentDayData?.exceptionCategory === 'PE') {
    effectiveAvailable += 1;
  }

  return effectiveAvailable >= 1;
};
