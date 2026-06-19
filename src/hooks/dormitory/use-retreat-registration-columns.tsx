import { useMemo, useState } from "react";
import { ColumnDef, createColumnHelper, FilterFn } from "@tanstack/react-table";
import { KeyedMutator } from "swr";
import { AxiosError } from "axios";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { TRetreatRegistrationSchedule, Gender } from "@/types";
import { GenderBadge } from "@/components/Badge";
import { createRetreatScheduleColumns } from "@/hooks/retreat/use-retreat-schedule-columns";
import { UnifiedColumnHeader } from "@/components/common/table/UnifiedColumnHeader";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { webAxios } from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { IDormitoryRetreatRegistration } from "./use-retreat-registration";
import { gradeDescSortingFn, gradeFilterSort } from "@/utils/sorting";

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
  isLeader: boolean;
  attendanceConfirmedAt: string | null;
  attendanceConfirmedAdminUserName: string | null;
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

function RetreatAttendanceButton({
  row,
  retreatSlug,
  mutate,
}: {
  row: DormitoryRetreatRegistrationTableData;
  retreatSlug: string;
  mutate: KeyedMutator<IDormitoryRetreatRegistration[]>;
}) {
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirm();
  const [isPending, setIsPending] = useState(false);
  const [isHoveringConfirmedButton, setIsHoveringConfirmedButton] =
    useState(false);

  const isConfirmed = !!row.attendanceConfirmedAt;
  const registrationId = Number(row.id);
  const endpoint = `/api/v1/retreat/${retreatSlug}/dormitory/${row.id}`;

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      return error.response?.data?.message || fallback;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  const updateAttendanceCache = async ({
    attendanceConfirmedAt,
    attendanceConfirmedAdminUserName,
  }: {
    attendanceConfirmedAt: string | null;
    attendanceConfirmedAdminUserName?: string | null;
  }) => {
    await mutate(
      current =>
        current?.map(registration =>
          registration.id === registrationId
            ? {
                ...registration,
                attendanceConfirmedAt,
                attendanceConfirmedAdminUserName:
                  attendanceConfirmedAdminUserName ?? null,
              }
            : registration
        ),
      { revalidate: false }
    );

    void mutate();
  };

  const performConfirmAttendance = async () => {
    setIsPending(true);
    try {
      const response = await webAxios.post(`${endpoint}/confirm-attendance`);
      await updateAttendanceCache({
        attendanceConfirmedAt:
          response.data.confirmedRegistration?.attendanceConfirmedAt ??
          new Date().toISOString(),
        attendanceConfirmedAdminUserName:
          response.data.confirmedRegistration?.attendanceConfirmedAdminUserName,
      });
      addToast({
        title: "성공",
        description: "출석 체크가 완료되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류 발생",
        description: getErrorMessage(error, "출석 체크 중 오류가 발생했습니다."),
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const performRevertAttendance = async () => {
    setIsPending(true);
    try {
      await webAxios.post(`${endpoint}/revert-attendance`);
      await updateAttendanceCache({
        attendanceConfirmedAt: null,
        attendanceConfirmedAdminUserName: null,
      });
      addToast({
        title: "성공",
        description: "출석 체크가 취소되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류 발생",
        description: getErrorMessage(error, "출석 체크 취소 중 오류가 발생했습니다."),
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmAttendance = () => {
    void confirmDialog.open({
      title: "출석 체크",
      description: `${row.department} ${row.grade} ${row.name} — 출석 체크하시겠습니까?`,
      onConfirm: performConfirmAttendance,
    });
  };

  const handleRevertAttendance = () => {
    void confirmDialog.open({
      title: "출석 체크 취소",
      description: `${row.department} ${row.grade} ${row.name} — 출석 체크를 취소할까요?`,
      confirmVariant: "destructive",
      onConfirm: performRevertAttendance,
    });
  };

  return isConfirmed ? (
    <Button
      size="sm"
      variant="secondary"
      onClick={(event) => {
        event.stopPropagation();
        handleRevertAttendance();
      }}
      onMouseEnter={() => setIsHoveringConfirmedButton(true)}
      onMouseLeave={() => setIsHoveringConfirmedButton(false)}
      onFocus={() => setIsHoveringConfirmedButton(true)}
      onBlur={() => setIsHoveringConfirmedButton(false)}
      disabled={isPending}
      title="출석 완료 (클릭 시 취소)"
      className={cn(
        "h-7 w-full gap-1.5 px-3 text-xs whitespace-nowrap",
        "border border-emerald-500 bg-emerald-50 text-emerald-700",
        "hover:border-red-500 hover:bg-red-50 hover:text-red-700"
      )}
    >
      {isPending ? (
        <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isHoveringConfirmedButton ? (
        <RotateCcw className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>{isHoveringConfirmedButton ? "취소" : "출석 완료"}</span>
    </Button>
  ) : (
    <Button
      size="sm"
      variant="outline"
      onClick={(event) => {
        event.stopPropagation();
        handleConfirmAttendance();
      }}
      disabled={isPending}
      title="출석 체크"
      className="h-7 w-full gap-1.5 px-3 text-xs whitespace-nowrap hover:bg-black hover:text-white"
    >
      {isPending ? (
        <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>출석 체크</span>
    </Button>
  );
}

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
  const columns = useMemo(() => {
    // 1. 왼쪽 정적 컬럼
    const leftColumns: ColumnDef<DormitoryRetreatRegistrationTableData, any>[] = [
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
            enableSorting
            enableFiltering
            sortFilterValues={gradeFilterSort}
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        sortingFn: gradeDescSortingFn,
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

      columnHelper.accessor("attendanceConfirmedAt", {
        id: "attendance",
        header: () => (
          <div className="text-center text-sm whitespace-normal">
            출석 체크
          </div>
        ),
        cell: (props) => {
          const row = props.row.original;
          return (
            <RetreatAttendanceButton
              row={row}
              retreatSlug={retreatSlug}
              mutate={mutate}
            />
          );
        },
        size: 120,
        enableSorting: false,
        enableColumnFilter: false,
      }),
    ];

    return [...leftColumns, ...scheduleColumns, ...rightColumns];
  }, [schedules, retreatSlug, mutate]);

  return columns;
}
