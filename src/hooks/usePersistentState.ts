import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue !== null) return JSON.parse(storedValue) as T;
    } catch {
      // Fall back to the supplied value when storage is unavailable or invalid.
    }

    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The interface remains usable when private browsing blocks storage.
    }
  }, [key, value]);

  return [value, setValue] as const;
}