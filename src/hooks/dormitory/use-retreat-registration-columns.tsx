import { useMemo } from "react";
import { ColumnDef, createColumnHelper, FilterFn } from "@tanstack/react-table";
import { KeyedMutator } from "swr";
import { TRetreatRegistrationSchedule, Gender } from "@/types";
import { GenderBadge } from "@/components/Badge";
import { createRetreatScheduleColumns } from "@/hooks/retreat/use-retreat-schedule-columns";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { UnifiedColumnHeader } from "@/components/common/table/UnifiedColumnHeader";
import {
  useDormitoryRetreatRegistrationMemo,
} from "./use-retreat-registration-memo";
import { IDormitoryRetreatRegistration } from "./use-retreat-registration";

/**
 * 숙소팀 수양회 신청 테이블 데이터 타입
 */
export interface DormitoryRetreatRegistrationTableData {
  id: string;
  gbsNumber: number | null;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  schedules: Record<string, boolean>;
  dormitoryName: string;
  scheduleChangeRequestMemo: string | null;
  isLeader: boolean;
}

/**
 * 배열 기반 필터 함수 (다중 선택 필터용)
 */
export const arrayIncludesFilterFn: FilterFn<DormitoryRetreatRegistrationTableData> = (
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

const columnHelper = createColumnHelper<DormitoryRetreatRegistrationTableData>();

/**
 * 숙소팀 수양회 신청 테이블 컬럼 훅
 *
 * @description
 * - 정적 컬럼 + 동적 스케줄 컬럼 생성
 * - useMemo로 메모이제이션하여 불필요한 재생성 방지
 * - MemoEditor 컴포넌트를 사용한 일정변동 요청 메모 관리
 *
 * @param schedules - 수양회 스케줄 목록 (동적 컬럼 생성에 사용)
 * @param retreatSlug - 수양회 슬러그 (액션에 필요)
 * @param mutate - SWR mutate 함수 (캐시 갱신에 필요)
 * @returns TanStack Table columns
 */
export function useDormitoryRetreatRegistrationColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  mutate: KeyedMutator<IDormitoryRetreatRegistration[]>
) {
  // 메모 관련 액션 가져오기
  const { saveMemo, updateMemo, deleteMemo } =
    useDormitoryRetreatRegistrationMemo(retreatSlug, mutate);

  const columns = useMemo(() => {
    // 1. 왼쪽 정적 컬럼
    const leftColumns: ColumnDef<DormitoryRetreatRegistrationTableData, any>[] = [
      columnHelper.accessor("gbsNumber", {
        id: "gbsNumber",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="GBS번호"
            enableSorting
            enableFiltering
            formatFilterValue={(value) =>
              value === null || value === undefined ? "미배정" : String(value)
            }
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue() != null ? info.getValue() : "-"}
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 80,
      }),

      columnHelper.accessor("department", {
        id: "department",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="부서"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        enableHiding: false,
        size: 70,
      }),

      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="성별"
            enableFiltering
            formatFilterValue={(value) =>
              value === "MALE" ? "남자" : value === "FEMALE" ? "여자" : value
            }
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 70,
      }),

      columnHelper.accessor("grade", {
        id: "grade",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="학년"
            enableFiltering
            sortFilterValues={(a, b) => {
              const numA = parseInt(String(a), 10);
              const numB = parseInt(String(b), 10);
              return numA - numB;
            }}
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 70,
      }),

      columnHelper.accessor("name", {
        id: "name",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div
              className={`text-center px-2 py-1 whitespace-nowrap shrink-0 ${
                row.isLeader ? "font-bold text-cyan-700" : "font-medium"
              }`}
            >
              {info.getValue()}
            </div>
          );
        },
        enableHiding: false,
        size: 100,
      }),
    ];

    // 2. 동적 스케줄 컬럼 (날짜별 색상 적용)
    const scheduleColumns = createRetreatScheduleColumns(
      schedules,
      columnHelper
    );

    // 3. 오른쪽 정적 컬럼
    const rightColumns: ColumnDef<DormitoryRetreatRegistrationTableData, any>[] = [
      columnHelper.accessor("dormitoryName", {
        id: "dormitoryName",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="숙소"
            enableFiltering
            formatFilterValue={(value) =>
              value === "" || value === null ? "미배정" : value
            }
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue() || "-"}
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 120,
      }),

      columnHelper.display({
        id: "scheduleChangeRequestMemo",
        header: () => (
          <div className="text-center text-sm whitespace-normal">
            일정변동
            <br />
            요청 메모
          </div>
        ),
        cell: (props) => {
          const row = props.row.original;
          return (
            <MemoEditor
              row={row}
              memoValue={row.scheduleChangeRequestMemo}
              onSave={async (id, memo) => {
                await saveMemo(id, memo);
              }}
              onUpdate={async (id, memo) => {
                await updateMemo(id, memo);
              }}
              onDelete={async (id) => {
                await deleteMemo(id);
              }}
              hasExistingMemo={(r) => !!r.scheduleChangeRequestMemo}
              placeholder="일정변동 요청 메모를 입력하세요... ex) 전참 → 금숙 ~ 토점"
            />
          );
        },
        size: 250,
      }),
    ];

    return [...leftColumns, ...scheduleColumns, ...rightColumns];
  }, [schedules, saveMemo, updateMemo, deleteMemo]);

  return columns;
}
