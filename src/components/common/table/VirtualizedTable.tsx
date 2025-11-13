"use client";

import { useRef, useMemo, memo } from "react";
import { Table as TanStackTable, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import isEqual from "lodash/isEqual";

interface VirtualizedTableProps<TData> {
  table: TanStackTable<TData>;
  estimateSize?: number;
  overscan?: number;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
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
  getRowClassName,
  className = "max-h-[80vh]",
  emptyMessage,
}: VirtualizedTableProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  // ✅ TanStack Virtual 설정 (스크롤 위치 유지)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
    // ✅ 데이터 변경 시 스크롤 위치 유지
    // measureElement를 사용하지 않으면 기본적으로 스크롤 위치가 유지됨
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
              {headerGroup.headers
                .filter((header) => header.column.getIsVisible())
                .map((header) => (
                  <TableHead key={header.id} className="text-center bg-gray-100 whitespace-nowrap">
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
                    getRowClassName={getRowClassName}
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
 * - lodash isEqual로 깊은 비교 (polling 시 동일한 데이터는 재렌더링 안 함)
 */
const MemoizedTableRow = memo(
  function TableRowComponent<TData>({
    row,
    onRowClick,
    getRowClassName,
  }: {
    row: any;
    onRowClick?: (row: TData) => void;
    getRowClassName?: (row: TData) => string;
  }) {
    const customClassName = getRowClassName?.(row.original) || '';
    // customClassName에 이미 hover 클래스가 있으면 기본 hover를 적용하지 않음
    const hasCustomHover = customClassName.includes('hover:');
    const defaultHoverClass = hasCustomHover ? '' : 'hover:bg-gray-50';

    return (
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        className={`group ${defaultHoverClass} transition-colors duration-150 ${customClassName}`}
        onClick={() => onRowClick?.(row.original)}
      >
        {row.getVisibleCells().map((cell: any) => (
          <MemoizedTableCell key={cell.id} cell={cell} />
        ))}
      </TableRow>
    );
  },
  // ✅ 커스텀 비교 함수: row.original이 실제로 변경된 경우에만 리렌더링
  (prevProps, nextProps) => {
    return (
      prevProps.row.id === nextProps.row.id &&
      isEqual(prevProps.row.original, nextProps.row.original)
    );
  }
);

/**
 * React.memo로 메모이제이션된 TableCell
 *
 * - Cell 단위로도 메모이제이션하여 성능 최적화
 */
const MemoizedTableCell = memo(
  function TableCellComponent({ cell }: { cell: any }) {
    return (
      <TableCell>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    );
  },
  (prevProps, nextProps) => {
    // Cell 값이 실제로 변경된 경우에만 리렌더링
    return isEqual(prevProps.cell.getValue(), nextProps.cell.getValue());
  }
);
