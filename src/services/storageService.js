const STORAGE_KEY = 'officeHoursData';

const getDefaultData = () => ({
  settings: {
    minHoursPerDay: 300, // 5 hours in minutes
    minAttendancePercentage: 80,
  },
  calendarData: {},
});

export const getData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return getDefaultData();
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return getDefaultData();
  }
};

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};
