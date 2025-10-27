import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule, RetreatRegistrationScheduleType } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowUpDown } from "lucide-react";
import { UnivGroupAdminStaffTableActions } from "./UnivGroupAdminStaffTableActions";
import { UnivGroupAdminStaffMemoEditor } from "./UnivGroupAdminStaffMemoEditor";
import { ShuttleBusStatusBadge } from "./ShuttleBusStatusBadge";
import { formatDate } from "@/utils/formatDate";
import { getScheduleLabel } from "@/utils/retreat-utils";

const columnHelper = createColumnHelper<UnivGroupAdminStaffData>();

/**
 * 부서 행정 간사 테이블 컬럼 생성
 * - 정적 컬럼 + 동적 스케줄 컬럼 + 나머지 정적 컬럼
 * - TypeScript 타입 추론을 활용하여 any 타입 제거
 */
export function createUnivGroupAdminStaffColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string
) {
  // 1. 왼쪽 정적 컬럼
  const leftColumns = [
    columnHelper.accessor("department", {
      id: "department",
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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

    columnHelper.accessor("gender", {
      id: "gender",
      header: () => <div className="text-center text-sm">성별</div>,
      cell: (info) => (
        <div className="flex justify-center">
          <GenderBadge gender={info.getValue()} />
        </div>
      ),
      size: 70,
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            size="sm"
            className="h-auto p-1"
          >
            이름
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: (info) => (
        <div className="font-medium text-center text-sm">{info.getValue()}</div>
      ),
      enableHiding: false,
      size: 100,
    }),

    columnHelper.accessor("phone", {
      id: "phone",
      header: () => <div className="text-center text-sm">전화번호</div>,
      cell: (info) => (
        <div className="text-center text-sm">{info.getValue() || "-"}</div>
      ),
      size: 120,
    }),

    columnHelper.accessor("currentLeaderName", {
      id: "currentLeaderName",
      header: () => <div className="text-center text-sm">부서 리더명</div>,
      cell: (info) => (
        <div className="text-center text-sm">{info.getValue() || "-"}</div>
      ),
      size: 100,
    }),
  ];

  // 2. 동적 스케줄 컬럼
  const scheduleColumns = schedules.map((schedule) => {
      const label = getScheduleLabel(
        new Date(schedule.time),
        schedule.type as RetreatRegistrationScheduleType
      );

      return columnHelper.accessor(
        (row) => row.schedules[`schedule_${schedule.id}`],
        {
          id: `schedule_${schedule.id}`,
          header: () => (
            <div className="text-center text-xs whitespace-normal px-1">
              {label}
            </div>
          ),
          cell: (info) => (
            <div className="flex justify-center">
              <Checkbox checked={info.getValue()} disabled />
            </div>
          ),
          enableSorting: false,
          size: 80,
        }
      );
    });

  // 3. 오른쪽 정적 컬럼
  const rightColumns = [
    columnHelper.accessor("type", {
      id: "type",
      header: () => <div className="text-center text-sm">타입</div>,
      cell: (info) => {
        const type = info.getValue();
        if (!type) return <div className="text-center text-sm">-</div>;
        return (
          <div className="flex justify-center">
            <TypeBadge type={type} />
          </div>
        );
      },
      filterFn: "equals",
      size: 100,
    }),

    columnHelper.accessor("amount", {
      id: "amount",
      header: () => <div className="text-center text-sm">금액</div>,
      cell: (info) => (
        <div className="text-center text-sm font-medium">
          {info.getValue()?.toLocaleString()}원
        </div>
      ),
      size: 100,
    }),

    columnHelper.accessor("createdAt", {
      id: "createdAt",
      header: () => <div className="text-center text-sm">신청시각</div>,
      cell: (info) => (
        <div className="text-center text-xs text-gray-600 whitespace-nowrap">
          {formatDate(info.getValue())}
        </div>
      ),
      size: 140,
    }),

    columnHelper.accessor("status", {
      id: "status",
      header: () => <div className="text-center text-sm">입금 현황</div>,
      cell: (info) => (
        <div className="flex justify-center">
          <StatusBadge status={info.getValue()} />
        </div>
      ),
      filterFn: "equals",
      size: 120,
    }),

    columnHelper.display({
      id: "actions",
      header: () => <div className="text-center text-sm">액션</div>,
      cell: (props) => (
        <UnivGroupAdminStaffTableActions
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
        <div className="text-center text-sm">{info.getValue() || "-"}</div>
      ),
      size: 100,
    }),

    columnHelper.accessor("paymentConfirmedAt", {
      id: "paymentConfirmedAt",
      header: () => <div className="text-center text-sm">처리시각</div>,
      cell: (info) => (
        <div className="text-center text-xs text-gray-600 whitespace-nowrap">
          {formatDate(info.getValue())}
        </div>
      ),
      size: 140,
    }),

    columnHelper.accessor("hadRegisteredShuttleBus", {
      id: "shuttleBus",
      header: () => (
        <div className="text-center text-sm whitespace-normal">
          셔틀버스
          <br />
          신청 여부
        </div>
      ),
      cell: (info) => <ShuttleBusStatusBadge hasRegistered={info.getValue()} />,
      size: 110,
    }),

    columnHelper.accessor("memo", {
      id: "scheduleMemo",
      header: () => (
        <div className="text-center text-sm whitespace-normal">
          일정 변동
          <br />
          요청 메모
        </div>
      ),
      cell: (info) => (
        <div
          className="text-center text-sm max-w-[200px] truncate px-2"
          title={info.getValue() || ""}
        >
          {info.getValue() || "-"}
        </div>
      ),
      size: 150,
    }),

    columnHelper.display({
      id: "memoActions",
      header: () => <div className="text-center text-sm">메모 관리</div>,
      cell: (props) => {
        const row = props.row.original;
        // 메모가 있으면 관리 불필요, 없으면서 입금 완료 상태면 작성 가능
        if (row.memo) {
          return <div className="text-center text-sm text-gray-600">-</div>;
        }
        // 입금 완료 상태일 때만 작성 버튼 표시
        if (row.status === "PAID") {
          return (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // 메모 다이얼로그 열기 (이벤트를 통해 처리)
                  const event = new CustomEvent("open-memo-dialog", {
                    detail: { id: row.id },
                  });
                  window.dispatchEvent(event);
                }}
                className="h-7 text-xs"
              >
                작성
              </Button>
            </div>
          );
        }
        return <div className="text-center text-sm text-gray-400">-</div>;
      },
      size: 100,
    }),

    columnHelper.display({
      id: "adminMemo",
      header: () => (
        <div className="text-center text-sm whitespace-normal">
          행정간사
          <br />
          메모
        </div>
      ),
      cell: (props) => (
        <UnivGroupAdminStaffMemoEditor
          row={props.row.original}
          retreatSlug={retreatSlug}
        />
      ),
      size: 250,
    }),

    columnHelper.display({
      id: "qr",
      header: () => <div className="text-center text-sm">QR</div>,
      cell: (props) => (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (props.row.original.qrUrl) {
                window.open(props.row.original.qrUrl, "_blank");
              }
            }}
            disabled={!props.row.original.qrUrl}
            className="h-7 text-xs"
          >
            <QrCode className="h-3 w-3" />
          </Button>
        </div>
      ),
      size: 80,
    }),
  ];

  return [...leftColumns, ...scheduleColumns, ...rightColumns];
}
