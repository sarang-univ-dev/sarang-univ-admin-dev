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
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("userPhoneNumber", {
        id: "phone",
        header: "전화번호",
        cell: (info) => info.getValue() || "-",
      }),
    ];

    // 동적 스케줄 컬럼 (색상 포함)
    const scheduleColumns: ColumnDef<IUnivGroupBusRegistration>[] =
      scheduleColumnsWithColor.map((scheduleCol) =>
        columnHelper.accessor(
          (row) =>
            row.userRetreatShuttleBusRegistrationScheduleIds?.includes(
              scheduleCol.id
            ),
          {
            id: scheduleCol.key,
            header: () => (
              <div className="text-xs whitespace-pre-line text-center">
                {scheduleCol.label}
              </div>
            ),
            cell: (info) => (
              <div className="flex justify-center">
                <Checkbox
                  checked={!!info.getValue()}
                  disabled
                  className={scheduleCol.bgColorClass}
                />
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

    return [...staticColumns, ...scheduleColumns, ...endColumns];
  }, [scheduleColumnsWithColor, registrations, sidebar.open]);

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
              <div className="min-w-max">
                <div className="max-h-[80vh] overflow-auto">
                  <Table className="min-w-full whitespace-nowrap relative text-sm">
                  <TableHeader className="bg-gray-100 sticky top-0 z-10 select-none">
                    <TableRow>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>부서</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>성별</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>학년</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>이름</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>전화번호</span>
                        </div>
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumnsWithColor.length}
                        className="text-center px-3 py-2.5"
                      >
                        버스 신청 일정
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>금액</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>입금 현황</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>일정 변동 메모</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-3 py-2.5 text-center"
                        rowSpan={2}
                      >
                        메모 관리
                      </TableHead>
                      <TableHead
                        className="px-3 py-2.5 text-center"
                        rowSpan={2}
                      >
                        상세 보기
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumnsWithColor.map((scheduleCol) => (
                        <TableHead
                          key={scheduleCol.key}
                          className="p-2 text-center"
                        >
                          <span className="text-xs whitespace-pre-line">
                            {scheduleCol.label}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5 + scheduleColumnsWithColor.length + 5}
                          className="text-center py-10 text-gray-500"
                        >
                          {globalFilter
                            ? "검색 결과가 없습니다."
                            : "표시할 데이터가 없습니다."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => {
                        const data = row.original;
                        return (
                          <TableRow
                            key={row.id}
                            className="group hover:bg-gray-50 transition-colors duration-150"
                          >
                            <TableCell className="text-center px-3 py-2.5">
                              {data.univGroupNumber}부
                            </TableCell>
                            <TableCell className="text-center px-3 py-2.5">
                              <GenderBadge gender={data.gender} />
                            </TableCell>
                            <TableCell className="text-center px-3 py-2.5">
                              {data.gradeNumber}학년
                            </TableCell>
                            <TableCell className="text-center px-3 py-2.5">
                              {data.name}
                            </TableCell>
                            <TableCell className="font-medium text-center px-3 py-2.5">
                              {data.userPhoneNumber || "-"}
                            </TableCell>
                            {scheduleColumnsWithColor.map((col) => (
                              <TableCell
                                key={`${row.id}-${col.key}`}
                                className="p-2 text-center"
                              >
                                <Checkbox
                                  checked={
                                    !!data.userRetreatShuttleBusRegistrationScheduleIds?.includes(
                                      col.id
                                    )
                                  }
                                  disabled
                                  className={
                                    data.userRetreatShuttleBusRegistrationScheduleIds?.includes(
                                      col.id
                                    )
                                      ? col.bgColorClass
                                      : ""
                                  }
                                />
                              </TableCell>
                            ))}
                            <TableCell className="font-medium text-center px-3 py-2.5">
                              {data.price.toLocaleString()}원
                            </TableCell>
                            <TableCell className="text-center px-3 py-2.5">
                              <StatusBadge status={data.shuttleBusPaymentStatus} />
                            </TableCell>
                            <TableCell
                              className="text-center min-w-[200px] max-w-[300px] whitespace-pre-wrap break-words px-3 py-2.5"
                              title={data.univGroupStaffShuttleBusHistoryMemo || ""}
                            >
                              {data.univGroupStaffShuttleBusHistoryMemo || "-"}
                            </TableCell>
                            <TableCell className="text-center px-3 py-2.5">
                              <UnivGroupBusRegistrationTableActions
                                row={{
                                  id: data.id.toString(),
                                  status: data.shuttleBusPaymentStatus,
                                  memo: data.univGroupStaffShuttleBusHistoryMemo,
                                }}
                                onOpenMemo={(id) => {
                                  const registration = registrations.find(
                                    (r) => r.id.toString() === id
                                  );
                                  if (registration) sidebar.open(registration);
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center px-3 py-2.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sidebar.open(data)}
                                className="flex items-center gap-1.5 text-xs h-7"
                              >
                                <Eye className="h-3 w-3" />
                                <span>보기</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
