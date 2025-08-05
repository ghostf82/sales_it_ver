/**
 * Utility functions for working with localStorage to preserve application data
 */

// Keys for localStorage
const KEYS = {
  DASHBOARD_DATA: 'dashboard_data',
  FILTER_STATE: 'filter_state',
  USER_PREFERENCES: 'user_preferences'
};

/**
 * Save data to localStorage
 * @param key - The key to store the data under
 * @param data - The data to store
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Load data from localStorage
 * @param key - The key to retrieve data from
 * @param defaultValue - Default value to return if no data is found
 * @returns The stored data or the default value
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Save dashboard data to localStorage
 * @param data - The dashboard data to save
 */
export function saveDashboardData(data: any): void {
  saveToLocalStorage(KEYS.DASHBOARD_DATA, data);
}

/**
 * Load dashboard data from localStorage
 * @returns The stored dashboard data or null if none exists
 */
export function loadDashboardData(): any | null {
  return loadFromLocalStorage(KEYS.DASHBOARD_DATA, null);
}

/**
 * Save filter state to localStorage
 * @param filters - The filter state to save
 */
export function saveFilterState(filters: any): void {
  saveToLocalStorage(KEYS.FILTER_STATE, filters);
}

/**
 * Load filter state from localStorage
 * @param defaultFilters - Default filters to use if none are stored
 * @returns The stored filter state or the default filters
 */
export function loadFilterState(defaultFilters: any): any {
  return loadFromLocalStorage(KEYS.FILTER_STATE, defaultFilters);
}

/**
 * Save user preferences to localStorage
 * @param preferences - The user preferences to save
 */
export function saveUserPreferences(preferences: any): void {
  saveToLocalStorage(KEYS.USER_PREFERENCES, preferences);
}

/**
 * Load user preferences from localStorage
 * @param defaultPreferences - Default preferences to use if none are stored
 * @returns The stored user preferences or the default preferences
 */
export function loadUserPreferences(defaultPreferences: any): any {
  return loadFromLocalStorage(KEYS.USER_PREFERENCES, defaultPreferences);
}

/**
 * Clear all stored data
 */
export function clearAllStoredData(): void {
  localStorage.removeItem(KEYS.DASHBOARD_DATA);
  localStorage.removeItem(KEYS.FILTER_STATE);
  localStorage.removeItem(KEYS.USER_PREFERENCES);
}