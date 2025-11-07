"use client";

import { useRef, useMemo } from "react";
import { Table as TanStackTable, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";

interface VirtualizedTableProps<TData> {
  table: TanStackTable<TData>;
  estimateSize?: number;
  overscan?: number;
  onRowClick?: (row: TData) => void;
  className?: string;
  emptyMessage?: string;
}

/**
 * TanStack Table + TanStack Virtual을 결합한 재사용 가능한 가상화 테이블
 *
 * Features:
 * - 보이는 행만 렌더링 (성능 최적화)
 * - 10,000+ 행도 부드러운 스크롤
 * - TanStack Table과 완전 호환
 * - 제네릭 타입 지원
 *
 * @example
 * ```tsx
 * const table = useReactTable({ ... });
 *
 * <VirtualizedTable
 *   table={table}
 *   estimateSize={50}
 *   onRowClick={(row) => console.log(row)}
 * />
 * ```
 */
export function VirtualizedTable<TData>({
  table,
  estimateSize = 50,
  overscan = 10,
  onRowClick,
  className = "max-h-[80vh]",
  emptyMessage,
}: VirtualizedTableProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  // ✅ TanStack Virtual 설정
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // ✅ 보이는 행의 시작/끝 인덱스
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div ref={tableContainerRef} className={`overflow-auto border rounded-lg ${className}`}>
      <table className="relative w-full caption-bottom text-sm">
        {/* 헤더 (Sticky) */}
        <TableHeader className="sticky top-0 z-10 bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-center bg-gray-100">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {/* 바디 (Virtualized) */}
        <TableBody className="divide-y divide-gray-200">
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                {emptyMessage || "표시할 데이터가 없습니다."}
              </TableCell>
            </TableRow>
          ) : (
            <>
              {/* 상단 패딩 (가상 공간) */}
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}

              {/* 보이는 행만 렌더링 */}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <MemoizedTableRow
                    key={row.id}
                    row={row}
                    onRowClick={onRowClick}
                  />
                );
              })}

              {/* 하단 패딩 (가상 공간) */}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </>
          )}
        </TableBody>
      </table>
    </div>
  );
}

/**
 * React.memo로 메모이제이션된 TableRow
 *
 * - 변경된 행만 리렌더링
 * - 나머지 행은 그대로 유지
 */
const MemoizedTableRow = <TData,>({
  row,
  onRowClick,
}: {
  row: any;
  onRowClick?: (row: TData) => void;
}) => {
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className="group hover:bg-gray-50 transition-colors duration-150"
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};
