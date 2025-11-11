"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { VirtualizedTable } from "@/components/common/table";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
  UserRetreatRegistrationType,
  Gender,
} from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { useRetreatPaymentConfirmation } from "@/hooks/retreat-payment-confirmation/use-retreat-payment-confirmation";
import { RetreatPaymentConfirmationTableToolbar } from "./RetreatPaymentConfirmationTableToolbar";
import { RetreatPaymentConfirmationTableActions } from "./RetreatPaymentConfirmationTableActions";
import { formatDate } from "@/utils/formatDate";
import { generateScheduleColumns } from "@/utils/retreat-utils";

interface RetreatPaymentConfirmationTableProps {
  initialData: IUserRetreatRegistration[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

// TanStack Table용 행 데이터 타입
type TableRow = {
  id: string;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  schedule: Record<string, boolean>;
  type: UserRetreatRegistrationType | null;
  amount: number;
  createdAt: string | null;
  status: UserRetreatRegistrationPaymentStatus;
  confirmedBy: string | null;
  paymentConfirmedAt: string | null;
  original: IUserRetreatRegistration;
};

const columnHelper = createColumnHelper<TableRow>();

/**
 * 부서 재정 팀원 - 입금 확인 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 정렬
 * - 통합 검색 (Lodash debounce)
 * - 입금 확인, 입금 요청, 환불 처리 액션
 * - SWR 실시간 동기화
 */
export function RetreatPaymentConfirmationTable({
  initialData,
  schedules,
  retreatSlug,
}: RetreatPaymentConfirmationTableProps) {
  // ✅ SWR로 실시간 데이터 동기화 + Mutation 함수들
  const {
    data: registrations,
    confirmPayment,
    sendPaymentRequest,
    refundComplete,
    isMutating,
  } = useRetreatPaymentConfirmation(retreatSlug, {
    fallbackData: initialData,
    revalidateOnFocus: true,
  });

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ 스케줄 컬럼 메타데이터 생성
  const scheduleColumnsMeta = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  // ✅ 데이터 변환 (useMemo로 메모이제이션)
  const data = useMemo<TableRow[]>(() => {
    return registrations.map((reg) => {
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach((schedule) => {
        scheduleData[`schedule_${schedule.id}`] =
          reg.userRetreatRegistrationScheduleIds?.includes(schedule.id) ||
          false;
      });

      return {
        id: reg.id.toString(),
        department: `${reg.univGroupNumber}부`,
        gender: reg.gender,
        grade: `${reg.gradeNumber}학년`,
        name: reg.name,
        schedule: scheduleData,
        type: reg.userType,
        amount: reg.price,
        createdAt: reg.createdAt,
        status: reg.paymentStatus,
        confirmedBy: reg.paymentConfirmUserName || null,
        paymentConfirmedAt: reg.paymentConfirmedAt || null,
        original: reg,
      };
    });
  }, [registrations, schedules]);

  // ✅ 컬럼 정의
  const columns = useMemo<ColumnDef<TableRow>[]>(() => {
    const staticColumns: ColumnDef<TableRow>[] = [
      columnHelper.accessor("department", {
        id: "department",
        header: "부서",
        cell: (info) => (
          <div className="text-center">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor("gender", {
        id: "gender",
        header: "성별",
        cell: (info) => (
          <div className="text-center">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
      }),
      columnHelper.accessor("grade", {
        id: "grade",
        header: "학년",
        cell: (info) => (
          <div className="text-center">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: "이름",
        cell: (info) => (
          <div className="font-medium text-center">{info.getValue()}</div>
        ),
      }),
    ];

    // 동적 스케줄 컬럼
    const scheduleColumns: ColumnDef<TableRow>[] = scheduleColumnsMeta.map((col) =>
      columnHelper.accessor((row) => row.schedule[col.key], {
        id: col.key,
        header: col.label,
        cell: (info) => (
          <div className="flex justify-center">
            <Checkbox
              checked={!!info.getValue()}
              disabled
              className={info.getValue() ? col.bgColorClass : ""}
            />
          </div>
        ),
      })
    );

    const endColumns: ColumnDef<TableRow>[] = [
      columnHelper.accessor("type", {
        id: "type",
        header: "타입",
        cell: (info) => {
          const type = info.getValue();
          return (
            <div className="text-center">
              {type ? <TypeBadge type={type} /> : <span>-</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor("amount", {
        id: "amount",
        header: "금액",
        cell: (info) => (
          <div className="font-medium text-center">
            {info.getValue().toLocaleString()}원
          </div>
        ),
      }),
      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: "신청 시각",
        cell: (info) => {
          const createdAt = info.getValue();
          return (
            <div className="text-gray-600 text-sm text-center">
              {createdAt ? formatDate(createdAt) : "-"}
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "입금 현황",
        cell: (info) => (
          <div className="text-center">
            <StatusBadge status={info.getValue()} />
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "액션",
        cell: (props) => (
          <div className="text-center">
            <RetreatPaymentConfirmationTableActions
              registration={props.row.original.original}
              confirmPayment={confirmPayment}
              sendPaymentRequest={sendPaymentRequest}
              refundComplete={refundComplete}
              isMutating={isMutating}
            />
          </div>
        ),
      }),
      columnHelper.accessor("confirmedBy", {
        id: "confirmedBy",
        header: "처리자명",
        cell: (info) => (
          <div className="text-center">{info.getValue() || "-"}</div>
        ),
      }),
      columnHelper.accessor("paymentConfirmedAt", {
        id: "paymentConfirmedAt",
        header: "처리 시각",
        cell: (info) => {
          const paymentConfirmedAt = info.getValue();
          return (
            <div className="text-gray-600 text-sm text-center">
              {paymentConfirmedAt ? formatDate(paymentConfirmedAt) : "-"}
            </div>
          );
        },
      }),
    ];

    return [...staticColumns, ...scheduleColumns, ...endColumns];
  }, [schedules, confirmPayment, sendPaymentRequest, refundComplete, isMutating]);

  // ✅ TanStack Table 초기화
  const table = useReactTable<TableRow>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // ✅ Multi-sort 및 필터 활성화
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableColumnFilters: true,
    enableFilters: true,
    // ✅ 모든 클릭을 multi-sort event로 처리 (Shift 키 불필요)
    isMultiSortEvent: () => true,
    // 전역 필터 함수 (통합 검색)
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.name,
        row.original.department,
        row.original.grade,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 헤더 */}
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              신청 현황 및 입금 조회
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              전체 신청자 목록 ({table.getFilteredRowModel().rows.length}명)
            </p>
          </div>

          {/* 툴바 */}
          <RetreatPaymentConfirmationTableToolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            retreatSlug={retreatSlug}
          />

          {/* ✅ 가상화 테이블 */}
          <VirtualizedTable
            table={table}
            estimateSize={50}
            overscan={10}
            className="max-h-[70vh]"
            emptyMessage={
              globalFilter
                ? "검색 결과가 없습니다."
                : "표시할 데이터가 없습니다."
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
