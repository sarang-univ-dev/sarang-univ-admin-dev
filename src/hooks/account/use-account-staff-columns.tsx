import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { IRetreatRegistration } from "@/types/account";
import { TRetreatRegistrationSchedule } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Info } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { createRetreatScheduleColumns } from "@/hooks/retreat/use-retreat-schedule-columns";
import { useAccountStaffRegistration } from "./use-account-staff-registration";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { AccountStaffRegistrationTableActions } from "@/components/features/account/AccountStaffRegistrationTableActions";
import { TableCell } from "@/components/ui/table";

// 테이블 데이터 타입 정의
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
        header: ({ column }) => (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              size="sm"
              className="h-auto p-1"
            >
              부서
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: (info) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </TableCell>
        ),
        enableHiding: false,
        size: 80,
      }),

      columnHelper.accessor("gender", {
        id: "gender",
        header: () => <div className="text-center text-sm">성별</div>,
        cell: (info) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            <GenderBadge gender={info.getValue() as any} />
          </TableCell>
        ),
        size: 70,
      }),

      columnHelper.accessor("grade", {
        id: "grade",
        header: () => <div className="text-center text-sm">학년</div>,
        cell: (info) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </TableCell>
        ),
        size: 70,
      }),

      columnHelper.accessor("name", {
        id: "name",
        header: ({ column }) => (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              size="sm"
              className="h-auto p-1"
            >
              이름
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: (info) => (
          <TableCell className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </TableCell>
        ),
        enableHiding: false,
        size: 100,
      }),

      columnHelper.accessor("phoneNumber", {
        id: "phoneNumber",
        header: () => <div className="text-center text-sm">전화번호</div>,
        cell: (info) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue() || "-"}
          </TableCell>
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
        header: () => <div className="text-center text-sm">타입</div>,
        cell: (info) => {
          const type = info.getValue();
          return (
            <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
              {type ? <TypeBadge type={type as any} /> : "-"}
            </TableCell>
          );
        },
        filterFn: "equals",
        size: 100,
      }),

      columnHelper.accessor("amount", {
        id: "amount",
        header: () => <div className="text-center text-sm">금액</div>,
        cell: (info) => (
          <TableCell className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()?.toLocaleString()}원
          </TableCell>
        ),
        size: 100,
      }),

      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: () => <div className="text-center text-sm">신청 시각</div>,
        cell: (info) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0 text-gray-600">
            {formatDate(info.getValue())}
          </TableCell>
        ),
        size: 140,
      }),

      columnHelper.accessor("status", {
        id: "status",
        header: () => <div className="text-center text-sm">입금 현황</div>,
        cell: (info) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            <StatusBadge status={info.getValue() as any} />
          </TableCell>
        ),
        filterFn: "equals",
        size: 120,
      }),

      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center text-sm">상세</div>,
        cell: (props) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRowClick?.(props.row.original)}
              className="h-7 text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              보기
            </Button>
          </TableCell>
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
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue() || "-"}
          </TableCell>
        ),
        size: 100,
      }),

      columnHelper.accessor("paymentConfirmedAt", {
        id: "paymentConfirmedAt",
        header: () => <div className="text-center text-sm">처리 시각</div>,
        cell: (info) => (
          <TableCell className="text-center px-2 py-1 whitespace-nowrap shrink-0 text-gray-600">
            {formatDate(info.getValue())}
          </TableCell>
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
              loading={isMutating}
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
