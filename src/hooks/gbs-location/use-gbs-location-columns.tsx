"use client";

import { useMemo } from "react";
import { ColumnDef, createColumnHelper, FilterFn } from "@tanstack/react-table";
import { UnifiedColumnHeader } from "@/components/common/table/UnifiedColumnHeader";
import { LocationCombobox } from "@/components/features/gbs-location/LocationCombobox";
import { GbsLocationTableData } from "@/types/gbs-location";

/**
 * 배열 기반 필터 함수 (다중 선택 필터용)
 */
export const arrayIncludesFilterFn: FilterFn<GbsLocationTableData> = (
  row,
  columnId,
  filterValue: (string | number)[]
) => {
  if (!filterValue || filterValue.length === 0) return true;
  const value = row.getValue(columnId);

  if (filterValue.includes("__EMPTY__")) {
    if (value === null || value === undefined || value === "") {
      return true;
    }
  }

  return filterValue.includes(value as string | number);
};

const columnHelper = createColumnHelper<GbsLocationTableData>();

interface UseGbsLocationColumnsParams {
  availableLocations: string[];
  assignLocation: (gbsId: number, location: string) => Promise<void>;
  isMutating: boolean;
}

/**
 * GBS 장소 배정 테이블 컬럼 Hook
 *
 * @param params - 컬럼 설정 파라미터
 */
export function useGbsLocationColumns({
  availableLocations,
  assignLocation,
  isMutating,
}: UseGbsLocationColumnsParams): ColumnDef<GbsLocationTableData, any>[] {
  const columns = useMemo(() => {
    return [
      // Column 1: GBS 번호
      columnHelper.accessor("number", {
        id: "number",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="GBS 번호"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 font-medium">
            {info.getValue()}
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 120,
      }),

      // Column 2: 메모
      columnHelper.accessor("memo", {
        id: "memo",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="메모"
            enableSorting
            enableFiltering
            formatFilterValue={(value) =>
              value === "__EMPTY__" ? "(빈 값)" : value
            }
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 text-gray-600">
            {info.getValue() || "-"}
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 200,
      }),

      // Column 3: 장소 (LocationCombobox)
      columnHelper.accessor("location", {
        id: "location",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="장소"
            enableSorting
            enableFiltering
            formatFilterValue={(value) =>
              value === "__EMPTY__" ? "(미배정)" : value
            }
          />
        ),
        cell: (props) => {
          const row = props.row.original;
          return (
            <div className="px-2 py-1">
              <LocationCombobox
                gbsId={row.id}
                value={row.location}
                availableLocations={availableLocations}
                currentLocation={row.location}
                isMutating={isMutating}
                onAssign={assignLocation}
              />
            </div>
          );
        },
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 300,
      }),
    ];
  }, [availableLocations, assignLocation, isMutating]);

  return columns;
}
