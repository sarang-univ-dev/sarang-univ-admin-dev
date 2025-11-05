import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowUpDown, Info } from "lucide-react";
import { UnivGroupRetreatRegistrationTableActions } from "@/components/features/univ-group-retreat-registration/UnivGroupRetreatRegistrationTableActions";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { ShuttleBusStatusBadge } from "@/components/features/univ-group-retreat-registration/ShuttleBusStatusBadge";
import { formatDate } from "@/utils/formatDate";
import { createRetreatScheduleColumns } from "@/hooks/retreat/use-retreat-schedule-columns";
import { useUnivGroupRetreatRegistration } from "./use-univ-group-retreat-registration";

const columnHelper = createColumnHelper<UnivGroupAdminStaffData>();

/**
 * 부서 수양회 신청 테이블 컬럼 훅
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
export function useUnivGroupRetreatRegistrationColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  onRowClick?: (row: UnivGroupAdminStaffData) => void
) {
  // 통합 훅에서 메모 관련 액션 가져오기
  const { saveAdminMemo, updateAdminMemo, deleteAdminMemo, isMutating } =
    useUnivGroupRetreatRegistration(retreatSlug);

  const columns = useMemo(() => {
    // 1. 왼쪽 정적 컬럼
    const leftColumns = [
      columnHelper.accessor("department", {
        id: "department",
        header: ({ column }) => (
          <div className="flex items-center justify-center whitespace-nowrap">
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
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-2">{info.getValue()}</div>
        ),
        enableHiding: false,
      }),

      columnHelper.accessor("gender", {
        id: "gender",
        header: () => <div className="text-center text-sm whitespace-nowrap">성별</div>,
        cell: info => (
          <div className="flex justify-center shrink-0 px-2">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
      }),

      columnHelper.accessor("grade", {
        id: "grade",
        header: () => <div className="text-center text-sm whitespace-nowrap">학년</div>,
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-2">{info.getValue()}</div>
        ),
      }),

      columnHelper.accessor("name", {
        id: "name",
        header: ({ column }) => (
          <div className="flex items-center justify-center whitespace-nowrap">
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
        cell: info => (
          <div className="font-medium text-center text-sm whitespace-nowrap shrink-0 px-2">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
      }),

      columnHelper.accessor("phone", {
        id: "phone",
        header: () => <div className="text-center text-sm whitespace-nowrap">전화번호</div>,
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-2">{info.getValue() || "-"}</div>
        ),
      }),

      columnHelper.accessor("currentLeaderName", {
        id: "currentLeaderName",
        header: () => <div className="text-center text-sm whitespace-nowrap">부서 리더명</div>,
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-2">{info.getValue() || "-"}</div>
        ),
      }),
    ];

    // 2. 동적 스케줄 컬럼 (날짜별 색상 적용)
    // ✅ 공통 훅 사용으로 코드 간소화 및 재사용성 향상
    const scheduleColumns = createRetreatScheduleColumns(schedules, columnHelper);

    // 3. 오른쪽 정적 컬럼
    const rightColumns = [
      columnHelper.accessor("type", {
        id: "type",
        header: () => <div className="text-center text-sm whitespace-nowrap">타입</div>,
        cell: info => {
          const type = info.getValue();
          if (!type) return <div className="text-center text-sm whitespace-nowrap shrink-0 px-2">-</div>;
          return (
            <div className="flex justify-center shrink-0 px-2">
              <TypeBadge type={type} />
            </div>
          );
        },
        filterFn: "equals",
      }),

      columnHelper.accessor("amount", {
        id: "amount",
        header: () => <div className="text-center text-sm whitespace-nowrap">금액</div>,
        cell: info => (
          <div className="text-center text-sm font-medium whitespace-nowrap shrink-0 px-2">
            {info.getValue()?.toLocaleString()}원
          </div>
        ),
      }),

      columnHelper.accessor("status", {
        id: "status",
        header: () => <div className="text-center text-sm whitespace-nowrap">입금 현황</div>,
        cell: info => (
          <div className="flex justify-center shrink-0 px-2">
            <StatusBadge status={info.getValue()} />
          </div>
        ),
        filterFn: "equals",
      }),

      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center text-sm whitespace-nowrap">상세</div>,
        cell: props => (
          <div className="flex justify-center shrink-0 px-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRowClick?.(props.row.original)}
              className="h-7 text-xs whitespace-nowrap"
            >
              <Info className="h-3 w-3 mr-1" />
              보기
            </Button>
          </div>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center text-sm whitespace-nowrap">액션</div>,
        cell: props => (
          <div className="shrink-0 px-2">
            <UnivGroupRetreatRegistrationTableActions
              row={props.row.original}
              retreatSlug={retreatSlug}
            />
          </div>
        ),
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
        cell: info => (
          <div className="flex justify-center shrink-0 px-2">
            <ShuttleBusStatusBadge hasRegistered={info.getValue()} />
          </div>
        ),
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
        cell: info => (
          <div
            className="text-center text-sm max-w-[200px] truncate px-2 shrink-0"
            title={info.getValue() || ""}
          >
            {info.getValue() || "-"}
          </div>
        ),
      }),

      columnHelper.display({
        id: "memoActions",
        header: () => <div className="text-center text-sm whitespace-nowrap">메모 관리</div>,
        cell: props => {
          const row = props.row.original;
          // 메모가 있으면 관리 불필요, 없으면서 입금 완료 상태면 작성 가능
          if (row.memo) {
            return <div className="text-center text-sm text-gray-600 whitespace-nowrap shrink-0 px-2">-</div>;
          }
          // 입금 완료 상태일 때만 작성 버튼 표시
          if (row.status === "PAID") {
            return (
              <div className="flex justify-center shrink-0 px-2">
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
                  className="h-7 text-xs whitespace-nowrap"
                >
                  작성
                </Button>
              </div>
            );
          }
          return <div className="text-center text-sm text-gray-400 whitespace-nowrap shrink-0 px-2">-</div>;
        },
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
        cell: props => {
          const row = props.row.original;
          return (
            <div className="shrink-0">
              <MemoEditor
                row={row}
                memoValue={row.staffMemo}
                onSave={async (id, memo) => {
                  await saveAdminMemo(id, memo);
                }}
                onUpdate={async (id, memo) => {
                  if (row.adminMemoId) {
                    await updateAdminMemo(row.adminMemoId, memo);
                  }
                }}
                onDelete={async () => {
                  if (row.adminMemoId) {
                    await deleteAdminMemo(row.adminMemoId);
                  }
                }}
                loading={isMutating}
                hasExistingMemo={(r) => !!r.staffMemo && !!r.adminMemoId}
              />
            </div>
          );
        },
      }),

      columnHelper.display({
        id: "qr",
        header: () => <div className="text-center text-sm whitespace-nowrap">QR</div>,
        cell: props => (
          <div className="flex justify-center shrink-0 px-2">
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
      }),
    ];

    return [...leftColumns, ...scheduleColumns, ...rightColumns];
  }, [schedules, retreatSlug, onRowClick, saveAdminMemo, updateAdminMemo, deleteAdminMemo, isMutating]);

  return columns;
}
