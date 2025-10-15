import { supabase } from './supabaseClient';

const TABLE_NAME = 'office_hours_data';
const DEFAULT_ID = 'default';

const getDefaultData = () => ({
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
  if (error || !data) {
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
  }
};
