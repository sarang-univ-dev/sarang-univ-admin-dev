"use client";

import { useRef, memo, useCallback } from "react";
import { Table as TanStackTable, flexRender, Row } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";

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

  // ✅ Best Practice: getItemKey를 useCallback으로 메모이제이션
  // - 안정적인 key로 virtualization 성능 향상
  // - row.id를 사용하여 각 행을 고유하게 식별
  const getItemKey = useCallback(
    (index: number) => rows[index]?.id ?? index,
    [rows]
  );

  // ✅ TanStack Virtual 설정 (스크롤 위치 유지)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey, // Best Practice: 안정적인 key 제공
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
                // ✅ visible cell IDs를 미리 계산하여 prop으로 전달
                // memo 비교 함수에서 안정적으로 비교 가능
                const visibleCellIds = row.getVisibleCells().map(c => c.id).join(',');
                return (
                  <MemoizedTableRow
                    key={row.id}
                    row={row}
                    visibleCellIds={visibleCellIds}
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
 * MemoizedTableRow Props 인터페이스
 */
interface MemoizedTableRowProps<TData> {
  row: Row<TData>;
  visibleCellIds: string;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
}

/**
 * React.memo로 메모이제이션된 TableRow
 *
 * Best Practices (출처: TanStack Table + Material React Table docs):
 * 1. getItemKey를 사용하여 안정적인 row 식별 (위에서 구현됨)
 * 2. Shallow comparison 사용 (Deep comparison은 성능 저하)
 * 3. Column visibility는 visible cells ID로 감지
 * 4. Row ID 변경은 무조건 리렌더링 (Virtual Scrolling row 재사용 대응)
 *
 * 주의: Material React Table 문서에 따르면 "Usually you should not ever need to do this"
 * 하지만 SWR polling + WebSocket 업데이트 환경에서는 필요함
 *
 * @see https://stackoverflow.com/questions/60386614/how-to-use-props-with-generics-with-react-memo
 */
function TableRowComponent<TData>({
  row,
  visibleCellIds,
  onRowClick,
  getRowClassName,
}: MemoizedTableRowProps<TData>) {
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
      {row.getVisibleCells().map((cell) => (
        <MemoizedTableCell key={cell.id} cell={cell} />
      ))}
    </TableRow>
  );
}

// ✅ Best Practice: Shallow comparison으로 성능 최적화
// visibleCellIds를 prop으로 받아서 안정적으로 비교
function areTableRowPropsEqual<TData>(
  prevProps: MemoizedTableRowProps<TData>,
  nextProps: MemoizedTableRowProps<TData>
): boolean {
  // 1. Row ID 변경 체크 (Virtual Scrolling으로 다른 row가 같은 위치에 올 수 있음)
  if (prevProps.row.id !== nextProps.row.id) {
    return false; // Row가 바뀌었으면 무조건 리렌더링
  }

  // 2. Column visibility 변경 체크 (prop으로 전달받은 visibleCellIds 비교)
  // ✅ Fix: row.getVisibleCells() 대신 prop으로 비교하여 정확한 visibility 감지
  if (prevProps.visibleCellIds !== nextProps.visibleCellIds) {
    return false; // Column visibility가 변경되었으면 리렌더링
  }

  // 3. 데이터 변경 체크 (Shallow comparison - 1 depth만)
  // SWR이 같은 참조를 반환하면 리렌더링 안 함
  if (prevProps.row.original !== nextProps.row.original) {
    return false; // 데이터 참조가 변경되었으면 리렌더링
  }

  return true; // 변경사항 없으면 리렌더링 안 함
}

// ✅ Best Practice: memo + type casting으로 제네릭 보존
const MemoizedTableRow = memo(TableRowComponent, areTableRowPropsEqual) as typeof TableRowComponent;

/**
 * React.memo로 메모이제이션된 TableCell
 *
 * Best Practices:
 * - Cell 값과 row ID만 비교 (shallow comparison)
 * - Deep comparison 제거하여 성능 향상
 * - Virtual Scrolling row 재사용 대응
 */
const MemoizedTableCell = memo(
  function TableCellComponent({ cell }: { cell: any }) {
    const content = flexRender(cell.column.columnDef.cell, cell.getContext());

    return (
      <TableCell>
        {content}
      </TableCell>
    );
  },
  (prevProps, nextProps) => {
    // 1. Row ID 변경 체크 (Virtual Scrolling으로 다른 row가 같은 위치에 올 수 있음)
    const prevRowId = prevProps.cell.row.original.id;
    const nextRowId = nextProps.cell.row.original.id;

    if (prevRowId !== nextRowId) {
      return false; // 다른 row면 무조건 리렌더링
    }

    // 2. Cell ID 변경 체크 (column visibility 변경)
    if (prevProps.cell.id !== nextProps.cell.id) {
      return false; // Cell ID가 변경되었으면 리렌더링
    }

    // 3. Cell 값 변경 체크 (Shallow comparison)
    // 같은 참조면 리렌더링 안 함
    if (prevProps.cell.getValue() !== nextProps.cell.getValue()) {
      return false; // 값이 변경되었으면 리렌더링
    }

    return true; // 변경사항 없으면 리렌더링 안 함
  }
);
