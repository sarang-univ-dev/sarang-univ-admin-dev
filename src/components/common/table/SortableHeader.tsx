import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableHeaderProps<TData> {
  column: Column<TData, unknown>;
  children: React.ReactNode;
  className?: string;
}

/**
 * 정렬 가능한 테이블 헤더 컴포넌트
 *
 * @description
 * - 3-state 정렬 토글 (정렬 없음 → 오름차순 → 내림차순)
 * - Multi-sort 지원 (정렬 순서 번호 표시)
 * - 정렬 상태를 아이콘으로 명확하게 표시
 *
 * @example
 * ```tsx
 * <SortableHeader column={column}>이름</SortableHeader>
 * ```
 */
export function SortableHeader<TData>({
  column,
  children,
  className = "",
}: SortableHeaderProps<TData>) {
  const sortingState = column.getIsSorted();
  const sortIndex = column.getSortIndex();

  // 정렬 순서 번호 (multi-sort 시 표시)
  const sortOrder = sortIndex !== -1 ? sortIndex + 1 : null;

  // 3-state 토글: false → 'asc' → 'desc' → false
  // ✅ multi-sort 활성화: 일반 클릭으로 다중 정렬 가능
  const handleSort = () => {
    if (!sortingState) {
      column.toggleSorting(false, true); // 오름차순 (multi-sort)
    } else if (sortingState === "asc") {
      column.toggleSorting(true, true); // 내림차순 (multi-sort)
    } else {
      column.clearSorting(); // 정렬 해제
    }
  };

  return (
    <div className={`flex items-center justify-center whitespace-nowrap ${className}`}>
      <Button
        variant="ghost"
        onClick={handleSort}
        size="sm"
        className="h-auto p-1 hover:bg-gray-100"
      >
        {children}
        <div className="ml-1 flex items-center gap-1">
          {/* 정렬 아이콘 */}
          {!sortingState && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
          {sortingState === "asc" && (
            <ArrowUp className="h-3 w-3 text-blue-600" />
          )}
          {sortingState === "desc" && (
            <ArrowDown className="h-3 w-3 text-blue-600" />
          )}

          {/* 정렬 순서 번호 (multi-sort 시) */}
          {sortOrder !== null && sortingState && (
            <span className="text-xs font-semibold text-blue-600 min-w-[14px]">
              {sortOrder}
            </span>
          )}
        </div>
      </Button>
    </div>
  );
}
