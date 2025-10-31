import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { TRetreatRegistrationSchedule } from "@/types";
import { StatusBadge, TypeBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { createRetreatScheduleColumns } from "@/hooks/retreat/use-retreat-schedule-columns";

// 테이블 데이터 타입 정의
export interface ScheduleChangeRequestTableData {
  id: string;
  department: string;
  grade: string;
  name: string;
  schedule: Record<string, boolean>;
  type: string | null;
  amount: number;
  createdAt: string;
  status: string;
  issuerName: string | null;
  memoCreatedAt: string;
  memo: string | null;
  memoId: number | null;
  scheduleIds: number[];
}

const columnHelper = createColumnHelper<ScheduleChangeRequestTableData>();

/**
 * 일정 변경 요청 테이블 컬럼 훅
 *
 * @description
 * - 정적 컬럼 + 동적 스케줄 컬럼 생성
 * - useMemo로 메모이제이션하여 불필요한 재생성 방지
 * - 타입 안전성 보장
 *
 * @param schedules - 수양회 스케줄 목록 (동적 컬럼 생성에 사용)
 * @param retreatSlug - 수양회 슬러그 (액션에 필요)
 * @param onRowClick - 행 클릭 시 실행할 콜백 함수 (상세 정보 사이드바 열기)
 * @param onProcessSchedule - 일정 처리 버튼 클릭 시 실행할 콜백 함수
 * @param onResolveSchedule - 처리 완료 버튼 클릭 시 실행할 콜백 함수
 * @returns TanStack Table columns
 */
export function useScheduleChangeRequestColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  onProcessSchedule?: (row: ScheduleChangeRequestTableData) => void,
  onResolveSchedule?: (row: ScheduleChangeRequestTableData) => void
) {
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
          <div className="text-center text-sm">{info.getValue()}</div>
        ),
        enableHiding: false,
        size: 80,
      }),

      columnHelper.accessor("grade", {
        id: "grade",
        header: () => <div className="text-center text-sm">학년</div>,
        cell: (info) => (
          <div className="text-center text-sm">{info.getValue()}</div>
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
          <div className="text-center font-medium text-sm">{info.getValue()}</div>
        ),
        enableHiding: false,
        size: 100,
      }),
    ];

    // 2. 동적 스케줄 컬럼
    const scheduleColumns = createRetreatScheduleColumns(schedules, columnHelper);

    // 3. 오른쪽 정적 컬럼
    const rightColumns = [
      columnHelper.accessor("type", {
        id: "type",
        header: () => <div className="text-center text-sm">타입</div>,
        cell: (info) => (
          <div className="flex justify-center">
            <TypeBadge type={info.getValue() as any} />
          </div>
        ),
        size: 90,
      }),

      columnHelper.accessor("amount", {
        id: "amount",
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
              금액
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: (info) => (
          <div className="text-center font-medium text-sm">
            {info.getValue().toLocaleString()}원
          </div>
        ),
        size: 100,
      }),

      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: () => <div className="text-center text-sm">신청 시각</div>,
        cell: (info) => (
          <div className="text-center text-sm text-gray-600">
            {info.getValue() ? formatDate(info.getValue()) : "-"}
          </div>
        ),
        size: 150,
      }),

      columnHelper.accessor("status", {
        id: "status",
        header: () => <div className="text-center text-sm">입금 현황</div>,
        cell: (info) => (
          <div className="flex justify-center">
            <StatusBadge status={info.getValue() as any} />
          </div>
        ),
        size: 110,
      }),

      columnHelper.accessor("issuerName", {
        id: "issuerName",
        header: () => <div className="text-center text-sm">메모 작성자명</div>,
        cell: (info) => (
          <div className="text-center text-sm">{info.getValue() || "-"}</div>
        ),
        size: 120,
      }),

      columnHelper.accessor("memoCreatedAt", {
        id: "memoCreatedAt",
        header: () => <div className="text-center text-sm">메모 작성 시각</div>,
        cell: (info) => (
          <div className="text-center text-sm text-gray-600">
            {formatDate(info.getValue())}
          </div>
        ),
        size: 150,
      }),

      columnHelper.accessor("memo", {
        id: "memo",
        header: () => <div className="text-center text-sm">메모 내용</div>,
        cell: (info) => (
          <div
            className="text-center min-w-[200px] max-w-[300px] whitespace-pre-wrap break-words px-3 py-2.5 text-sm"
            title={info.getValue() || ""}
          >
            {info.getValue() || "-"}
          </div>
        ),
        size: 250,
      }),

      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center text-sm">액션</div>,
        cell: (props) => {
          const row = props.row.original;
          return (
            <div className="flex flex-col space-y-2 px-2">
              {onProcessSchedule && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onProcessSchedule(row)}
                  className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors text-xs"
                >
                  일정 처리
                </Button>
              )}
              {onResolveSchedule && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolveSchedule(row)}
                  className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors text-xs"
                >
                  처리 완료
                </Button>
              )}
            </div>
          );
        },
        size: 100,
        enableHiding: false,
      }),
    ];

    return [...leftColumns, ...scheduleColumns, ...rightColumns];
  }, [schedules, retreatSlug, onProcessSchedule, onResolveSchedule]);

  return columns;
}
