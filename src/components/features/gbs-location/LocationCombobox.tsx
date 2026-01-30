"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Edit3, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { LocationComboboxProps } from "@/types/gbs-location";

/**
 * GBS 장소 선택 Combobox (단순화됨)
 *
 * Features:
 * - 검색 가능한 드롭다운 (Command + Popover)
 * - 직접 입력 가능 (Input)
 * - 편집/읽기 모드 토글
 * - Toast 알림은 상위 hook에서 처리
 */
export const LocationCombobox = React.memo(function LocationCombobox({
  gbsId,
  value,
  availableLocations,
  currentLocation,
  disabled = false,
  isMutating = false,
  onAssign,
}: LocationComboboxProps) {
  // 편집 모드 상태 (단순화: isEditing + selectedValue만 관리)
  const [editState, setEditState] = useState<{
    isEditing: boolean;
    selectedValue: string;
    isOpen: boolean;
  }>({
    isEditing: false,
    selectedValue: "",
    isOpen: false,
  });

  // 드롭다운 옵션 계산
  const locationOptions = useMemo(() => {
    const options = [...availableLocations];
    if (currentLocation && !options.includes(currentLocation)) {
      options.unshift(currentLocation);
    }
    return options;
  }, [availableLocations, currentLocation]);

  const handleStartEdit = () => {
    setEditState({
      isEditing: true,
      selectedValue: value || "",
      isOpen: false,
    });
  };

  const handleCancel = () => {
    setEditState({
      isEditing: false,
      selectedValue: "",
      isOpen: false,
    });
  };

  const handleSave = async () => {
    const trimmedValue = editState.selectedValue.trim();
    if (!trimmedValue) return;

    try {
      await onAssign(gbsId, trimmedValue);
      setEditState({
        isEditing: false,
        selectedValue: "",
        isOpen: false,
      });
    } catch {
      // 에러는 상위 hook에서 처리
    }
  };

  const handleSelect = (location: string) => {
    setEditState((prev) => ({
      ...prev,
      selectedValue: location,
      isOpen: false,
    }));
  };

  const handleInputChange = (newValue: string) => {
    setEditState((prev) => ({
      ...prev,
      selectedValue: newValue,
    }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    setEditState((prev) => ({
      ...prev,
      isOpen,
    }));
  };

  // 읽기 모드
  if (!editState.isEditing) {
    return (
      <div className="flex items-center justify-between min-w-[200px]">
        <span
          className={cn(
            "flex-1 text-sm",
            value ? "text-gray-700" : "text-gray-400"
          )}
        >
          {value || "장소 미배정"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStartEdit}
          disabled={disabled || isMutating}
          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // 편집 모드
  return (
    <div
      className="flex flex-col gap-2 min-w-[200px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Combobox */}
      <Popover open={editState.isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={editState.isOpen}
            className="w-full justify-between text-sm h-8"
            disabled={isMutating}
          >
            <span className="truncate">
              {editState.selectedValue || "장소 선택..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="장소 검색..." />
            <CommandList>
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              <CommandGroup>
                {locationOptions.map((location) => (
                  <CommandItem
                    key={location}
                    value={location}
                    onSelect={() => handleSelect(location)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        editState.selectedValue === location
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {location}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 직접 입력 */}
      <Input
        value={editState.selectedValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="또는 직접 입력..."
        disabled={isMutating}
        className="h-8 text-sm"
      />

      {/* 저장/취소 버튼 */}
      <div className="flex gap-1 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={isMutating || !editState.selectedValue.trim()}
          className="h-7 px-2"
        >
          {isMutating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isMutating}
          className="h-7 px-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});
