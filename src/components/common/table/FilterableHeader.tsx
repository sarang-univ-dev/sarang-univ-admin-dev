import { useState, useMemo } from "react";
import { Column, Table } from "@tanstack/react-table";
import { Filter, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterableHeaderProps<TData> {
  column: Column<TData, unknown>;
  table: Table<TData>;
  title?: string;
  /**
   * 필터 값을 표시할 포맷 함수
   * @example (value) => value === 'M' ? '남자' : '여자'
   */
  formatValue?: (value: any) => string;
}

/**
 * 필터링 가능한 테이블 헤더 컴포넌트 (Google Spreadsheet 스타일)
 *
 * @description
 * - Popover + Checkbox 리스트로 다중 필터 선택
 * - 해당 열의 고유 값 자동 추출
 * - "전체 선택", "전체 해제", "초기화" 버튼
 * - 현재 필터 개수 표시
 *
 * @example
 * ```tsx
 * <FilterableHeader
 *   column={column}
 *   table={table}
 *   title="성별"
 *   formatValue={(value) => value === 'MALE' ? '남자' : '여자'}
 * />
 * ```
 */
export function FilterableHeader<TData>({
  column,
  table,
  title,
  formatValue = (value) => String(value),
}: FilterableHeaderProps<TData>) {
  const [open, setOpen] = useState(false);

  // 현재 필터 값 (배열)
  const filterValue = (column.getFilterValue() as any[]) || [];

  // 해당 컬럼의 고유 값 목록 추출 (값 없음 포함)
  const uniqueValues = useMemo(() => {
    const valuesSet = new Set<any>();
    let hasEmptyValue = false;

    table.getPreFilteredRowModel().rows.forEach((row) => {
      const value = row.getValue(column.id);
      if (value === null || value === undefined || value === "") {
        hasEmptyValue = true;
      } else {
        valuesSet.add(value);
      }
    });

    const values = Array.from(valuesSet).sort();

    // 값이 없는 행이 있으면 맨 앞에 추가
    if (hasEmptyValue) {
      return ["__EMPTY__", ...values];
    }

    return values;
  }, [table, column.id]);

  // 체크박스 상태 관리
  const [selectedValues, setSelectedValues] = useState<Set<any>>(
    new Set(filterValue)
  );

  // 전체 선택
  const handleSelectAll = () => {
    setSelectedValues(new Set(uniqueValues));
  };

  // 전체 해제
  const handleClearAll = () => {
    setSelectedValues(new Set());
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
  const handleApply = () => {
    const values = Array.from(selectedValues);
    column.setFilterValue(values.length === uniqueValues.length ? undefined : values);
    setOpen(false);
  };

  // 초기화 (필터 제거)
  const handleReset = () => {
    setSelectedValues(new Set(uniqueValues));
    column.setFilterValue(undefined);
    setOpen(false);
  };

  // Popover 열릴 때 현재 필터 값으로 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedValues(new Set(filterValue.length > 0 ? filterValue : uniqueValues));
    }
    setOpen(isOpen);
  };

  const isFiltered = filterValue.length > 0 && filterValue.length < uniqueValues.length;
  const filteredCount = filterValue.length;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 hover:bg-gray-100 relative"
        >
          <Filter
            className={`h-3 w-3 ${isFiltered ? "text-blue-600" : "text-gray-400"}`}
          />
          {isFiltered && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center">
              {filteredCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="px-3 py-2 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{title || "필터"}</span>
              <span className="text-xs text-gray-500">
                {selectedValues.size === uniqueValues.length
                  ? "전체"
                  : `${selectedValues.size}개 선택`}
              </span>
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
              {uniqueValues.map((value) => {
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
                      {value === "__EMPTY__" ? "값 없음" : formatValue(value)}
                    </span>
                    {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

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
  );
}
