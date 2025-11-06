import { Column, Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterableHeader } from "./FilterableHeader";

interface ColumnHeaderProps<TData> {
  column: Column<TData, unknown>;
  table: Table<TData>;
  title: string;
  /**
   * 정렬 기능 활성화 (기본값: false)
   */
  enableSorting?: boolean;
  /**
   * 필터 기능 활성화 (기본값: false)
   */
  enableFiltering?: boolean;
  /**
   * 필터 값을 표시할 포맷 함수
   * @example (value) => value === 'M' ? '남자' : '여자'
   */
  formatFilterValue?: (value: any) => string;
  /**
   * 정렬/필터 없이 제목만 표시
   */
  titleOnly?: boolean;
}

/**
 * 통합 테이블 헤더 컴포넌트 (정렬 + 필터)
 *
 * @description
 * - 정렬과 필터 기능을 통합한 헤더 컴포넌트
 * - 옵션에 따라 정렬/필터 개별 활성화 가능
 * - Google Spreadsheet 스타일 UI
 *
 * @example
 * ```tsx
 * // 정렬 + 필터
 * <ColumnHeader
 *   column={column}
 *   table={table}
 *   title="성별"
 *   enableSorting
 *   enableFiltering
 *   formatFilterValue={(value) => value === 'MALE' ? '남자' : '여자'}
 * />
 *
 * // 정렬만
 * <ColumnHeader column={column} table={table} title="이름" enableSorting />
 *
 * // 필터만
 * <ColumnHeader column={column} table={table} title="타입" enableFiltering />
 *
 * // 제목만
 * <ColumnHeader column={column} table={table} title="전화번호" />
 * ```
 */
export function ColumnHeader<TData>({
  column,
  table,
  title,
  enableSorting = false,
  enableFiltering = false,
  formatFilterValue,
  titleOnly = false,
}: ColumnHeaderProps<TData>) {
  // 제목만 표시
  if (titleOnly || (!enableSorting && !enableFiltering)) {
    return (
      <div className="text-center text-sm whitespace-nowrap px-2">
        {title}
      </div>
    );
  }

  const sortingState = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  const sortOrder = sortIndex !== -1 ? sortIndex + 1 : null;

  // 3-state 토글: false → 'asc' → 'desc' → false
  const handleSort = () => {
    if (!enableSorting) return;

    if (!sortingState) {
      column.toggleSorting(false); // 오름차순
    } else if (sortingState === "asc") {
      column.toggleSorting(true); // 내림차순
    } else {
      column.clearSorting(); // 정렬 해제
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 whitespace-nowrap">
      {/* 정렬 버튼 */}
      {enableSorting ? (
        <Button
          variant="ghost"
          onClick={handleSort}
          size="sm"
          className="h-auto p-1 hover:bg-gray-100"
        >
          {title}
          <div className="ml-1 flex items-center gap-1">
            {!sortingState && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
            {sortingState === "asc" && (
              <ArrowUp className="h-3 w-3 text-blue-600" />
            )}
            {sortingState === "desc" && (
              <ArrowDown className="h-3 w-3 text-blue-600" />
            )}

            {/* 정렬 순서 번호 */}
            {sortOrder !== null && sortingState && (
              <span className="text-xs font-semibold text-blue-600 min-w-[14px]">
                {sortOrder}
              </span>
            )}
          </div>
        </Button>
      ) : (
        <span className="text-sm px-2">{title}</span>
      )}

      {/* 필터 버튼 */}
      {enableFiltering && (
        <FilterableHeader
          column={column}
          table={table}
          title={title}
          formatValue={formatFilterValue}
        />
      )}
    </div>
  );
}
