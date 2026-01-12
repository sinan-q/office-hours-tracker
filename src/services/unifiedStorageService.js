import { getData as getSupabaseData, saveData as saveSupabaseData, getDefaultData } from './supabaseStorageService';

const LOCAL_STORAGE_KEY = 'office_hours_data_backup';

export const getData = async () => {
    try {
        // Try cloud first
        const data = await getSupabaseData();

        // Backup to local storage
        if (data) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }

        return { data, source: 'cloud' };
    } catch (error) {
        console.warn('Supabase fetch failed, falling back to local storage:', error);

        // Fallback to local
        const localJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localJson) {
            try {
                const data = JSON.parse(localJson);
                return { data, source: 'local' };
            } catch (parseError) {
                console.error('Failed to parse local backup:', parseError);
            }
        }

        // If both fail (or new user offline), return null/default based on caller handling
        // The App expects data to be the state. If we return null here, App might crash or show loading forever.
        // If we return undefined data, we should probably let App handle it or return a default structure here if we can.
        // However, getSupabaseData() already returns default structure on 'not found'.
        // So if we are here, it's a network error AND no local data.
        // We should probably return a default structure with 'offline' source so user can at least start working.
        return { data: getDefaultData(), source: 'offline' };
    }
};

export const saveData = async (value) => {
    // Always save to local backup first (optimistic/synchronous-like)
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }

    // Try cloud save
    try {
        const result = await saveSupabaseData(value);
        return { success: true, cloudSynced: result && result.success };
    } catch (error) {
        console.error('Unified save failed unexpectedly:', error);
        return { success: true, cloudSynced: false };
    }
};
