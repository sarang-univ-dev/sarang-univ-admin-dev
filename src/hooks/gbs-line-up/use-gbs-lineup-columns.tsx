import { useMemo, useState, useEffect, useRef } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { GenderBadge } from "@/components/Badge";
import { TRetreatRegistrationSchedule, RetreatRegistrationScheduleType } from "@/types";
import { GBSLineupRow } from "./use-gbs-lineup";
import { MEMO_COLORS, COMPLETE_GROUP_ROW_COUNT } from "@/lib/constant/lineup.constant";
import { LineUpMemoEditor } from "@/components/features/gbs-line-up/LineUpMemoEditor";
import { GbsNumberCell, GbsNumberCellRow } from "@/components/features/gbs-line-up/GbsNumberCell";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { UserRetreatRegistrationType } from "@/types";
import { User, UserPlus, Shield, GraduationCap, Info } from "lucide-react";
import { ColumnHeader } from "@/components/common/table/ColumnHeader";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<GBSLineupRow>();

/**
 * rowSpan 헬퍼 함수
 * 같은 GBS 번호를 가진 행들의 그룹 정보를 계산
 */
function getGroupInfo(row: GBSLineupRow, allRows: GBSLineupRow[]) {
  if (!row.gbsNumber) {
    return { isFirstInGroup: false, groupSize: 0 };
  }

  const gbsNumber = row.gbsNumber;
  const groupRows = allRows.filter(r => r.gbsNumber === gbsNumber);
  const rowIndex = groupRows.findIndex(r => r.id === row.id);

  return {
    isFirstInGroup: rowIndex === 0,
    groupSize: groupRows.length,
  };
}

/**
 * TypeBadge 컴포넌트 (새돌, SC, H 칩 포함)
 */
function TypeBadgeWithFreshman({
  type,
  gradeNumber,
  lineupMemo,
}: {
  type: UserRetreatRegistrationType | null;
  gradeNumber: number;
  lineupMemo?: string;
}) {
  if (lineupMemo) {
    const lowerMemo = lineupMemo.toLowerCase();

    if (lowerMemo.includes("sc")) {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
          <User className="h-3.5 w-3.5 text-purple-500 mr-1.5" />
          <span className="text-xs font-medium text-purple-700">SC</span>
        </div>
      );
    }

    if (lowerMemo.includes("h")) {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
          <User className="h-3.5 w-3.5 text-green-500 mr-1.5" />
          <span className="text-xs font-medium text-green-700">H</span>
        </div>
      );
    }
  }

  if (type) {
    switch (type) {
      case UserRetreatRegistrationType.NEW_COMER:
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
            <UserPlus className="h-3.5 w-3.5 text-pink-500 mr-1.5" />
            <span className="text-xs font-medium text-pink-700">새가족</span>
          </div>
        );
      case UserRetreatRegistrationType.SOLDIER:
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
            <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5" />
            <span className="text-xs font-medium text-indigo-700">군지체</span>
          </div>
        );
      case UserRetreatRegistrationType.STAFF:
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
            <User className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
            <span className="text-xs font-medium text-gray-700">간사</span>
          </div>
        );
      default:
        return <span>{type}</span>;
    }
  }

  if (gradeNumber === 1) {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200">
        <GraduationCap className="h-3.5 w-3.5 text-orange-500 mr-1.5" />
        <span className="text-xs font-medium text-orange-700">새돌</span>
      </div>
    );
  }

  return <span>-</span>;
}

// ✅ GbsNumberCell 컴포넌트는 별도 파일로 분리됨

/**
 * GBS Line-Up 테이블 컬럼 정의
 */
export function useGbsLineupColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  allRows: GBSLineupRow[],
  handlers: {
    onSaveGbsNumber: (row: GBSLineupRow, value: string) => Promise<void>;
    onSaveLineupMemo: (id: string, memo: string, color?: string) => Promise<void>;
    onUpdateLineupMemo: (id: string, memo: string, color?: string) => Promise<void>;
    onDeleteLineupMemo: (id: string) => Promise<void>;
    onSaveScheduleMemo: (id: string, memo: string) => Promise<void>;
    onUpdateScheduleMemo: (id: string, memo: string) => Promise<void>;
    onDeleteScheduleMemo: (id: string) => Promise<void>;
    isLoading: (id: string, action: string) => boolean;
  },
  onRowClick?: (row: GBSLineupRow) => void
) {
  return useMemo(() => {
    const {
      onSaveGbsNumber,
      onSaveLineupMemo,
      onUpdateLineupMemo,
      onDeleteLineupMemo,
      onSaveScheduleMemo,
      onUpdateScheduleMemo,
      onDeleteScheduleMemo,
      isLoading,
    } = handlers;

    return [
      // ✅ GBS 번호 (리더 행에만 표시, rowSpan 제거)
      columnHelper.accessor("gbsNumber", {
        id: "gbsNumber",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="GBS 번호"
            enableFiltering
            enableSorting
            formatFilterValue={(value) => (value === null ? "미배정" : `${value}`)}
          />
        ),
        cell: (info) => {
          const row = info.row.original;

          // ✅ 리더가 아니면 빈 셀
          if (!row.isLeader) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          // ✅ GBS 번호가 없으면 빈 셀
          if (!row.gbsNumber) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          const { groupSize } = getGroupInfo(row, allRows);
          const isOverCapacity = groupSize > COMPLETE_GROUP_ROW_COUNT;

          return (
            <div className={`font-bold text-center px-2 py-1 whitespace-nowrap ${isOverCapacity ? "text-red-600" : ""}`}>
              {row.gbsNumber}
            </div>
          );
        },
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId);
          if (filterValue.includes("미배정")) {
            return value === null;
          }
          return filterValue.includes(String(value));
        },
        /**
         * 복잡한 다단계 정렬 로직
         *
         * 정렬 우선순위:
         * 1. GBS 번호 오름차순 (null은 맨 뒤로)
         * 2. 같은 GBS 그룹 내에서 리더가 먼저
         * 3. 학년 내림차순 (4학년 → 1학년)
         * 4. 이름 오름차순 (가나다순)
         *
         * @see https://tanstack.com/table/v8/docs/guide/sorting
         */
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.original;
          const b = rowB.original;

          // 1. GBS 번호 비교 (null은 맨 뒤로)
          if (a.gbsNumber === null && b.gbsNumber !== null) return 1;
          if (a.gbsNumber !== null && b.gbsNumber === null) return -1;
          if (a.gbsNumber !== b.gbsNumber) {
            return (a.gbsNumber || 0) - (b.gbsNumber || 0);
          }

          // 2. 같은 GBS 그룹 내에서 리더가 먼저
          if (a.isLeader && !b.isLeader) return -1;
          if (!a.isLeader && b.isLeader) return 1;

          // 3. 학년 내림차순 (숫자가 큰 학년이 먼저)
          const gradeA = parseInt(a.grade.replace('학년', '')) || 0;
          const gradeB = parseInt(b.grade.replace('학년', '')) || 0;
          if (gradeA !== gradeB) {
            return gradeB - gradeA; // 내림차순: 4학년 → 1학년
          }

          // 4. 이름 오름차순 (가나다순)
          return a.name.localeCompare(b.name, 'ko-KR');
        },
      }),

      // ✅ 전참 (리더 행에만 표시, 필터링만 가능)
      columnHelper.accessor("fullAttendanceCount", {
        id: "fullAttendanceCount",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="전참"
            enableFiltering
            formatFilterValue={(value) => `${value}명`}
          />
        ),
        cell: (info) => {
          const row = info.row.original;

          // ✅ 리더가 아니면 빈 셀
          if (!row.isLeader) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          if (!row.gbsNumber) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          const { groupSize } = getGroupInfo(row, allRows);
          const isOverCapacity = groupSize > COMPLETE_GROUP_ROW_COUNT;

          return (
            <div className={`text-center font-semibold px-2 py-1 whitespace-nowrap ${isOverCapacity ? "text-red-600" : ""}`}>
              {row.fullAttendanceCount || ""}
            </div>
          );
        },
        // 숫자 필터링 (정확히 일치하는 값만 표시)
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number;
          return filterValue.includes(String(value));
        },
      }),

      // ✅ 부분참 (리더 행에만 표시, 필터링만 가능)
      columnHelper.accessor("partialAttendanceCount", {
        id: "partialAttendanceCount",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="부분참"
            enableFiltering
            formatFilterValue={(value) => `${value}명`}
          />
        ),
        cell: (info) => {
          const row = info.row.original;

          // ✅ 리더가 아니면 빈 셀
          if (!row.isLeader) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          if (!row.gbsNumber) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          const { groupSize } = getGroupInfo(row, allRows);
          const isOverCapacity = groupSize > COMPLETE_GROUP_ROW_COUNT;

          return (
            <div className={`text-center font-semibold px-2 py-1 whitespace-nowrap ${isOverCapacity ? "text-red-600" : ""}`}>
              {row.partialAttendanceCount || ""}
            </div>
          );
        },
        // 숫자 필터링
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number;
          return filterValue.includes(String(value));
        },
      }),

      // ✅ 남 (리더 행에만 표시, 필터링만 가능)
      columnHelper.accessor("maleCount", {
        id: "maleCount",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="남"
            enableFiltering
            formatFilterValue={(value) => `${value}명`}
          />
        ),
        cell: (info) => {
          const row = info.row.original;

          // ✅ 리더가 아니면 빈 셀
          if (!row.isLeader) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          if (!row.gbsNumber) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          const { groupSize } = getGroupInfo(row, allRows);
          const isOverCapacity = groupSize > COMPLETE_GROUP_ROW_COUNT;

          return (
            <div className={`text-center font-semibold px-2 py-1 whitespace-nowrap ${isOverCapacity ? "text-red-600" : ""}`}>
              {row.maleCount || ""}
            </div>
          );
        },
        // 숫자 필터링
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number;
          return filterValue.includes(String(value));
        },
      }),

      // ✅ 여 (리더 행에만 표시, 필터링만 가능)
      columnHelper.accessor("femaleCount", {
        id: "femaleCount",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="여"
            enableFiltering
            formatFilterValue={(value) => `${value}명`}
          />
        ),
        cell: (info) => {
          const row = info.row.original;

          // ✅ 리더가 아니면 빈 셀
          if (!row.isLeader) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          if (!row.gbsNumber) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          const { groupSize } = getGroupInfo(row, allRows);
          const isOverCapacity = groupSize > COMPLETE_GROUP_ROW_COUNT;

          return (
            <div className={`text-center font-semibold px-2 py-1 whitespace-nowrap ${isOverCapacity ? "text-red-600" : ""}`}>
              {row.femaleCount || ""}
            </div>
          );
        },
        // 숫자 필터링
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId) as number;
          return filterValue.includes(String(value));
        },
      }),

      // 부서
      columnHelper.accessor("department", {
        id: "department",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="부서"
            enableFiltering
            enableSorting
          />
        ),
        cell: (info) => {
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {info.getValue()}
            </div>
          );
        },
        filterFn: "arrIncludesSome",
        // 숫자 정렬 (1부, 2부, 10부 순서로)
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string;
          const b = rowB.getValue(columnId) as string;
          const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
          const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
          return numA - numB;
        },
      }),

      // 성별
      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <ColumnHeader column={column} table={table} title="성별" enableFiltering />
        ),
        cell: (info) => {
          return (
            <div className="flex justify-center px-2 py-1 whitespace-nowrap">
              <GenderBadge gender={info.getValue()} />
            </div>
          );
        },
        filterFn: "arrIncludesSome",
      }),

      // 학년
      columnHelper.accessor("grade", {
        id: "grade",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="학년"
            enableFiltering
            enableSorting
          />
        ),
        cell: (info) => {
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {info.getValue()}
            </div>
          );
        },
        filterFn: "arrIncludesSome",
        // 숫자 정렬 (1학년, 2학년, 3학년 순서로)
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string;
          const b = rowB.getValue(columnId) as string;
          const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
          const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
          return numA - numB;
        },
      }),

      // 이름
      columnHelper.accessor("name", {
        id: "name",
        header: "이름",
        cell: (info) => {
          const row = info.row.original;
          const nameClassName = row.isLeader ? "font-bold text-base" : "";
          return (
            <div className={`text-center px-2 py-1 whitespace-nowrap ${nameClassName}`}>
              {info.getValue()}
            </div>
          );
        },
      }),

      // 부서 리더명
      columnHelper.accessor("currentLeader", {
        id: "currentLeader",
        header: "부서 리더명",
        cell: (info) => {
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {info.getValue()}
            </div>
          );
        },
      }),

      // 전화번호
      columnHelper.accessor("phoneNumber", {
        id: "phoneNumber",
        header: "전화번호",
        cell: (info) => {
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {info.getValue()}
            </div>
          );
        },
      }),

      // 라인업 메모 (✅ V2: 버퍼링 + Debounce 지원)
      columnHelper.accessor(
        (row) => `${row.lineupMemo}__${row.lineupMemocolor}__${row.lineupMemoId}`,
        {
          id: "lineupMemo",
          header: "라인업 메모",
          cell: (info) => {
            const row = info.row.original;

            return (
              <div className="relative px-2 py-1 whitespace-nowrap">
                <LineUpMemoEditor
                  row={row}
                  memoValue={row.lineupMemo}
                  memoColor={row.lineupMemocolor}
                  onSave={onSaveLineupMemo}
                  onUpdate={onUpdateLineupMemo}
                  onDelete={onDeleteLineupMemo}
                  loading={isLoading(row.id, "lineup_memo")}
                  placeholder="메모를 입력하세요..."
                  hasExistingMemo={(r) => !!r.lineupMemoId}
                  colors={MEMO_COLORS}
                />
              </div>
            );
          },
        }
      ),

      // 타입
      columnHelper.display({
        id: "type",
        header: "타입",
        cell: (info) => {
          const row = info.row.original;
          const gradeNumber = parseInt(row.grade.split("학년")[0]);
          return (
            <div className="text-center whitespace-nowrap px-2 py-1">
              <TypeBadgeWithFreshman
                type={row.type}
                gradeNumber={gradeNumber}
                lineupMemo={row.lineupMemo}
              />
            </div>
          );
        },
      }),

      // 스케줄 동적 컬럼들 (날짜별로 다른 색상)
      ...(() => {
        const scheduleColumnsMeta = generateScheduleColumns(schedules);
        return scheduleColumnsMeta.map((col) =>
          columnHelper.display({
            id: col.key,
            header: col.label,
            cell: (info) => {
              const row = info.row.original;
              const isChecked = row.schedule[col.key];
              return (
                <div className="px-2 py-1 text-center whitespace-nowrap">
                  <Checkbox
                    checked={isChecked}
                    disabled
                    className={col.bgColorClass}
                  />
                </div>
              );
            },
          })
        );
      })(),

      // GBS 배정하기 (✅ V2: 버퍼링 + Debounce 지원)
      // ✅ accessor를 isLeader 기반으로 변경: 리더/조원 필터링 지원
      columnHelper.accessor(
        (row) => row.isLeader ? "리더" : "조원",
        {
          id: "gbsAssign",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="GBS 배정하기"
              enableFiltering
            />
          ),
          cell: (info) => {
            const row = info.row.original;

            return (
              <div className="align-middle text-center px-2 py-1 whitespace-nowrap">
                {row.isLeader ? (
                  <span className="inline-block w-36 text-center py-1 font-semibold rounded bg-gray-100 text-gray-800 border border-gray-400 text-base tracking-wide">
                    리더
                  </span>
                ) : (
                  <GbsNumberCell
                    row={row}
                    onSave={(cellRow, value) => onSaveGbsNumber(row, value)}
                    isLoading={isLoading(row.id, "gbs_number")}
                  />
                )}
              </div>
            );
          },
          filterFn: "arrIncludesSome",
        }
      ),

      // GBS 메모 (같은 GBS 그룹의 모든 행에 동일한 내용 표시)
      columnHelper.accessor("gbsMemo", {
        id: "gbsMemo",
        header: "GBS 메모",
        cell: (info) => {
          const row = info.row.original;

          // GBS 번호가 없으면 빈 셀
          if (!row.gbsNumber) {
            return <div className="text-center px-2 py-1 whitespace-nowrap"></div>;
          }

          // 같은 GBS 그룹의 리더 행 찾기
          const leaderRow = allRows.find(
            r => r.gbsNumber === row.gbsNumber && r.isLeader
          );

          // 리더 행의 GBS 메모를 표시 (없으면 현재 행의 메모)
          const memoContent = leaderRow?.gbsMemo || row.gbsMemo || "-";

          return (
            <div className="align-middle text-center px-2 py-1 whitespace-nowrap">
              {memoContent}
            </div>
          );
        },
      }),

      // 상세 보기 버튼
      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center text-sm whitespace-nowrap">상세</div>,
        cell: (props) => (
          <div
            className="text-center px-2 py-1 whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRowClick?.(props.row.original)}
              className="h-8 px-3 whitespace-nowrap"
            >
              <Info className="h-4 w-4 mr-1" />
              보기
            </Button>
          </div>
        ),
      }),
    ];
  }, [schedules, allRows, handlers, onRowClick]);
}
