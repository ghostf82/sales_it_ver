import { useState, useEffect } from 'react';
import { 
  saveDashboardData, 
  loadDashboardData, 
  saveFilterState, 
  loadFilterState 
} from '../utils/localStorage';

/**
 * Custom hook for persisting and retrieving dashboard data
 * @param initialData - Initial data to use if no persisted data exists
 * @param key - Optional key to differentiate between different data sets
 * @returns Object containing the persisted data and functions to update it
 */
export function useDataPersistence<T>(initialData: T, key: string = 'default') {
  // Load data from localStorage or use initialData
  const [data, setData] = useState<T>(() => {
    const savedData = loadDashboardData();
    if (savedData && savedData[key]) {
      return savedData[key] as T;
    }
    return initialData;
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const savedData = loadDashboardData() || {};
    savedData[key] = data;
    saveDashboardData(savedData);
  }, [data, key]);

  // Function to update data
  const updateData = (newData: T | ((prevData: T) => T)) => {
    setData(prevData => {
      if (typeof newData === 'function') {
        return (newData as ((prevData: T) => T))(prevData);
      }
      return newData;
    });
  };

  // Function to reset data to initial value
  const resetData = () => {
    setData(initialData);
  };

  return { data, updateData, resetData };
}

/**
 * Custom hook for persisting and retrieving filter state
 * @param initialFilters - Initial filters to use if no persisted filters exist
 * @param key - Optional key to differentiate between different filter sets
 * @returns Object containing the persisted filters and functions to update them
 */
export function useFilterPersistence<T>(initialFilters: T, key: string = 'default') {
  // Load filters from localStorage or use initialFilters
  const [filters, setFilters] = useState<T>(() => {
    const savedFilters = loadFilterState({});
    if (savedFilters && savedFilters[key]) {
      return savedFilters[key] as T;
    }
    return initialFilters;
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const savedFilters = loadFilterState({});
    savedFilters[key] = filters;
    saveFilterState(savedFilters);
  }, [filters, key]);

  // Function to update filters
  const updateFilters = (newFilters: T | ((prevFilters: T) => T)) => {
    setFilters(prevFilters => {
      if (typeof newFilters === 'function') {
        return (newFilters as ((prevFilters: T) => T))(prevFilters);
      }
      return newFilters;
    });
  };

  // Function to reset filters to initial value
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return { filters, updateFilters, resetFilters };
}