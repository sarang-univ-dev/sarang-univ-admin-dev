import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { UnivGroupRetreatRegistrationTableActions } from "@/components/features/univ-group-retreat-registration/UnivGroupRetreatRegistrationTableActions";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { ShuttleBusStatusBadge } from "@/components/features/univ-group-retreat-registration/ShuttleBusStatusBadge";
import { formatDate } from "@/utils/formatDate";
import { createRetreatScheduleColumns } from "@/hooks/retreat/use-retreat-schedule-columns";
import { useUnivGroupRetreatRegistration } from "./use-univ-group-retreat-registration";
import { ColumnHeader } from "@/components/common/table/ColumnHeader";
import {
  USER_RETREAT_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constant/labels";

const columnHelper = createColumnHelper<UnivGroupAdminStaffData>();

/**
 * 부서 수양회 신청 테이블 컬럼 훅
 *
 * @description
 * - 정적 컬럼 + 동적 스케줄 컬럼 생성
 * - useMemo로 메모이제이션하여 불필요한 재생성 방지
 * - 타입 안전성 보장
 *
 * @param schedules - 수양회 스케줄 목록 (동적 컬럼 생성에 사용)
 * @param retreatSlug - 수양회 슬러그 (액션에 필요)
 * @param onRowClick - 행 클릭 시 실행할 콜백 함수 (상세 정보 사이드바 열기)
 * @returns TanStack Table columns
 */
export function useUnivGroupRetreatRegistrationColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  onRowClick?: (row: UnivGroupAdminStaffData) => void
) {
  // 통합 훅에서 메모 관련 액션 가져오기
  const {
    saveAdminMemo,
    updateAdminMemo,
    deleteAdminMemo,
    isMutating,
  } = useUnivGroupRetreatRegistration(retreatSlug);

  const columns = useMemo(() => {
    // 1. 왼쪽 정적 컬럼
    const leftColumns = [
      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="성별"
            enableFiltering
            formatFilterValue={(value) => value === "MALE" ? "남자" : "여자"}
          />
        ),
        cell: info => (
          <div className="flex justify-center shrink-0 px-1">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),

      columnHelper.accessor("grade", {
        id: "grade",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="학년"
            enableFiltering
          />
        ),
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">{info.getValue()}</div>
        ),
        filterFn: "arrIncludesSome",
      }),

      columnHelper.accessor("name", {
        id: "name",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
          />
        ),
        cell: info => (
          <div className="font-medium text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
      }),

      columnHelper.accessor("phone", {
        id: "phone",
        header: () => <div className="text-center text-sm whitespace-nowrap">전화번호</div>,
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">{info.getValue() || "-"}</div>
        ),
      }),

      columnHelper.accessor("currentLeaderName", {
        id: "currentLeaderName",
        header: () => <div className="text-center text-sm whitespace-nowrap">부서 리더명</div>,
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">{info.getValue() || "-"}</div>
        ),
      }),
    ];

    // 2. 동적 스케줄 컬럼 (날짜별 색상 적용)
    // ✅ 공통 훅 사용으로 코드 간소화 및 재사용성 향상
    const scheduleColumns = createRetreatScheduleColumns(schedules, columnHelper);

    // 3. 오른쪽 정적 컬럼
    const rightColumns = [
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="입금 현황"
            enableFiltering
            formatFilterValue={(value) =>
              PAYMENT_STATUS_LABELS[value as keyof typeof PAYMENT_STATUS_LABELS] || value
            }
          />
        ),
        cell: props => (
          <div className="flex flex-col items-center gap-1 shrink-0 px-1">
            <StatusBadge status={props.getValue()} />
            <UnivGroupRetreatRegistrationTableActions
              row={props.row.original}
              retreatSlug={retreatSlug}
            />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),

      columnHelper.accessor("hadRegisteredShuttleBus", {
        id: "shuttleBus",
        header: () => (
          <div className="text-center text-sm whitespace-nowrap">
            셔틀버스 신청 여부
          </div>
        ),
        cell: info => (
          <div className="flex justify-center shrink-0 px-1">
            <ShuttleBusStatusBadge hasRegistered={info.getValue()} />
          </div>
        ),
      }),

      columnHelper.display({
        id: "adminMemo",
        header: () => (
          <div className="text-center text-sm whitespace-nowrap">
            행정간사 메모
          </div>
        ),
        cell: props => {
          const row = props.row.original;
          return (
            <div className="shrink-0">
              <MemoEditor
                row={row}
                memoValue={row.staffMemo}
                onSave={async (id, memo) => {
                  await saveAdminMemo(id, memo);
                }}
                onUpdate={async (id, memo) => {
                  if (row.adminMemoId) {
                    await updateAdminMemo(row.adminMemoId, memo);
                  }
                }}
                onDelete={async () => {
                  if (row.adminMemoId) {
                    await deleteAdminMemo(row.adminMemoId);
                  }
                }}
                loading={isMutating}
                hasExistingMemo={(r) => !!r.staffMemo && !!r.adminMemoId}
              />
            </div>
          );
        },
      }),

      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center text-sm whitespace-nowrap">상세</div>,
        cell: props => (
          <div className="flex justify-center shrink-0 px-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRowClick?.(props.row.original)}
              className="h-8 px-3 whitespace-nowrap"
            >
              <Info className="h-4 w-4 mr-1" />
              보기
            </Button>
          </div>
        ),
      }),
    ];

    return [...leftColumns, ...scheduleColumns, ...rightColumns];
  }, [
    schedules,
    retreatSlug,
    onRowClick,
    saveAdminMemo,
    updateAdminMemo,
    deleteAdminMemo,
    isMutating,
  ]);

  return columns;
}
