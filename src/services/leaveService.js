/**
 * Leave Management and Tracking Service
 * 
 * Rules:
 * - Quarterly accruals happen on Jan 1, Apr 1, Jul 1, Oct 1.
 * - EL & SL: Carry forward across years, capped at absolute ceiling of 45 days.
 * - CL: Lapses on March 31 (resets to 0 before April 1 new FY credit).
 * - FL: Lapses on December 31 (resets to 0 before January 1 new CY credit).
 * - Half-day option (0.5 deduction) available for EL, SL, CL. FL is full day (1.0) only.
 * - Baseline Date: Only leaves taken strictly after the baseline date (date > asOfDate)
 *   are deducted from balances.
 */

export const LEAVE_TYPES = {
  EL: {
    code: 'EL',
    name: 'Earned Leave',
    maxCap: 45,
    allowHalfDay: true,
    ruleDescription: 'Carries forward (Max 45 days)'
  },
  SL: {
    code: 'SL',
    name: 'Sick Leave',
    maxCap: 45,
    allowHalfDay: true,
    ruleDescription: 'Carries forward (Max 45 days)'
  },
  CL: {
    code: 'CL',
    name: 'Casual Leave',
    maxCap: null,
    allowHalfDay: true,
    ruleDescription: 'Lapses on March 31'
  },
  FL: {
    code: 'FL',
    name: 'Flexi Leave',
    maxCap: null,
    allowHalfDay: false,
    ruleDescription: 'Lapses on Dec 31 (Full day only)'
  }
};

/**
 * Format a Date object to YYYY-MM-DD
 */
export const formatDateStr = (date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Generate all quarter boundaries (Jan 1, Apr 1, Jul 1, Oct 1)
 * occurring strictly after asOfDate up to and including targetDate.
 */
export const getQuarterMilestones = (asOfDateStr, targetDateStr) => {
  const milestones = [];
  if (!asOfDateStr || !targetDateStr || asOfDateStr >= targetDateStr) {
    return milestones;
  }

  const [startYear] = asOfDateStr.split('-').map(Number);
  const [endYear] = targetDateStr.split('-').map(Number);

  for (let year = startYear; year <= endYear; year++) {
    const quarterDates = [
      `${year}-01-01`,
      `${year}-04-01`,
      `${year}-07-01`,
      `${year}-10-01`
    ];

    quarterDates.forEach((qDate) => {
      if (qDate > asOfDateStr && qDate <= targetDateStr) {
        milestones.push(qDate);
      }
    });
  }

  return milestones.sort();
};

/**
 * Calculate the pending and used leave balances
 */
export const calculateLeaveBalances = (settings, calendarData, targetDate = new Date()) => {
  const leaveSettings = settings?.leaveSettings;
  const targetDateStr = typeof targetDate === 'string' ? targetDate : formatDateStr(targetDate);
  const asOfDateStr = leaveSettings?.asOfDate || targetDateStr;

  const startingEL = parseFloat(leaveSettings?.EL?.startingBalance) || 0;
  const startingSL = parseFloat(leaveSettings?.SL?.startingBalance) || 0;
  const startingCL = parseFloat(leaveSettings?.CL?.startingBalance) || 0;
  const startingFL = parseFloat(leaveSettings?.FL?.startingBalance) || 0;

  const accrualEL = parseFloat(leaveSettings?.EL?.quarterlyAccrual) || 0;
  const accrualSL = parseFloat(leaveSettings?.SL?.quarterlyAccrual) || 0;
  const accrualCL = parseFloat(leaveSettings?.CL?.quarterlyAccrual) || 0;
  const accrualFL = parseFloat(leaveSettings?.FL?.quarterlyAccrual) || 0;

  // Build a timeline of all events strictly after asOfDate up to targetDate
  const events = [];

  // 1. Add Quarter Milestones
  const quarterMilestones = getQuarterMilestones(asOfDateStr, targetDateStr);
  quarterMilestones.forEach((mDate) => {
    events.push({
      date: mDate,
      type: 'QUARTER_ACCRUAL',
      isJan1: mDate.endsWith('-01-01'),
      isApr1: mDate.endsWith('-04-01')
    });
  });

  // 2. Add Leave Usages
  let totalUsed = { EL: 0, SL: 0, CL: 0, FL: 0 };
  let currentPeriodUsed = { EL: 0, SL: 0, CL: 0, FL: 0 };

  if (calendarData) {
    Object.keys(calendarData).forEach((year) => {
      Object.keys(calendarData[year]).forEach((month) => {
        Object.keys(calendarData[year][month]).forEach((day) => {
          const dayEntry = calendarData[year][month][day];
          const dateStr = `${year}-${month}-${day}`;

          if (dateStr > asOfDateStr && dateStr <= targetDateStr && dayEntry.status === 'LEAVE') {
            const cat = dayEntry.leaveCategory;
            if (cat && LEAVE_TYPES[cat]) {
              const duration = parseFloat(dayEntry.leaveDuration) || 1.0;
              events.push({
                date: dateStr,
                type: 'LEAVE_TAKEN',
                category: cat,
                duration: duration
              });
              totalUsed[cat] += duration;
            }
          }
        });
      });
    });
  }

  // Sort events chronologically. On the same date, process QUARTER_ACCRUAL before LEAVE_TAKEN
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type === 'QUARTER_ACCRUAL' && b.type !== 'QUARTER_ACCRUAL') return -1;
    if (a.type !== 'QUARTER_ACCRUAL' && b.type === 'QUARTER_ACCRUAL') return 1;
    return 0;
  });

  // 3. Process events chronologically
  let runningEL = Math.min(startingEL, 45);
  let runningSL = Math.min(startingSL, 45);
  let runningCL = startingCL;
  let runningFL = startingFL;

  let totalAccrued = { EL: 0, SL: 0, CL: 0, FL: 0 };
  let totalLapsed = { EL: 0, SL: 0, CL: 0, FL: 0 };

  events.forEach((ev) => {
    if (ev.type === 'QUARTER_ACCRUAL') {
      // Lapsing:
      if (ev.isJan1) {
        totalLapsed.FL += runningFL;
        runningFL = 0;
        currentPeriodUsed.FL = 0;
      }
      if (ev.isApr1) {
        totalLapsed.CL += runningCL;
        runningCL = 0;
        currentPeriodUsed.CL = 0;
      }

      // Accruals:
      runningEL = Math.min(runningEL + accrualEL, 45);
      totalAccrued.EL += accrualEL;

      runningSL = Math.min(runningSL + accrualSL, 45);
      totalAccrued.SL += accrualSL;

      runningCL += accrualCL;
      totalAccrued.CL += accrualCL;

      runningFL += accrualFL;
      totalAccrued.FL += accrualFL;
    } else if (ev.type === 'LEAVE_TAKEN') {
      const cat = ev.category;
      const dur = ev.duration;

      if (cat === 'EL') runningEL = Math.max(0, runningEL - dur);
      if (cat === 'SL') runningSL = Math.max(0, runningSL - dur);
      if (cat === 'CL') runningCL = Math.max(0, runningCL - dur);
      if (cat === 'FL') runningFL = Math.max(0, runningFL - dur);

      currentPeriodUsed[cat] += dur;
    }
  });

  return {
    EL: {
      starting: startingEL,
      quarterlyAccrual: accrualEL,
      accrued: totalAccrued.EL,
      lapsed: totalLapsed.EL,
      used: totalUsed.EL,
      available: runningEL
    },
    SL: {
      starting: startingSL,
      quarterlyAccrual: accrualSL,
      accrued: totalAccrued.SL,
      lapsed: totalLapsed.SL,
      used: totalUsed.SL,
      available: runningSL
    },
    CL: {
      starting: startingCL,
      quarterlyAccrual: accrualCL,
      accrued: totalAccrued.CL,
      lapsed: totalLapsed.CL,
      used: totalUsed.CL,
      available: runningCL
    },
    FL: {
      starting: startingFL,
      quarterlyAccrual: accrualFL,
      accrued: totalAccrued.FL,
      lapsed: totalLapsed.FL,
      used: totalUsed.FL,
      available: runningFL
    }
  };
};

/**
 * Check if user can select a given leave type and duration on a specific day
 */
export const canSelectLeave = (balances, category, duration, currentDayData, dayDateStr, asOfDateStr) => {
  if (!category || !balances[category]) return true;

  // If the day is on or before asOfDate, it's historical and doesn't consume balance
  if (asOfDateStr && dayDateStr <= asOfDateStr) {
    return true;
  }

  let effectiveAvailable = balances[category].available;

  // If this day is already using this leave category, refund its duration for the check
  if (currentDayData?.status === 'LEAVE' && currentDayData?.leaveCategory === category) {
    const currentDuration = parseFloat(currentDayData.leaveDuration) || 1.0;
    effectiveAvailable += currentDuration;
  }

  return effectiveAvailable >= duration;
};
