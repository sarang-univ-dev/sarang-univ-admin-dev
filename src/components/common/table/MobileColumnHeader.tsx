"use client";

import { useState, useMemo } from "react";
import { Column, Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ColumnHeaderHelp } from "@/components/common/help";
import type { ColumnHelpContent } from "@/lib/help/types";

interface MobileColumnHeaderProps<TData> {
  column: Column<TData, unknown>;
  table: Table<TData>;
  title: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  /**
   * 필터 값을 표시할 포맷 함수
   * @example (value) => value === 'MALE' ? '남' : '여'
   */
  formatFilterValue?: (value: any) => string;
  /**
   * 필터 값을 정렬할 함수
   */
  sortFilterValues?: (a: any, b: any) => number;
  /**
   * 컬럼 도움말 콘텐츠
   */
  helpContent?: ColumnHelpContent;
}

/**
 * 모바일 최적화 컬럼 헤더 컴포넌트
 *
 * @description
 * - 터치 친화적 (44px 터치 영역)
 * - Drawer로 정렬/필터 옵션 표시
 * - 활성 필터/정렬 표시 (아이콘 색상 변경)
 */
export function MobileColumnHeader<TData>({
  column,
  table,
  title,
  enableSorting = false,
  enableFiltering = false,
  formatFilterValue = (value) => String(value),
  sortFilterValues,
  helpContent,
}: MobileColumnHeaderProps<TData>) {
  const [open, setOpen] = useState(false);

  // 정렬 상태
  const sortingState = column.getIsSorted();
  const isSorted = !!sortingState;

  // 필터 상태
  const filterValue = (column.getFilterValue() as any[]) || [];
  const isFiltered = filterValue.length > 0;

  // 활성 상태 여부
  const isActive = isSorted || isFiltered;

  // 해당 컬럼의 고유 값 목록 추출
  const uniqueValues = useMemo(() => {
    const valuesSet = new Set<any>();
    let hasEmptyValue = false;

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
        valuesSet.add(value);
      }
    });

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
      return ["__EMPTY__", ...values];
    }

    return values;
  }, [table, column.id, sortFilterValues]);

  // 체크박스 상태 관리
  const [selectedValues, setSelectedValues] = useState<Set<any>>(
    new Set(filterValue.length > 0 ? filterValue : uniqueValues)
  );

  // Drawer 열릴 때 현재 필터 값으로 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedValues(
        new Set(filterValue.length > 0 ? filterValue : uniqueValues)
      );
    }
    setOpen(isOpen);
  };

  // 정렬 핸들러
  const handleSortAsc = () => {
    column.toggleSorting(false, true);
  };

  const handleSortDesc = () => {
    column.toggleSorting(true, true);
  };

  const handleClearSort = () => {
    column.clearSorting();
  };

  // 필터 핸들러
  const handleSelectAll = () => {
    setSelectedValues(new Set(uniqueValues));
  };

  const handleClearAll = () => {
    setSelectedValues(new Set());
  };

  const handleToggle = (value: any) => {
    const newSet = new Set(selectedValues);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedValues(newSet);
  };

  const handleApply = () => {
    const values = Array.from(selectedValues);
    column.setFilterValue(
      values.length === uniqueValues.length ? undefined : values
    );
    setOpen(false);
  };

  const handleReset = () => {
    column.clearSorting();
    setSelectedValues(new Set(uniqueValues));
    column.setFilterValue(undefined);
    setOpen(false);
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    if (enableSorting && enableFiltering) {
      // 둘 다 활성화된 경우 통합 아이콘
      if (sortingState === "asc") {
        return <ArrowUp className="h-3 w-3" />;
      } else if (sortingState === "desc") {
        return <ArrowDown className="h-3 w-3" />;
      } else if (isFiltered) {
        return <Filter className="h-3 w-3" />;
      }
      return <ArrowUpDown className="h-3 w-3" />;
    } else if (enableSorting) {
      if (sortingState === "asc") {
        return <ArrowUp className="h-3 w-3" />;
      } else if (sortingState === "desc") {
        return <ArrowDown className="h-3 w-3" />;
      }
      return <ArrowUpDown className="h-3 w-3" />;
    } else if (enableFiltering) {
      return <Filter className="h-3 w-3" />;
    }
    return null;
  };

  // 기능이 없으면 일반 텍스트 반환
  if (!enableSorting && !enableFiltering) {
    return (
      <div className="flex items-center justify-center gap-1 font-semibold text-xs whitespace-nowrap">
        <span>{title}</span>
        {helpContent && <ColumnHeaderHelp helpContent={helpContent} />}
      </div>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <button
          className={`flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-1 py-2 text-xs font-semibold whitespace-nowrap rounded-md transition-colors active:bg-gray-100 ${
            isActive ? "text-blue-600" : "text-gray-700"
          }`}
        >
          {title}
          <span className={isActive ? "text-blue-600" : "text-gray-400"}>
            {renderIcon()}
          </span>
          {isFiltered && (
            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-[10px] text-white">
              {filterValue.length}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* 정렬 섹션 */}
          {enableSorting && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">정렬</h4>
              <div className="flex gap-2">
                <Button
                  variant={sortingState === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={handleSortAsc}
                  className="flex-1"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  오름차순
                </Button>
                <Button
                  variant={sortingState === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={handleSortDesc}
                  className="flex-1"
                >
                  <ArrowDown className="h-4 w-4 mr-1" />
                  내림차순
                </Button>
              </div>
              {isSorted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSort}
                  className="w-full text-gray-500"
                >
                  정렬 해제
                </Button>
              )}
            </div>
          )}

          {/* 필터 섹션 */}
          {enableFiltering && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">필터</h4>

              {/* 전체 선택/해제 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex-1 text-xs"
                >
                  전체 선택
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex-1 text-xs"
                >
                  전체 해제
                </Button>
              </div>

              {/* 값 목록 */}
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-2 space-y-1">
                  {uniqueValues.map((value) => {
                    const isSelected = selectedValues.has(value);
                    const displayValue =
                      value === "__EMPTY__" ? "값 없음" : formatFilterValue(value);
                    return (
                      <div
                        key={String(value)}
                        className="flex items-center space-x-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer min-h-[44px]"
                        onClick={() => handleToggle(value)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(value)}
                        />
                        <span className="text-sm flex-1">{displayValue}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <p className="text-xs text-gray-500 text-center">
                {selectedValues.size === uniqueValues.length
                  ? "전체"
                  : `${selectedValues.size}개 선택`}
              </p>
            </div>
          )}
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            초기화
          </Button>
          <Button onClick={handleApply} className="flex-1">
            적용
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
