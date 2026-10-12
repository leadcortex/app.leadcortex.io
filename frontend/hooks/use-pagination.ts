//frontend\hooks\use-pagination.ts
import { useState, useMemo, useCallback } from "react";

export interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
  totalItems?: number;
}

export function usePagination({
  pageSize = 10,
  initialPage = 1,
  totalItems = 0,
}: UsePaginationOptions = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  const goToFirst = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLast = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const paginatedItems = useCallback(
    <T>(items: T[]): T[] => {
      const start = (currentPage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [currentPage, pageSize],
  );

  const range = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  }, [currentPage, pageSize, totalItems]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    paginatedItems,
    range,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
}
