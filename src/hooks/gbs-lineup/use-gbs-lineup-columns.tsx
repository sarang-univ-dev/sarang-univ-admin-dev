/**
 * GBS 라인업 테이블 컬럼 정의
 *
 * TanStack Table Best Practice 적용:
 * - createColumnHelper로 타입 안전성 보장
 * - useMemo로 메모이제이션
 * - MemoEditor 컴포넌트 통합
 * - useGbsLineupManagement 함수들은 useCallback으로 안정화되어 있음
 */
import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { GbsLineupTableData } from "@/types/gbs-lineup";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useGbsLineupManagement } from "./use-gbs-lineup-management";

const columnHelper = createColumnHelper<GbsLineupTableData>();

interface UseGbsLineupColumnsProps {
  retreatSlug: string;
  onSelectLeaders: (gbsNumber: number) => void;
}

export function useGbsLineupColumns({
  retreatSlug,
  onSelectLeaders,
}: UseGbsLineupColumnsProps) {
  const {
    saveGbsMemo,
    updateGbsMemo,
    deleteGbsMemo,
    deleteGbsGroup,
    unassignLeaders,
  } = useGbsLineupManagement(retreatSlug);

  const columns = useMemo(
    () => [
      // GBS 번호
      columnHelper.accessor("number", {
        id: "number",
        header: () => <div className="text-center text-sm">GBS 번호</div>,
        cell: (info) => (
          <div className="font-mono text-center px-2 py-1">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
        size: 100,
      }),

      // 리더
      columnHelper.accessor("leaderNames", {
        id: "leaders",
        header: () => <div className="text-center text-sm">리더</div>,
        cell: (props) => {
          const row = props.row.original;
          return (
            <div className="flex items-center gap-2 px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectLeaders(row.number)}
                className="flex-1 justify-start h-auto p-2 min-h-[32px]"
              >
                {row.leaderNames || (
                  <span className="text-gray-400">리더 없음</span>
                )}
              </Button>
              {row.hasLeaders && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    unassignLeaders(row.id);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        },
        size: 250,
      }),

      // 메모
      columnHelper.display({
        id: "memo",
        header: () => <div className="text-center text-sm">메모</div>,
        cell: (props) => {
          const row = props.row.original;
          return (
            <MemoEditor
              row={{ id: String(row.number) }}
              memoValue={row.memo}
              onSave={async (id, memo) => {
                await saveGbsMemo(id, memo);
              }}
              onUpdate={async (id, memo) => {
                await updateGbsMemo(id, memo);
              }}
              onDelete={async (id) => {
                await deleteGbsMemo(id);
              }}
              hasExistingMemo={() => !!row.memo}
              maxLength={500}
            />
          );
        },
        size: 300,
      }),

      // 액션 (삭제)
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center text-sm">액션</div>,
        cell: (props) => (
          <div className="text-center px-2 py-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteGbsGroup(props.row.original.number)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        size: 80,
      }),
    ],
    [
      onSelectLeaders,
      saveGbsMemo,
      updateGbsMemo,
      deleteGbsMemo,
      deleteGbsGroup,
      unassignLeaders,
    ]
  );

  return columns;
}
