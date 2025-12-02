import { useState, useMemo } from "react";
import { Column, Table } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  Check,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface UnifiedColumnHeaderProps<TData> {
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
   * 필터 값을 정렬할 함수
   * @example (a, b) => schedules.findIndex(s => s.id === a) - schedules.findIndex(s => s.id === b)
   */
  sortFilterValues?: (a: any, b: any) => number;
  /**
   * 정렬/필터 없이 제목만 표시
   */
  titleOnly?: boolean;
}

/**
 * 통합 테이블 헤더 컴포넌트 (정렬 + 필터를 하나의 아이콘으로)
 *
 * @description
 * - 하나의 아이콘으로 정렬과 필터 기능을 모두 제공
 * - 클릭하면 Popover에서 정렬과 필터 옵션을 함께 표시
 * - 공간을 절약하면서 기능성 유지
 * - Google Spreadsheet 스타일 UI
 *
 * @example
 * ```tsx
 * // 정렬 + 필터
 * <UnifiedColumnHeader
 *   column={column}
 *   table={table}
 *   title="성별"
 *   enableSorting
 *   enableFiltering
 *   formatFilterValue={(value) => value === 'MALE' ? '남자' : '여자'}
 * />
 *
 * // 정렬만
 * <UnifiedColumnHeader column={column} table={table} title="이름" enableSorting />
 *
 * // 필터만
 * <UnifiedColumnHeader column={column} table={table} title="타입" enableFiltering />
 *
 * // 제목만
 * <UnifiedColumnHeader column={column} table={table} title="전화번호" />
 * ```
 */
export function UnifiedColumnHeader<TData>({
  column,
  table,
  title,
  enableSorting = false,
  enableFiltering = false,
  formatFilterValue = (value) => String(value),
  sortFilterValues,
  titleOnly = false,
}: UnifiedColumnHeaderProps<TData>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 제목만 표시
  if (titleOnly || (!enableSorting && !enableFiltering)) {
    return (
      <div className="text-center text-sm whitespace-nowrap px-2">
        {title}
      </div>
    );
  }

  // === 정렬 관련 로직 ===
  const sortingState = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  const sortOrder = sortIndex !== -1 ? sortIndex + 1 : null;

  const handleSort = (direction: "asc" | "desc" | false) => {
    if (!enableSorting) return;

    if (direction === false) {
      column.clearSorting();
    } else {
      column.toggleSorting(direction === "desc", true); // multi-sort 활성화
    }
  };

  // === 필터 관련 로직 ===
  const filterValue = (column.getFilterValue() as string[]) || [];

  // ✅ getPreFilteredRowModel() 사용 (가장 안정적인 방식)
  // getFacetedUniqueValues()가 빈 Map을 반환하는 문제가 있어서
  // 공식 문서의 대안인 getPreFilteredRowModel()을 사용
  const uniqueValues = useMemo(() => {
    if (!enableFiltering) return [];

    const valuesSet = new Set<string | number>();
    let hasEmptyValue = false;

    // 필터링 전 모든 행에서 고유 값 추출
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const value = row.getValue(column.id);

      if (Array.isArray(value)) {
        if (value.length === 0) {
          hasEmptyValue = true;
        } else {
          value.forEach((item) => valuesSet.add(item));
        }
      } else if (value === null || value === undefined || value === "") {
        hasEmptyValue = true;
      } else {
        valuesSet.add(value as string | number);
      }
    });

    // 정렬
    const values = Array.from(valuesSet).sort((a, b) => {
      if (sortFilterValues) {
        return sortFilterValues(a, b);
      }
      if (typeof a === "number" && typeof b === "number") {
        return a - b;
      }
      return String(a).localeCompare(String(b));
    });

    if (hasEmptyValue) {
      return ["__EMPTY__", ...values] as (string | number)[];
    }
    return values;
  }, [table, column.id, enableFiltering, sortFilterValues]);

  // 검색어로 필터링된 값 목록
  const filteredValues = useMemo(() => {
    if (!searchTerm) return uniqueValues;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return uniqueValues.filter((value) => {
      const displayValue = value === "__EMPTY__" ? "값 없음" : formatFilterValue(value);
      return displayValue.toLowerCase().includes(lowerSearchTerm);
    });
  }, [uniqueValues, searchTerm, formatFilterValue]);

  // 체크박스 상태 관리
  const [selectedValues, setSelectedValues] = useState<Set<any>>(
    new Set(filterValue)
  );

  // 전체 선택 (현재 필터링된 값들만)
  const handleSelectAll = () => {
    const newSet = new Set(selectedValues);
    filteredValues.forEach((value) => newSet.add(value));
    setSelectedValues(newSet);
  };

  // 전체 해제 (현재 필터링된 값들만)
  const handleClearAll = () => {
    const newSet = new Set(selectedValues);
    filteredValues.forEach((value) => newSet.delete(value));
    setSelectedValues(newSet);
  };

  // 개별 선택/해제
  const handleToggle = (value: any) => {
    const newSet = new Set(selectedValues);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedValues(newSet);
  };

  // 필터 적용
  const handleApplyFilter = () => {
    const values = Array.from(selectedValues);
    column.setFilterValue(values.length === uniqueValues.length ? undefined : values);
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setSelectedValues(new Set(uniqueValues));
    column.setFilterValue(undefined);
  };

  // Popover 열릴 때 현재 필터 값으로 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedValues(new Set(filterValue.length > 0 ? filterValue : uniqueValues));
      setSearchTerm(""); // 검색어 초기화
    }
    setOpen(isOpen);
  };

  // 적용 버튼 클릭
  const handleApply = () => {
    if (enableFiltering) {
      handleApplyFilter();
    }
    setOpen(false);
  };

  // 초기화 버튼 클릭
  const handleReset = () => {
    if (enableSorting) {
      column.clearSorting();
    }
    if (enableFiltering) {
      handleResetFilter();
    }
    setOpen(false);
  };

  const isFiltered = filterValue.length > 0 && filterValue.length < uniqueValues.length;
  const filteredCount = filterValue.length;
  const hasActiveState = sortingState || isFiltered;

  return (
    <div className="flex items-center justify-center gap-1 whitespace-nowrap">
      <span className="text-sm">{title}</span>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-gray-100 relative"
          >
            <SlidersHorizontal
              className={`h-3 w-3 ${hasActiveState ? "text-blue-600" : "text-gray-400"}`}
            />
            {/* 활성 상태 표시 배지 */}
            {hasActiveState && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="flex flex-col">
            {/* === 정렬 섹션 === */}
            {enableSorting && (
              <>
                <div className="px-3 py-2 border-b bg-gray-50">
                  <span className="text-sm font-medium">정렬</span>
                </div>
                <div className="p-2">
                  <Button
                    variant={sortingState === "asc" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleSort("asc")}
                    className="w-full justify-start h-8 text-sm"
                  >
                    <ArrowUp className="h-3 w-3 mr-2" />
                    오름차순
                    {sortingState === "asc" && sortOrder !== null && (
                      <span className="ml-auto text-xs font-semibold text-blue-600">
                        {sortOrder}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant={sortingState === "desc" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleSort("desc")}
                    className="w-full justify-start h-8 text-sm mt-1"
                  >
                    <ArrowDown className="h-3 w-3 mr-2" />
                    내림차순
                    {sortingState === "desc" && sortOrder !== null && (
                      <span className="ml-auto text-xs font-semibold text-blue-600">
                        {sortOrder}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant={!sortingState ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleSort(false)}
                    className="w-full justify-start h-8 text-sm mt-1"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-2" />
                    정렬 없음
                  </Button>
                </div>
              </>
            )}

            {/* 구분선 (정렬과 필터가 모두 활성화된 경우) */}
            {enableSorting && enableFiltering && <Separator />}

            {/* === 필터 섹션 === */}
            {enableFiltering && (
              <>
                <div className="px-3 py-2 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">필터</span>
                    <span className="text-xs text-gray-500">
                      {selectedValues.size === uniqueValues.length
                        ? "전체"
                        : `${selectedValues.size}개 선택`}
                    </span>
                  </div>
                </div>

                {/* 검색 입력 필드 */}
                <div className="px-3 py-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* 전체 선택/해제 버튼 */}
                <div className="flex gap-1 px-3 py-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex-1 h-7 text-xs"
                  >
                    전체 선택
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="flex-1 h-7 text-xs"
                  >
                    전체 해제
                  </Button>
                </div>

                {/* 값 목록 (Checkbox) */}
                <ScrollArea className="h-[200px]">
                  <div className="p-2">
                    {filteredValues.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-4">
                        검색 결과가 없습니다.
                      </div>
                    ) : (
                      filteredValues.map((value) => {
                        const isSelected = selectedValues.has(value);
                        return (
                          <div
                            key={String(value)}
                            className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => handleToggle(value)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggle(value)}
                              className="cursor-pointer"
                            />
                            <span className="text-sm flex-1 cursor-pointer">
                              {value === "__EMPTY__" ? "값 없음" : formatFilterValue(value)}
                            </span>
                            {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </>
            )}

            {/* 하단 버튼 */}
            <div className="flex gap-2 px-3 py-2 border-t bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1 h-8 text-xs"
              >
                초기화
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1 h-8 text-xs"
              >
                적용
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
