import { useMemo } from "react";
import { ColumnDef, createColumnHelper, FilterFn } from "@tanstack/react-table";
import { IRetreatRegistration } from "@/types/account";
import { TRetreatRegistrationSchedule } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { createRetreatScheduleColumns } from "@/hooks/retreat/use-retreat-schedule-columns";
import { useAccountStaffRegistration } from "./use-account-staff-registration";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { AccountStaffRegistrationTableActions } from "@/components/features/account/AccountStaffRegistrationTableActions";
import { UnifiedColumnHeader } from "@/components/common/table/UnifiedColumnHeader";

// 테이블 데이터 타입 정의 (filterFn보다 먼저 정의)
export interface AccountStaffTableData {
  id: number;
  department: string;
  gender: string;
  grade: string;
  name: string;
  phoneNumber: string;
  schedules: Record<string, boolean>;
  type: string | null;
  amount: number;
  createdAt: string;
  status: string;
  confirmedBy: string | null;
  paymentConfirmedAt: string | null;
  accountMemo: string | null;
  accountMemoId: number | null;
}

/**
 * 배열 기반 필터 함수 (다중 선택 필터용)
 * UnifiedColumnHeader에서 선택된 값들의 배열로 필터링
 *
 * TanStack Table Best Practice:
 * - filterFns 옵션에 등록하여 문자열로 참조 가능
 * - getFacetedUniqueValues()와 호환
 */
export const arrayIncludesFilterFn: FilterFn<AccountStaffTableData> = (
  row,
  columnId,
  filterValue: (string | number)[]
) => {
  if (!filterValue || filterValue.length === 0) return true;
  const value = row.getValue(columnId);
  // "__EMPTY__"는 빈 값을 나타냄
  if (filterValue.includes("__EMPTY__")) {
    if (value === null || value === undefined || value === "") {
      return true;
    }
  }
  return filterValue.includes(value as string | number);
};

const columnHelper = createColumnHelper<AccountStaffTableData>();

/**
 * 재정 간사 수양회 신청 테이블 컬럼 훅
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
export function useAccountStaffColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  onRowClick?: (row: AccountStaffTableData) => void
) {
  // 통합 훅에서 메모 관련 액션 가져오기
  const { saveAccountMemo, updateAccountMemo, deleteAccountMemo, isMutating } =
    useAccountStaffRegistration(retreatSlug);

  const columns = useMemo(() => {
    // 1. 왼쪽 정적 컬럼
    const leftColumns = [
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
        size: 80,
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
            <GenderBadge gender={info.getValue() as any} />
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
        cell: (info) => (
          <div className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
        size: 100,
      }),

      columnHelper.accessor("phoneNumber", {
        id: "phoneNumber",
        header: () => <div className="text-center text-sm">전화번호</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue() || "-"}
          </div>
        ),
        size: 120,
      }),
    ];

    // 2. 동적 스케줄 컬럼 (날짜별 색상 적용)
    const scheduleColumns = createRetreatScheduleColumns(
      schedules,
      columnHelper
    );

    // 3. 오른쪽 정적 컬럼
    const rightColumns = [
      columnHelper.accessor("type", {
        id: "type",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="타입"
            enableFiltering
            formatFilterValue={(value) => {
              const typeNames: Record<string, string> = {
                FULL: "전참",
                FIRST_NIGHT: "1박",
                SECOND_NIGHT: "2박",
                DAY: "당일",
              };
              return typeNames[value] || value;
            }}
          />
        ),
        cell: (info) => {
          const type = info.getValue();
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
              {type ? <TypeBadge type={type as any} /> : "-"}
            </div>
          );
        },
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 100,
      }),

      columnHelper.accessor("amount", {
        id: "amount",
        header: () => <div className="text-center text-sm">금액</div>,
        cell: (info) => (
          <div className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()?.toLocaleString()}원
          </div>
        ),
        size: 100,
      }),

      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: () => <div className="text-center text-sm">신청 시각</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0 text-gray-600">
            {formatDate(info.getValue())}
          </div>
        ),
        size: 140,
      }),

      columnHelper.accessor("status", {
        id: "status",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="입금 현황"
            enableFiltering
            formatFilterValue={(value) => {
              const statusNames: Record<string, string> = {
                PENDING: "입금 대기",
                PAYMENT_REQUESTED: "입금 요청",
                CONFIRMED: "입금 확인",
                REFUNDED: "환불 완료",
                CANCELLED: "취소",
              };
              return statusNames[value] || value;
            }}
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            <StatusBadge status={info.getValue() as any} />
          </div>
        ),
        filterFn: arrayIncludesFilterFn,
        enableColumnFilter: true,
        size: 120,
      }),

      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center text-sm">상세</div>,
        cell: (props) => (
          <div
            className="text-center px-2 py-1 whitespace-nowrap shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRowClick?.(props.row.original)}
              className="h-7 text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              보기
            </Button>
          </div>
        ),
        size: 80,
      }),

      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center text-sm">액션</div>,
        cell: (props) => (
          <AccountStaffRegistrationTableActions
            row={props.row.original}
            retreatSlug={retreatSlug}
          />
        ),
        size: 150,
      }),

      columnHelper.accessor("confirmedBy", {
        id: "confirmedBy",
        header: () => <div className="text-center text-sm">처리자명</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue() || "-"}
          </div>
        ),
        size: 100,
      }),

      columnHelper.accessor("paymentConfirmedAt", {
        id: "paymentConfirmedAt",
        header: () => <div className="text-center text-sm">처리 시각</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0 text-gray-600">
            {formatDate(info.getValue())}
          </div>
        ),
        size: 140,
      }),

      columnHelper.display({
        id: "accountMemo",
        header: () => (
          <div className="text-center text-sm whitespace-normal">
            회계
            <br />
            메모
          </div>
        ),
        cell: (props) => {
          const row = props.row.original;
          return (
            <MemoEditor
              row={row}
              memoValue={row.accountMemo}
              onSave={async (id, memo) => {
                await saveAccountMemo(String(id), memo);
              }}
              onUpdate={async (id, memo) => {
                if (row.accountMemoId) {
                  await updateAccountMemo(row.accountMemoId, memo);
                }
              }}
              onDelete={async () => {
                if (row.accountMemoId) {
                  await deleteAccountMemo(row.accountMemoId);
                }
              }}
              hasExistingMemo={(r: any) => !!r.accountMemo && !!r.accountMemoId}
            />
          );
        },
        size: 250,
      }),
    ];

    return [...leftColumns, ...scheduleColumns, ...rightColumns];
  }, [
    schedules,
    retreatSlug,
    onRowClick,
    saveAccountMemo,
    updateAccountMemo,
    deleteAccountMemo,
    isMutating,
  ]);

  return columns;
}
