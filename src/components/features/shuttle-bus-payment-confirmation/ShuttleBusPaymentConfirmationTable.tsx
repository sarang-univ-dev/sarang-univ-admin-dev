"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";
import { TRetreatShuttleBus } from "@/types";
import { GenderBadge, StatusBadge } from "@/components/Badge-bus";
import { useShuttleBusPaymentConfirmation } from "@/hooks/shuttle-bus-payment-confirmation/use-shuttle-bus-payment-confirmation";
import { ShuttleBusPaymentConfirmationTableToolbar } from "./ShuttleBusPaymentConfirmationTableToolbar";
import { ShuttleBusPaymentConfirmationTableActions } from "./ShuttleBusPaymentConfirmationTableActions";
import { ShuttleBusPaymentConfirmationDetailContent } from "./ShuttleBusPaymentConfirmationDetailContent";
import { DetailSidebar, useDetailSidebar } from "@/components/common/detail-sidebar";

interface ShuttleBusPaymentConfirmationTableProps {
  initialData: IShuttleBusPaymentConfirmationRegistration[];
  schedules: TRetreatShuttleBus[];
  retreatSlug: string;
}

const columnHelper = createColumnHelper<IShuttleBusPaymentConfirmationRegistration>();

/**
 * 셔틀버스 재정 팀원 - 입금 확인 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 정렬
 * - 통합 검색 (Lodash debounce)
 * - 입금 확인, 입금 요청, 환불 처리 액션
 * - Detail Sidebar
 * - Timestamp 정보는 테이블에서 제외 (Detail에만 표시)
 */
export function ShuttleBusPaymentConfirmationTable({
  initialData,
  schedules,
  retreatSlug,
}: ShuttleBusPaymentConfirmationTableProps) {
  // ✅ SWR로 실시간 데이터 동기화
  const { data: registrations = initialData } = useShuttleBusPaymentConfirmation(
    retreatSlug,
    {
      initialData,
      revalidateOnFocus: true,
    }
  );

  // ✅ 사이드바 상태 관리
  const sidebar = useDetailSidebar<IShuttleBusPaymentConfirmationRegistration>();

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ 컬럼 정의 (Timestamp 정보 제외)
  const columns = useMemo(() => {
    const staticColumns = [
      columnHelper.accessor("univGroupNumber", {
        id: "department",
        header: "부서",
        cell: (info) => `${info.getValue()}부`,
      }),
      columnHelper.accessor("gender", {
        id: "gender",
        header: "성별",
        cell: (info) => <GenderBadge gender={info.getValue()} />,
      }),
      columnHelper.accessor("gradeNumber", {
        id: "grade",
        header: "학년",
        cell: (info) => `${info.getValue()}학년`,
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: "이름",
        cell: (info) => (
          <button
            onClick={() => sidebar.open(info.row.original)}
            className="font-medium hover:underline text-blue-600"
          >
            {info.getValue()}
          </button>
        ),
      }),
    ];

    // 동적 스케줄 컬럼
    const scheduleColumns = schedules.map(
      (schedule) =>
        columnHelper.accessor(
          (row) =>
            row.userRetreatShuttleBusRegistrationScheduleIds?.includes(
              schedule.id
            ),
          {
            id: `schedule_${schedule.id}`,
            header: () => (
              <div className="text-xs whitespace-pre-line text-center">
                {schedule.name}
              </div>
            ),
            cell: (info) => (
              <div className="flex justify-center">
                <Checkbox checked={!!info.getValue()} disabled />
              </div>
            ),
          }
        )
    );

    const endColumns = [
      columnHelper.accessor("price", {
        id: "amount",
        header: "금액",
        cell: (info) => `${info.getValue().toLocaleString()}원`,
      }),
      columnHelper.accessor("shuttleBusPaymentStatus", {
        id: "status",
        header: "입금 현황",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      // ❌ Timestamp 정보 제거: createdAt, paymentConfirmedAt, paymentConfirmUserName
      columnHelper.display({
        id: "actions",
        header: "액션",
        cell: (props) => (
          <ShuttleBusPaymentConfirmationTableActions
            registration={props.row.original}
            retreatSlug={retreatSlug}
            onOpenDetail={() => sidebar.open(props.row.original)}
          />
        ),
      }),
    ];

    return [...staticColumns, ...scheduleColumns, ...endColumns];
  }, [schedules, retreatSlug, sidebar]);

  // ✅ TanStack Table 초기화
  const table = useReactTable<IShuttleBusPaymentConfirmationRegistration>({
    data: registrations,
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
    // 전역 필터 함수
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.name,
        `${row.original.univGroupNumber}부`,
        `${row.original.gradeNumber}학년`,
        row.original.userPhoneNumber,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  const filteredData = table.getRowModel().rows.map((row) => row.original);

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* 헤더 */}
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                버스 신청 현황 및 입금 조회
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                전체 버스 신청자 목록 ({filteredData.length}명)
              </p>
            </div>

            {/* 툴바 */}
            <ShuttleBusPaymentConfirmationTableToolbar
              table={table}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              retreatSlug={retreatSlug}
            />

            {/* 테이블 */}
            <div className="rounded-md border">
              <div className="max-h-[70vh] overflow-auto">
                <Table>
                  <TableHeader className="bg-gray-100 sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="text-center px-3 py-2.5"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="text-center py-10 text-gray-500"
                        >
                          {globalFilter
                            ? "검색 결과가 없습니다."
                            : "표시할 데이터가 없습니다."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className="text-center px-3 py-2.5"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sidebar - Timestamp 정보는 여기에만 표시 */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={sidebar.selectedItem}
        title={sidebar.selectedItem ? `${sidebar.selectedItem.name} 상세 정보` : "상세 정보"}
      >
        {(data) => (
          <ShuttleBusPaymentConfirmationDetailContent
            data={data}
            schedules={schedules}
            retreatSlug={retreatSlug}
          />
        )}
      </DetailSidebar>
    </>
  );
}
