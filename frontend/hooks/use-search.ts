//frontend\hooks\use-search.ts
import { useState, useMemo, useCallback, useEffect } from "react";

export interface UseSearchOptions<T> {
  data: T[];
  keys: (keyof T)[];
  debounce?: number;
  initialQuery?: string;
}

export function useSearch<T extends Record<string, any>>({
  data,
  keys,
  debounce = 300,
  initialQuery = "",
}: UseSearchOptions<T>) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounce);

    return () => clearTimeout(timer);
  }, [query, debounce]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return data;
    const q = debouncedQuery.toLowerCase().trim();
    return data.filter((item) => {
      return keys.some((key) => {
        const value = item[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      });
    });
  }, [data, keys, debouncedQuery]);

  const reset = useCallback(() => {
    setQuery("");
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    reset,
    isEmpty: results.length === 0,
  };
}
