//frontend\hooks\use-filters.ts
import { useState, useCallback, useMemo, useEffect } from "react";

export type FilterValue = string | number | boolean | null;
export type FilterMap<T extends string = string> = Record<T, FilterValue>;

export interface UseFiltersOptions<T extends string = string> {
  initialFilters?: Partial<Record<T, FilterValue>>;
  onFilterChange?: (filters: Partial<Record<T, FilterValue>>) => void;
}

export function useFilters<T extends string = string>({
  initialFilters = {},
  onFilterChange,
}: UseFiltersOptions<T> = {}) {
  const [filters, setFilters] = useState<Partial<Record<T, FilterValue>>>(initialFilters);

  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const setFilter = useCallback(<K extends T>(key: K, value: FilterValue) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === null || value === undefined || value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }, []);

  const clearFilter = useCallback(<K extends T>(key: K) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const resetFilters = useCallback((newFilters?: Partial<Record<T, FilterValue>>) => {
    setFilters(newFilters || {});
  }, []);

  const hasFilters = useMemo(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  const activeFilters = useMemo(() => {
    return Object.keys(filters) as T[];
  }, [filters]);

  const filterItems = useCallback(
    <U extends Record<string, any>>(
      items: U[],
      filterFn: (item: U, filters: Partial<Record<T, FilterValue>>) => boolean,
    ): U[] => {
      if (!hasFilters) return items;
      return items.filter((item) => filterFn(item, filters));
    },
    [filters, hasFilters],
  );

  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    resetFilters,
    hasFilters,
    activeFilters,
    filterItems,
  };
}
