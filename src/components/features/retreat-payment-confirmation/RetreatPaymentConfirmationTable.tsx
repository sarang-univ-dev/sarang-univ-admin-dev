"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  // ✅ SWR로 실시간 데이터 동기화
  const { data: registrations = initialData } = useRetreatPaymentConfirmation(
    retreatSlug,
    {
      fallbackData: initialData,
      revalidateOnFocus: true,
    }
  );

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filteredData, setFilteredData] = useState<TableRow[]>([]);

  // ✅ 스케줄 컬럼 메타데이터 생성
  const scheduleColumnsMeta = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  // 데이터 변환
  const tableData = useMemo<TableRow[]>(() => {
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

  // filteredData 초기화
  useMemo(() => {
    if (filteredData.length === 0 && tableData.length > 0) {
      setFilteredData(tableData);
    }
  }, [tableData, filteredData]);

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
              retreatSlug={retreatSlug}
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
  }, [schedules, retreatSlug]);

  // ✅ TanStack Table 초기화
  const table = useReactTable<TableRow>({
    data: filteredData.length > 0 ? filteredData : tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 검색 결과 처리
  const handleSearch = (results: TableRow[], searchTerm: string) => {
    setFilteredData(results);
  };

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
              전체 신청자 목록 ({(filteredData.length > 0 ? filteredData : tableData).length}명)
            </p>
          </div>

          {/* 툴바 */}
          <RetreatPaymentConfirmationTableToolbar
            onSearch={handleSearch}
            data={tableData}
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
                        className="h-24 text-center"
                      >
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-gray-50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-3 py-2.5">
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
  );
}
