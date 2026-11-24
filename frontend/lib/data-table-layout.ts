// frontend/lib/data-table-layout.ts

export function estimateDataTableContentHeight({
  rowCount,
  pageSize,
  compact,
  comfortable,
}: {
  rowCount: number;
  pageSize: number;
  compact: boolean;
  comfortable: boolean;
}): number {
  if (rowCount <= 0) return 144;

  const headerHeight = compact ? 34 : comfortable ? 48 : 44;
  const rowHeight = compact ? 46 : comfortable ? 70 : 58;
  const visibleRows = Math.min(rowCount, Math.max(1, pageSize));
  const paginationHeight = rowCount > pageSize ? 48 : 0;
  return headerHeight + visibleRows * rowHeight + paginationHeight + 4;
}
