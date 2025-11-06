import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { GenderBadge } from "@/components/Badge";
import { TRetreatRegistrationSchedule } from "@/types";
import { GBSLineupRow } from "./use-gbs-lineup";
import { MEMO_COLORS, COMPLETE_GROUP_ROW_COUNT } from "@/lib/constant/lineup.constant";
import { LineUpMemoEditor } from "@/components/features/gbs-line-up/LineUpMemoEditor";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { UserRetreatRegistrationType } from "@/types";
import { User, UserPlus, Shield, GraduationCap } from "lucide-react";
import { ColumnHeader } from "@/components/common/table/ColumnHeader";

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

/**
 * GBS Line-Up 테이블 컬럼 정의
 */
export function useGbsLineupColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  allRows: GBSLineupRow[],
  handlers: {
    onSaveGbsNumber: (row: GBSLineupRow, value: string) => void;
    onSaveLineupMemo: (id: string, memo: string, color?: string) => Promise<void>;
    onUpdateLineupMemo: (id: string, memo: string, color?: string) => Promise<void>;
    onDeleteLineupMemo: (id: string) => Promise<void>;
    onSaveScheduleMemo: (id: string, memo: string) => Promise<void>;
    onUpdateScheduleMemo: (id: string, memo: string) => Promise<void>;
    onDeleteScheduleMemo: (id: string) => Promise<void>;
    isLoading: (id: string, action: string) => boolean;
  }
) {
  return useMemo<ColumnDef<GBSLineupRow>[]>(() => {
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
      // GBS 번호 (rowSpan)
      columnHelper.accessor("gbsNumber", {
        id: "gbsNumber",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title={
              <>
                GBS
                <br />
                번호
              </>
            }
            enableFiltering
            formatFilterValue={(value) => (value === null ? "미배정" : `${value}`)}
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          const { isFirstInGroup, groupSize } = getGroupInfo(row, allRows);

          if (!row.gbsNumber) {
            return <TableCell className="text-center px-2 py-1" />;
          }

          if (!isFirstInGroup) {
            return null; // rowSpan으로 이미 표시됨
          }

          return (
            <TableCell
              rowSpan={groupSize}
              className={`align-middle font-bold text-center px-2 py-1 ${
                groupSize > COMPLETE_GROUP_ROW_COUNT ? "bg-rose-200" : ""
              }`}
            >
              {row.gbsNumber}
            </TableCell>
          );
        },
        filterFn: (row, columnId, filterValue) => {
          const value = row.getValue(columnId);
          if (filterValue.includes("미배정")) {
            return value === null;
          }
          return filterValue.includes(String(value));
        },
      }),

      // 전참/부분참 (rowSpan)
      columnHelper.display({
        id: "attendance",
        header: "전참/부분참",
        cell: (info) => {
          const row = info.row.original;
          const { isFirstInGroup, groupSize } = getGroupInfo(row, allRows);

          if (!row.gbsNumber) {
            return <TableCell className="text-center px-2 py-1" />;
          }

          if (!isFirstInGroup) {
            return null;
          }

          return (
            <TableCell
              rowSpan={groupSize}
              className="align-middle text-center font-semibold px-2 py-1"
            >
              전참 {row.fullAttendanceCount}
              <br />
              부분참 {row.partialAttendanceCount}
            </TableCell>
          );
        },
      }),

      // 남/여 (rowSpan)
      columnHelper.display({
        id: "genderCount",
        header: "남/여",
        cell: (info) => {
          const row = info.row.original;
          const { isFirstInGroup, groupSize } = getGroupInfo(row, allRows);

          if (!row.gbsNumber) {
            return <TableCell className="text-center px-2 py-1" />;
          }

          if (!isFirstInGroup) {
            return null;
          }

          return (
            <TableCell
              rowSpan={groupSize}
              className="align-middle text-center font-semibold px-2 py-1"
            >
              남 {row.maleCount}
              <br />여 {row.femaleCount}
            </TableCell>
          );
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
          />
        ),
        cell: (info) => {
          const cellClassName = info.row.original.isLeader ? "bg-cyan-200" : "";
          return (
            <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
              {info.getValue()}
            </TableCell>
          );
        },
        filterFn: "arrIncludesSome",
      }),

      // 성별
      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <ColumnHeader column={column} table={table} title="성별" enableFiltering />
        ),
        cell: (info) => {
          const cellClassName = info.row.original.isLeader ? "bg-cyan-200" : "";
          return (
            <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
              <GenderBadge gender={info.getValue()} />
            </TableCell>
          );
        },
        filterFn: "arrIncludesSome",
      }),

      // 학년
      columnHelper.accessor("grade", {
        id: "grade",
        header: ({ column, table }) => (
          <ColumnHeader column={column} table={table} title="학년" enableFiltering />
        ),
        cell: (info) => {
          const cellClassName = info.row.original.isLeader ? "bg-cyan-200" : "";
          return (
            <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
              {info.getValue()}
            </TableCell>
          );
        },
        filterFn: "arrIncludesSome",
      }),

      // 이름
      columnHelper.accessor("name", {
        id: "name",
        header: ({ column, table }) => (
          <ColumnHeader column={column} table={table} title="이름" enableSorting />
        ),
        cell: (info) => {
          const row = info.row.original;
          const cellClassName = row.isLeader ? "bg-cyan-200" : "";
          const nameClassName = row.isLeader ? "font-bold text-base" : "";
          return (
            <TableCell className={`text-center px-2 py-1 ${cellClassName} ${nameClassName}`}>
              {info.getValue()}
            </TableCell>
          );
        },
      }),

      // 부서 리더명
      columnHelper.accessor("currentLeader", {
        id: "currentLeader",
        header: "부서 리더명",
        cell: (info) => {
          const cellClassName = info.row.original.isLeader ? "bg-cyan-200" : "";
          return (
            <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
              {info.getValue()}
            </TableCell>
          );
        },
      }),

      // 전화번호
      columnHelper.accessor("phoneNumber", {
        id: "phoneNumber",
        header: "전화번호",
        cell: (info) => {
          const cellClassName = info.row.original.isLeader ? "bg-cyan-200" : "";
          return (
            <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
              {info.getValue()}
            </TableCell>
          );
        },
      }),

      // 라인업 메모
      columnHelper.display({
        id: "lineupMemo",
        header: "라인업 메모",
        cell: (info) => {
          const row = info.row.original;
          const cellClassName = row.isLeader ? "bg-cyan-200" : "";
          return (
            <TableCell className={`relative px-2 py-1 ${cellClassName}`}>
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
            </TableCell>
          );
        },
      }),

      // 타입
      columnHelper.display({
        id: "type",
        header: "타입",
        cell: (info) => {
          const row = info.row.original;
          const cellClassName = row.isLeader ? "bg-cyan-200" : "";
          const gradeNumber = parseInt(row.grade.split("학년")[0]);
          return (
            <TableCell
              className={`group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1 ${cellClassName}`}
            >
              <TypeBadgeWithFreshman
                type={row.type}
                gradeNumber={gradeNumber}
                lineupMemo={row.lineupMemo}
              />
            </TableCell>
          );
        },
      }),

      // 스케줄 동적 컬럼들
      ...schedules.map((schedule) =>
        columnHelper.display({
          id: `schedule_${schedule.id}`,
          header: schedule.name,
          cell: (info) => {
            const row = info.row.original;
            const cellClassName = row.isLeader ? "bg-cyan-200" : "";
            const isChecked = row.schedule[`schedule_${schedule.id}`];
            return (
              <TableCell
                className={`px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap ${cellClassName}`}
              >
                <Checkbox
                  checked={isChecked}
                  disabled
                  className={isChecked ? "bg-blue-500" : ""}
                />
              </TableCell>
            );
          },
        })
      ),

      // GBS 배정하기
      columnHelper.display({
        id: "gbsAssign",
        header: "GBS 배정하기",
        cell: (info) => {
          const row = info.row.original;
          const cellClassName = row.isLeader ? "bg-cyan-200" : "";

          return (
            <TableCell className={`align-middle text-center px-2 py-1 ${cellClassName}`}>
              {row.isLeader ? (
                <span className="inline-block w-36 text-center py-1 font-semibold rounded bg-gray-100 text-gray-800 border border-gray-400 text-base tracking-wide">
                  리더
                </span>
              ) : (
                <input
                  type="text"
                  defaultValue={row.gbsNumber || ""}
                  className={`rounded px-2 py-1 text-center w-36 transition-all ${
                    row.gbsNumber
                      ? "border border-blue-400 font-bold bg-blue-50"
                      : "border border-gray-300 bg-white font-normal text-gray-700"
                  }`}
                  onClick={(e) => e.currentTarget.select()}
                  onChange={(e) => {
                    // 엔터 처리는 onKeyDown에서
                  }}
                  placeholder="gbs 번호 입력후 엔터"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = e.currentTarget.value;
                      onSaveGbsNumber(row, value);
                    }
                  }}
                />
              )}
            </TableCell>
          );
        },
      }),

      // GBS 메모 (rowSpan)
      columnHelper.accessor("gbsMemo", {
        id: "gbsMemo",
        header: "GBS 메모",
        cell: (info) => {
          const row = info.row.original;
          const { isFirstInGroup, groupSize } = getGroupInfo(row, allRows);

          if (!row.gbsNumber) {
            return <TableCell className="text-center px-2 py-1" />;
          }

          if (!isFirstInGroup) {
            return null;
          }

          return (
            <TableCell
              rowSpan={groupSize}
              className="align-middle text-center px-2 py-1"
            >
              {row.gbsMemo}
            </TableCell>
          );
        },
      }),

      // 라인업 일정변동 요청
      columnHelper.display({
        id: "scheduleMemo",
        header: (
          <>
            라인업
            <br />
            일정변동 요청
          </>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <TableCell
              className={`align-middle px-2 py-1 ${
                row.unresolvedLineupHistoryMemo ? "bg-yellow-100" : ""
              }`}
            >
              <MemoEditor
                row={row}
                memoValue={row.unresolvedLineupHistoryMemo}
                onSave={onSaveScheduleMemo}
                onUpdate={onUpdateScheduleMemo}
                onDelete={onDeleteScheduleMemo}
                loading={isLoading(row.id, "schedule_memo")}
                placeholder="일정 변동 메모를 입력하세요..."
              />
            </TableCell>
          );
        },
      }),

      // 행정간사 메모
      columnHelper.accessor("adminMemo", {
        id: "adminMemo",
        header: (
          <>
            행정간사
            <br />
            메모
          </>
        ),
        cell: (info) => (
          <TableCell className="align-middle text-center px-2 py-1">
            <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {info.getValue() || ""}
            </div>
          </TableCell>
        ),
      }),
    ];
  }, [schedules, allRows, handlers]);
}
