import { supabase } from './supabaseClient';

const TABLE_NAME = 'office_hours_data';
const DEFAULT_ID = 'default';

export const getDefaultData = () => ({
  settings: {
    minHoursPerDay: 300,
    minAttendancePercentage: 80,
  },
  calendarData: {},
});

export const getData = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', DEFAULT_ID)
    .single();

  if (error) {
    // PGRST116 is code for "The result contains 0 rows" (i.e. new user)
    // 406 Not Acceptable is also sometimes returned for single() on empty
    if (error.code === 'PGRST116' || error.code === '406') {
      return getDefaultData();
    }
    // For other errors (network, auth, server), throw so we can fallback
    console.warn('Supabase error:', error);
    throw error;
  }

  if (!data) {
    return getDefaultData();
  }
  return data.value;
};

export const saveData = async (value) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ id: DEFAULT_ID, value });
  if (error) {
    console.error('Error saving to Supabase:', error);
    return { success: false, error };
  }
  return { success: true };
};
