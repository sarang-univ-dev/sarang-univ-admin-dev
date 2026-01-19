"use client";

import { useState, useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { Filter, Check, ChevronDown, ChevronRight } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FilterColumnConfig {
  id: string;
  title: string;
  formatValue?: (value: any) => string;
  sortValues?: (a: any, b: any) => number;
}

interface MobileAllFiltersDrawerProps<TData> {
  table: Table<TData>;
  filterColumns: FilterColumnConfig[];
}

/**
 * 모바일 전체 필터 Drawer 컴포넌트
 *
 * @description
 * - 숨겨진 컬럼 포함 전체 필터 접근
 * - Collapsible Accordion으로 각 컬럼 필터 표시
 * - 활성 필터 개수 배지 표시
 */
export function MobileAllFiltersDrawer<TData>({
  table,
  filterColumns,
}: MobileAllFiltersDrawerProps<TData>) {
  const [open, setOpen] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(
    new Set()
  );

  // 각 컬럼별 선택된 값 상태
  const [selectedValuesByColumn, setSelectedValuesByColumn] = useState<
    Record<string, Set<any>>
  >({});

  // 활성 필터 개수 계산
  const activeFilterCount = useMemo(() => {
    let count = 0;
    filterColumns.forEach((config) => {
      const column = table.getColumn(config.id);
      if (column) {
        const filterValue = column.getFilterValue() as any[] | undefined;
        if (filterValue && filterValue.length > 0) {
          count++;
        }
      }
    });
    return count;
  }, [table, filterColumns]);

  // 각 컬럼의 고유 값 목록
  const uniqueValuesByColumn = useMemo(() => {
    const result: Record<string, any[]> = {};

    filterColumns.forEach((config) => {
      const column = table.getColumn(config.id);
      if (!column) return;

      const valuesSet = new Set<any>();
      let hasEmptyValue = false;

      table.getPreFilteredRowModel().rows.forEach((row) => {
        const value = row.getValue(config.id);

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
        if (config.sortValues) {
          return config.sortValues(a, b);
        }
        if (typeof a === "number" && typeof b === "number") {
          return a - b;
        }
        return String(a).localeCompare(String(b));
      });

      result[config.id] = hasEmptyValue ? ["__EMPTY__", ...values] : values;
    });

    return result;
  }, [table, filterColumns]);

  // Drawer 열릴 때 현재 필터 값으로 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const initialState: Record<string, Set<any>> = {};
      filterColumns.forEach((config) => {
        const column = table.getColumn(config.id);
        if (column) {
          const filterValue = column.getFilterValue() as any[] | undefined;
          const uniqueValues = uniqueValuesByColumn[config.id] || [];
          initialState[config.id] = new Set(
            filterValue && filterValue.length > 0 ? filterValue : uniqueValues
          );
        }
      });
      setSelectedValuesByColumn(initialState);
      setExpandedColumns(new Set());
    }
    setOpen(isOpen);
  };

  // 토글 확장/축소
  const toggleExpanded = (columnId: string) => {
    const newSet = new Set(expandedColumns);
    if (newSet.has(columnId)) {
      newSet.delete(columnId);
    } else {
      newSet.add(columnId);
    }
    setExpandedColumns(newSet);
  };

  // 값 토글
  const handleToggleValue = (columnId: string, value: any) => {
    setSelectedValuesByColumn((prev) => {
      const newSet = new Set(prev[columnId] || []);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [columnId]: newSet };
    });
  };

  // 전체 선택
  const handleSelectAll = (columnId: string) => {
    const uniqueValues = uniqueValuesByColumn[columnId] || [];
    setSelectedValuesByColumn((prev) => ({
      ...prev,
      [columnId]: new Set(uniqueValues),
    }));
  };

  // 전체 해제
  const handleClearAll = (columnId: string) => {
    setSelectedValuesByColumn((prev) => ({
      ...prev,
      [columnId]: new Set(),
    }));
  };

  // 적용
  const handleApply = () => {
    filterColumns.forEach((config) => {
      const column = table.getColumn(config.id);
      if (!column) return;

      const selectedValues = selectedValuesByColumn[config.id];
      const uniqueValues = uniqueValuesByColumn[config.id] || [];

      if (!selectedValues || selectedValues.size === uniqueValues.length) {
        column.setFilterValue(undefined);
      } else {
        column.setFilterValue(Array.from(selectedValues));
      }
    });
    setOpen(false);
  };

  // 전체 초기화
  const handleResetAll = () => {
    filterColumns.forEach((config) => {
      const column = table.getColumn(config.id);
      if (column) {
        column.setFilterValue(undefined);
      }
    });

    const resetState: Record<string, Set<any>> = {};
    filterColumns.forEach((config) => {
      resetState[config.id] = new Set(uniqueValuesByColumn[config.id] || []);
    });
    setSelectedValuesByColumn(resetState);
    setOpen(false);
  };

  // 각 컬럼의 선택된 개수
  const getSelectedCount = (columnId: string): number => {
    const selected = selectedValuesByColumn[columnId];
    return selected ? selected.size : 0;
  };

  // 각 컬럼의 총 개수
  const getTotalCount = (columnId: string): number => {
    return (uniqueValuesByColumn[columnId] || []).length;
  };

  // 컬럼에 활성 필터가 있는지
  const hasActiveFilter = (columnId: string): boolean => {
    const column = table.getColumn(columnId);
    if (!column) return false;
    const filterValue = column.getFilterValue() as any[] | undefined;
    return !!filterValue && filterValue.length > 0;
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1 relative"
        >
          <Filter className="h-4 w-4" />
          <span>필터</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-[11px] text-white font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            전체 필터
            {activeFilterCount > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({activeFilterCount}개 활성)
              </span>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 max-h-[50vh]">
          <div className="space-y-2 pb-4">
            {filterColumns.map((config) => {
              const column = table.getColumn(config.id);
              if (!column) return null;

              const uniqueValues = uniqueValuesByColumn[config.id] || [];
              const selectedValues = selectedValuesByColumn[config.id] || new Set();
              const isExpanded = expandedColumns.has(config.id);
              const formatValue = config.formatValue || ((v: any) => String(v));
              const isActive = hasActiveFilter(config.id);
              const selectedCount = getSelectedCount(config.id);
              const totalCount = getTotalCount(config.id);

              return (
                <Collapsible
                  key={config.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(config.id)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border transition-colors min-h-[48px] ${
                        isActive
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span
                          className={`font-medium ${
                            isActive ? "text-blue-700" : "text-gray-700"
                          }`}
                        >
                          {config.title}
                        </span>
                      </div>
                      <span
                        className={`text-sm ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {selectedCount === totalCount
                          ? "전체"
                          : `${selectedCount}/${totalCount}`}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-2 pb-1 space-y-2">
                      {/* 전체 선택/해제 버튼 */}
                      <div className="flex gap-2 px-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAll(config.id)}
                          className="flex-1 h-8 text-xs"
                        >
                          전체 선택
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearAll(config.id)}
                          className="flex-1 h-8 text-xs"
                        >
                          전체 해제
                        </Button>
                      </div>

                      {/* 값 목록 */}
                      <div className="space-y-1 max-h-[180px] overflow-y-auto px-1">
                        {uniqueValues.map((value) => {
                          const isSelected = selectedValues.has(value);
                          const displayValue =
                            value === "__EMPTY__"
                              ? "값 없음"
                              : formatValue(value);
                          return (
                            <div
                              key={String(value)}
                              className="flex items-center space-x-3 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer min-h-[44px]"
                              onClick={() =>
                                handleToggleValue(config.id, value)
                              }
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleToggleValue(config.id, value)
                                }
                              />
                              <span className="text-sm flex-1">
                                {displayValue}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <DrawerFooter className="flex-row gap-2 border-t">
          <Button
            variant="outline"
            onClick={handleResetAll}
            className="flex-1"
          >
            전체 초기화
          </Button>
          <Button onClick={handleApply} className="flex-1">
            적용
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
