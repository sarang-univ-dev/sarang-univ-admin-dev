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
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { generateShuttleBusScheduleColumns } from "@/utils/bus-utils";
import { useIsMobile } from "@/hooks/use-media-query";

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

  // ✅ 모바일 감지
  const isMobile = useIsMobile();

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

  // ✅ 메모 업데이트 핸들러
  const handleUpdateMemo = async (id: string, memo: string) => {
    setIsSaving(true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/schedule-change-memo`,
        { memo }
      );
      await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "메모가 수정되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("메모 수정 실패:", error);
      addToast({
        title: "오류",
        description: "메모 수정에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ 메모 삭제 핸들러
  const handleDeleteMemo = async (id: string) => {
    setIsSaving(true);
    try {
      await webAxios.delete(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/schedule-change-memo`
      );
      await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "메모가 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("메모 삭제 실패:", error);
      addToast({
        title: "오류",
        description: "메모 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ 색상이 포함된 스케줄 컬럼 정보 생성
  const scheduleColumnsWithColor = useMemo(
    () => generateShuttleBusScheduleColumns(schedules),
    [schedules]
  );

  // ✅ 색상 매핑 헬퍼 함수
  const getChipColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      rose: "border-rose-500 bg-rose-50 text-rose-700",
      amber: "border-amber-500 bg-amber-50 text-amber-700",
      teal: "border-teal-500 bg-teal-50 text-teal-700",
      indigo: "border-indigo-500 bg-indigo-50 text-indigo-700",
    };
    return colorMap[color] || "border-gray-500 bg-gray-50 text-gray-700";
  };

  // ✅ 컬럼 정의 (Timestamp 정보 제외)
  const columns = useMemo<ColumnDef<IUnivGroupBusRegistration>[]>(() => {
    const staticColumns: ColumnDef<IUnivGroupBusRegistration>[] = [
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
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("userPhoneNumber", {
        id: "phone",
        header: "전화번호",
        cell: (info) => info.getValue() || "-",
      }),
      // ✅ 신청 버스 컬럼 (chip/badge로 표시)
      columnHelper.accessor("userRetreatShuttleBusRegistrationScheduleIds", {
        id: "selected-buses",
        header: "신청 버스",
        cell: (info) => {
          const selectedIds = info.getValue() || [];
          const selectedSchedules = scheduleColumnsWithColor.filter((s) =>
            selectedIds.includes(s.id)
          );

          if (selectedSchedules.length === 0) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }

          return (
            <div className="grid grid-cols-2 gap-1 py-1">
              {selectedSchedules.map((schedule) => (
                <Badge
                  key={schedule.id}
                  variant="outline"
                  className={cn(
                    "text-xs whitespace-nowrap justify-center",
                    getChipColorClass(schedule.color)
                  )}
                >
                  {schedule.label}
                </Badge>
              ))}
            </div>
          );
        },
      }),
    ];

    const endColumns: ColumnDef<IUnivGroupBusRegistration>[] = [
      columnHelper.accessor("shuttleBusPaymentStatus", {
        id: "status",
        header: "입금 현황",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: "detail",
        header: "상세 보기",
        cell: (props) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => sidebar.open(props.row.original)}
            className="flex items-center gap-1.5 text-xs h-7"
          >
            <Eye className="h-3 w-3" />
            <span>보기</span>
          </Button>
        ),
      }),
    ];

    return [...staticColumns, ...endColumns];
  }, [scheduleColumnsWithColor, registrations, sidebar]);

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

  // ✅ 사이드바에 표시할 최신 데이터 (SWR 캐시와 동기화)
  const currentSidebarData = sidebar.selectedItem
    ? registrations.find((item) => item.id === sidebar.selectedItem.id) || sidebar.selectedItem
    : null;

  return (
    <>
      <div className="space-y-4">
        {/* 헤더 */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            부서 셔틀버스 신청 내역
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
              <div className="min-w-max">
                <div className="max-h-[80vh] overflow-auto">
                  <Table className="min-w-full whitespace-nowrap relative text-sm">
                  <TableHeader className="bg-gray-100 sticky top-0 z-10 select-none">
                    <TableRow>
                      <TableHead className="px-3 py-2.5">
                        <div className="flex items-center space-x-1 justify-center">
                          <span>성별</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5">
                        <div className="flex items-center space-x-1 justify-center">
                          <span>학년</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5">
                        <div className="flex items-center space-x-1 justify-center">
                          <span>이름</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5">
                        <div className="flex items-center space-x-1 justify-center">
                          <span>전화번호</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5">
                        <div className="flex items-center space-x-1 justify-center">
                          <span>신청 버스</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5">
                        <div className="flex items-center space-x-1 justify-center">
                          <span>입금 현황</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5 text-center">
                        상세 보기
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
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
                          className="group hover:bg-gray-50 transition-colors duration-150"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className="px-3 py-2.5 text-center"
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
      </div>

      {/* ✅ 상세 정보 사이드바 (반응형) - 최신 데이터로 실시간 동기화 */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={currentSidebarData}
        title="신청자 상세 정보"
        description={(data) => `${data.name} (${data.univGroupNumber}부) 버스 신청 내역`}
        side={isMobile ? "bottom" : "right"}
      >
        {(data) => (
          <UnivGroupBusRegistrationDetailContent
            data={data}
            schedules={schedules}
            onSaveMemo={handleSaveMemo}
            onUpdateMemo={handleUpdateMemo}
            onDeleteMemo={handleDeleteMemo}
            isMutating={isSaving}
          />
        )}
      </DetailSidebar>
    </>
  );
}
