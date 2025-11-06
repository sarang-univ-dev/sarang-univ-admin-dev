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
import { IUnivGroupBusRegistration } from "@/types/bus-registration";
import { TRetreatShuttleBus } from "@/types";
import { GenderBadge, StatusBadge } from "@/components/Badge-bus";
import { useUnivGroupBusRegistration } from "@/hooks/univ-group-bus-registration/use-univ-group-bus-registration";
import { UnivGroupBusRegistrationTableToolbar } from "./UnivGroupBusRegistrationTableToolbar";
import { UnivGroupBusRegistrationTableActions } from "./UnivGroupBusRegistrationTableActions";
import { UnivGroupBusRegistrationDetailContent } from "./UnivGroupBusRegistrationDetailContent";
import { DetailSidebar, useDetailSidebar } from "@/components/common/detail-sidebar";
import { useToastStore } from "@/store/toast-store";
import { webAxios } from "@/lib/api/axios";
import { mutate } from "swr";

interface UnivGroupBusRegistrationTableProps {
  initialData: IUnivGroupBusRegistration[];
  schedules: TRetreatShuttleBus[];
  retreatSlug: string;
}

const columnHelper = createColumnHelper<IUnivGroupBusRegistration>();

/**
 * 부서 셔틀버스 등록 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 정렬
 * - 통합 검색 (Lodash debounce)
 * - 메모 작성
 * - Detail Sidebar
 * - Timestamp 정보는 테이블에서 제외 (Detail에만 표시)
 */
export function UnivGroupBusRegistrationTable({
  initialData,
  schedules,
  retreatSlug,
}: UnivGroupBusRegistrationTableProps) {
  const addToast = useToastStore((state) => state.add);

  // ✅ SWR로 실시간 데이터 동기화
  const { data: registrations = initialData } = useUnivGroupBusRegistration(
    retreatSlug,
    {
      initialData,
      revalidateOnFocus: true,
    }
  );

  // ✅ 사이드바 상태 관리
  const sidebar = useDetailSidebar<IUnivGroupBusRegistration>();

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/shuttle-bus/univ-group-registration`;

  // ✅ 메모 저장 핸들러
  const handleSaveMemo = async (id: string, memo: string) => {
    setIsSaving(true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/schedule-change-memo`,
        { memo }
      );
      await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "메모가 저장되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("메모 저장 실패:", error);
      addToast({
        title: "오류",
        description: "메모 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ 컬럼 정의 (Timestamp 정보 제외)
  const columns = useMemo<ColumnDef<IUnivGroupBusRegistration>[]>(() => {
    const staticColumns: ColumnDef<IUnivGroupBusRegistration>[] = [
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
      columnHelper.accessor("userPhoneNumber", {
        id: "phone",
        header: "전화번호",
        cell: (info) => info.getValue() || "-",
      }),
    ];

    // 동적 스케줄 컬럼
    const scheduleColumns: ColumnDef<IUnivGroupBusRegistration>[] = schedules.map(
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

    const endColumns: ColumnDef<IUnivGroupBusRegistration>[] = [
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
      columnHelper.accessor("univGroupStaffShuttleBusHistoryMemo", {
        id: "memo",
        header: "일정 변동 메모",
        cell: (info) => (
          <div className="max-w-[200px] truncate" title={info.getValue() || ""}>
            {info.getValue() || "-"}
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "메모 관리",
        cell: (props) => (
          <UnivGroupBusRegistrationTableActions
            row={{
              id: props.row.original.id.toString(),
              status: props.row.original.shuttleBusPaymentStatus,
              memo: props.row.original.univGroupStaffShuttleBusHistoryMemo,
            }}
            onOpenMemo={(id) => {
              const registration = registrations.find((r) => r.id.toString() === id);
              if (registration) sidebar.open(registration);
            }}
          />
        ),
      }),
    ];

    return [...staticColumns, ...scheduleColumns, ...endColumns];
  }, [schedules, registrations, sidebar]);

  // ✅ TanStack Table 초기화
  const table = useReactTable<IUnivGroupBusRegistration>({
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
                부서 현황 및 버스 입금 조회
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                부서 버스 신청자 목록 ({filteredData.length}명)
              </p>
            </div>

            {/* 툴바 */}
            <UnivGroupBusRegistrationTableToolbar
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
        isOpen={sidebar.isOpen}
        onClose={sidebar.close}
        title={sidebar.selectedItem ? `${sidebar.selectedItem.name} 상세 정보` : ""}
      >
        {sidebar.selectedItem && (
          <UnivGroupBusRegistrationDetailContent
            data={sidebar.selectedItem}
            schedules={schedules}
            onSaveMemo={handleSaveMemo}
            isMutating={isSaving}
          />
        )}
      </DetailSidebar>
    </>
  );
}
