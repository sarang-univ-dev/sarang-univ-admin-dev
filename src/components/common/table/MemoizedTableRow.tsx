"use client";

import { memo } from "react";
import { Row, flexRender } from "@tanstack/react-table";
import { TableRow, TableCell } from "@/components/ui/table";

interface MemoizedTableRowProps<TData> {
  row: Row<TData>;
  onRowClick?: (row: TData) => void;
  className?: string;
}

/**
 * React.memo로 메모이제이션된 TableRow 컴포넌트
 *
 * Features:
 * - 변경된 행만 리렌더링
 * - 나머지 행은 그대로 유지
 * - 1000+ 행에서 리렌더링 성능 향상
 *
 * Performance:
 * - Without memo: 전체 테이블 리렌더링
 * - With memo: 변경된 행만 리렌더링
 *
 * @example
 * ```tsx
 * {table.getRowModel().rows.map((row) => (
 *   <MemoizedTableRow
 *     key={row.id}
 *     row={row}
 *     onRowClick={(data) => console.log(data)}
 *   />
 * ))}
 * ```
 */
export const MemoizedTableRow = memo(
  function MemoizedTableRow<TData>({
    row,
    onRowClick,
    className = "group hover:bg-gray-50 transition-colors duration-150",
  }: MemoizedTableRowProps<TData>) {
    return (
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        className={className}
        onClick={() => onRowClick?.(row.original)}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  },
  // ✅ 커스텀 비교 함수: 행 ID가 같고 데이터가 같으면 리렌더링 안 함
  (prevProps, nextProps) => {
    return (
      prevProps.row.id === nextProps.row.id &&
      prevProps.row.original === nextProps.row.original
    );
  }
) as <TData>(props: MemoizedTableRowProps<TData>) => JSX.Element;
