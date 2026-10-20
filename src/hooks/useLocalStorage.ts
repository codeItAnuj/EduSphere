import { useState, useEffect } from 'react';

/**
 * Custom hook that synchronizes React state with browser localStorage.
 * Ensures all tasks, courses, study logs, and theme preferences persist
 * across page refreshes.
 *
 * @param key The localStorage key name
 * @param initialValue Fallback initial data when no saved value exists
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state once by reading from localStorage if available
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Persist to localStorage whenever key or storedValue updates
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
