import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp page whenever items/pageSize changes
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const nextPage = () => goToPage(safePage + 1);
  const prevPage = () => goToPage(safePage - 1);

  return {
    paginated,
    page: safePage,
    totalPages,
    pageSize,
    totalItems: items.length,
    goToPage,
    nextPage,
    prevPage,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    setPage,
  };
}
