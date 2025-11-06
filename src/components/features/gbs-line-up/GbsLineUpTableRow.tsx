import React, { memo, useCallback } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, UserPlus, Shield, GraduationCap } from "lucide-react";
import { GenderBadge } from "@/components/Badge";
import { MEMO_COLORS, COMPLETE_GROUP_ROW_COUNT } from "@/lib/constant/lineup.constant";
import { GBSLineupRow } from "@/hooks/gbs-line-up/use-gbs-lineup";
import { UserRetreatRegistrationType } from "@/types";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { LineUpMemoEditor } from "./LineUpMemoEditor";

interface GbsLineUpTableRowProps {
  row: GBSLineupRow;
  groupSize: number;
  isFirstInGroup: boolean;
  retreatSlug: string;
  scheduleColumns: Array<{
    key: string;
    label: string;
    bgColorClass: string;
  }>;

  // GBS 번호 관련
  gbsNumberInput: string;
  onGbsNumberInputChange: (id: string, value: string) => void;
  onSaveGbsNumber: (row: GBSLineupRow) => void;

  // 라인업 메모 핸들러
  onSaveLineupMemo: (id: string, memo: string, color?: string) => Promise<void>;
  onUpdateLineupMemo: (id: string, memo: string, color?: string) => Promise<void>;
  onDeleteLineupMemo: (id: string) => Promise<void>;

  // 일정 변동 메모 핸들러
  onSaveScheduleMemo: (id: string, memo: string) => Promise<void>;
  onUpdateScheduleMemo: (id: string, memo: string) => Promise<void>;
  onDeleteScheduleMemo: (id: string) => Promise<void>;

  // 로딩 상태
  isLoading: (id: string, action: string) => boolean;
}

// GBS line up 페이지에서만 사용하는 TypeBadge (새돌, SC, H 칩 포함)
const TypeBadgeWithFreshman = memo(({
  type,
  gradeNumber,
  lineupMemo
}: {
  type: UserRetreatRegistrationType | null;
  gradeNumber: number;
  lineupMemo?: string;
}) => {
  if (lineupMemo) {
    const lowerMemo = lineupMemo.toLowerCase();

    if (lowerMemo.includes('sc')) {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
          <User className="h-3.5 w-3.5 text-purple-500 mr-1.5" />
          <span className="text-xs font-medium text-purple-700">SC</span>
        </div>
      );
    }

    if (lowerMemo.includes('h')) {
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
});

TypeBadgeWithFreshman.displayName = 'TypeBadgeWithFreshman';

export const GbsLineUpTableRow = memo<GbsLineUpTableRowProps>(({
  row,
  groupSize,
  isFirstInGroup,
  retreatSlug,
  scheduleColumns,
  gbsNumberInput,
  onGbsNumberInputChange,
  onSaveGbsNumber,
  onSaveLineupMemo,
  onUpdateLineupMemo,
  onDeleteLineupMemo,
  onSaveScheduleMemo,
  onUpdateScheduleMemo,
  onDeleteScheduleMemo,
  isLoading,
}) => {
  const handleGbsNumberKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSaveGbsNumber(row);
    }
  }, [onSaveGbsNumber, row]);

  const handleGbsNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onGbsNumberInputChange(row.id, e.target.value);
  }, [onGbsNumberInputChange, row.id]);

  const cellClassName = row.isLeader ? "bg-cyan-200" : "";

  return (
    <TableRow>
      {/* GBS 번호, 전참/부분참, 남/여 - rowSpan 처리 */}
      {isFirstInGroup && row.gbsNumber && (
        <>
          <TableCell
            rowSpan={groupSize}
            className={`align-middle font-bold text-center px-2 py-1 ${
              groupSize > COMPLETE_GROUP_ROW_COUNT ? "bg-rose-200" : ""
            }`}
          >
            {row.gbsNumber}
          </TableCell>
          <TableCell
            rowSpan={groupSize}
            className="align-middle text-center font-semibold px-2 py-1"
          >
            전참 {row.fullAttendanceCount}<br/>부분참 {row.partialAttendanceCount}
          </TableCell>
          <TableCell
            rowSpan={groupSize}
            className="align-middle text-center font-semibold px-2 py-1"
          >
            남 {row.maleCount}<br/>여 {row.femaleCount}
          </TableCell>
        </>
      )}

      {/* GBS 번호가 없는 경우 빈 셀 3개 */}
      {!row.gbsNumber && (
        <>
          <TableCell className="text-center px-2 py-1" />
          <TableCell className="text-center px-2 py-1" />
          <TableCell className="text-center px-2 py-1" />
        </>
      )}

      {/* 부서 */}
      <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
        {row.department}
      </TableCell>

      {/* 성별 */}
      <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
        <GenderBadge gender={row.gender} />
      </TableCell>

      {/* 학년 */}
      <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
        {row.grade}
      </TableCell>

      {/* 이름 */}
      <TableCell className={`text-center px-2 py-1 ${cellClassName} ${row.isLeader ? "font-bold text-base" : ""}`}>
        {row.name}
      </TableCell>

      {/* 부서 리더명 */}
      <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
        {row.currentLeader}
      </TableCell>

      {/* 전화번호 */}
      <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
        {row.phoneNumber}
      </TableCell>

      {/* 라인업 메모 */}
      <TableCell className={`px-2 py-1 ${cellClassName}`}>
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

      {/* 타입 */}
      <TableCell className={`group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1 ${cellClassName}`}>
        <TypeBadgeWithFreshman
          type={row.type}
          gradeNumber={parseInt(row.grade.split('학년')[0])}
          lineupMemo={row.lineupMemo}
        />
      </TableCell>

      {/* 스케줄 체크박스들 */}
      {scheduleColumns.map(col => (
        <TableCell
          key={`${row.id}-${col.key}`}
          className={`px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap ${cellClassName}`}
        >
          <Checkbox
            checked={row.schedule[col.key]}
            disabled
            className={row.schedule[col.key] ? col.bgColorClass : ""}
          />
        </TableCell>
      ))}

      {/* GBS 배정하기 */}
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
              (gbsNumberInput || row.gbsNumber)
                ? "border border-blue-400 font-bold bg-blue-50"
                : "border border-gray-300 bg-white font-normal text-gray-700"
            }`}
            onClick={e => e.currentTarget.select()}
            onChange={handleGbsNumberChange}
            placeholder="gbs 번호 입력후 엔터"
            onKeyDown={handleGbsNumberKeyDown}
          />
        )}
      </TableCell>

      {/* GBS 메모 - rowSpan 처리 */}
      {isFirstInGroup && row.gbsNumber && (
        <TableCell
          rowSpan={groupSize}
          className="align-middle text-center px-2 py-1"
        >
          {row.gbsMemo}
        </TableCell>
      )}

      {/* GBS 번호가 없는 경우 빈 셀 */}
      {!row.gbsNumber && (
        <TableCell className="text-center px-2 py-1" />
      )}

      {/* 라인업 일정변동 요청 */}
      <TableCell className={`align-middle px-2 py-1 ${row.unresolvedLineupHistoryMemo ? "bg-yellow-100" : ""}`}>
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

      {/* 행정간사 메모 */}
      <TableCell className="align-middle text-center px-2 py-1">
        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {row.adminMemo || ""}
        </div>
      </TableCell>
    </TableRow>
  );
});

GbsLineUpTableRow.displayName = 'GbsLineUpTableRow';
