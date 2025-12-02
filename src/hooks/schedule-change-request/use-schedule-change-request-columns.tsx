import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { TRetreatRegistrationSchedule } from "@/types";
import { StatusBadge, TypeBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import { ColumnHeader } from "@/components/common/table/ColumnHeader";
import { generateScheduleColumns } from "@/utils/retreat-utils";

// 테이블 데이터 타입 정의
export interface ScheduleChangeRequestTableData {
  id: string;
  department: string;
  grade: string;
  name: string;
  schedules: Record<string, boolean>;
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
 * - 금액, 신청 시각, 메모 관련 정보는 DetailSidebar로 이동
 *
 * @param schedules - 수양회 스케줄 목록 (동적 컬럼 생성에 사용)
 * @param onRowClick - 행 클릭 시 실행할 콜백 함수 (상세 정보 사이드바 열기)
 * @param onProcessSchedule - 일정 처리 버튼 클릭 시 실행할 콜백 함수
 * @param onResolveSchedule - 처리 완료 버튼 클릭 시 실행할 콜백 함수
 * @returns TanStack Table columns
 */
export function useScheduleChangeRequestColumns(
  schedules: TRetreatRegistrationSchedule[],
  onRowClick?: (row: ScheduleChangeRequestTableData) => void,
  onProcessSchedule?: (row: ScheduleChangeRequestTableData) => void,
  onResolveSchedule?: (row: ScheduleChangeRequestTableData) => void
) {
  // 스케줄 컬럼 메타데이터 생성
  const scheduleColumnsMeta = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  const columns = useMemo(() => {
    // 1. 왼쪽 정적 컬럼
    const leftColumns = [
      columnHelper.accessor("department", {
        id: "department",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="부서"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
        filterFn: "arrIncludesSome",
      }),

      columnHelper.accessor("grade", {
        id: "grade",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="학년"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap">
            {info.getValue()}
          </div>
        ),
        filterFn: "arrIncludesSome",
        sortingFn: (rowA, rowB, columnId) => {
          const gradeA = rowA.getValue(columnId) as string;
          const gradeB = rowB.getValue(columnId) as string;
          const numA = parseInt(gradeA?.replace(/[^0-9]/g, "") || "0", 10);
          const numB = parseInt(gradeB?.replace(/[^0-9]/g, "") || "0", 10);
          return numA - numB;
        },
      }),

      columnHelper.accessor("name", {
        id: "name",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="font-medium text-center px-2 py-1 whitespace-nowrap">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
        filterFn: "arrIncludesSome",
      }),
    ];

    // 2. 동적 스케줄 컬럼
    const scheduleColumns = scheduleColumnsMeta.map((col) =>
        columnHelper.accessor((row) => row.schedules[col.key], {
          id: col.key,
          header: col.label,
          cell: (info) => {
            const isChecked = !!info.getValue();
            return (
              <div className="flex justify-center px-2 py-1">
                <Checkbox
                  checked={isChecked}
                  disabled
                  className={isChecked ? col.bgColorClass : ""}
                />
              </div>
            );
          },
        })
      );

    // 3. 오른쪽 정적 컬럼
    const rightColumns = [
      columnHelper.accessor("type", {
        id: "type",
        header: "타입",
        cell: (info) => {
          const type = info.getValue();
          return (
            <div className="flex justify-center px-2 py-1">
              {type ? <TypeBadge type={type as any} /> : <span>-</span>}
            </div>
          );
        },
      }),

      columnHelper.accessor("status", {
        id: "status",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="입금 현황"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="flex justify-center px-2 py-1">
            <StatusBadge status={info.getValue() as any} />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),

      columnHelper.accessor("memo", {
        id: "memo",
        header: "메모 내용",
        cell: (info) => (
          <div className="text-center min-w-[150px] max-w-[250px] whitespace-pre-wrap break-words px-3 py-2.5 text-sm">
            {info.getValue() || "-"}
          </div>
        ),
      }),

      // 상세 정보 버튼
      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center whitespace-nowrap">상세</div>,
        cell: (props) => (
          <div className="flex justify-center px-2 py-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onRowClick?.(props.row.original);
              }}
              className="h-8 px-3 whitespace-nowrap"
            >
              <Info className="h-4 w-4 mr-1" />
              보기
            </Button>
          </div>
        ),
      }),

      // 액션 버튼
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center whitespace-nowrap">액션</div>,
        cell: (props) => {
          const row = props.row.original;
          return (
            <div className="flex flex-col items-center gap-1 px-2 py-1">
              {onProcessSchedule && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProcessSchedule(row);
                  }}
                  className="h-8 px-3 whitespace-nowrap hover:bg-black hover:text-white transition-colors text-xs"
                >
                  일정 처리
                </Button>
              )}
              {onResolveSchedule && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolveSchedule(row);
                  }}
                  className="h-8 px-3 whitespace-nowrap hover:bg-green-600 hover:text-white transition-colors text-xs"
                >
                  처리 완료
                </Button>
              )}
            </div>
          );
        },
        enableHiding: false,
      }),
    ];

    return [...leftColumns, ...scheduleColumns, ...rightColumns];
  }, [scheduleColumnsMeta, onRowClick, onProcessSchedule, onResolveSchedule]);

  return columns;
}
