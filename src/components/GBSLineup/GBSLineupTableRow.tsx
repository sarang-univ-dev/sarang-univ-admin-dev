import React, { memo, useCallback } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Trash2, User, UserPlus, Shield, GraduationCap } from "lucide-react";
import { GenderBadge } from "@/components/Badge";
import { MEMO_COLORS, COMPLETE_GROUP_ROW_COUNT } from "@/lib/constant/lineup.constant";
import { OptimizedTextarea } from "./OptimizedTextarea";
import { GBSLineupRow } from "@/hooks/useGBSLineup";
import { UserRetreatRegistrationType } from "@/types";

interface GBSLineupTableRowProps {
  row: GBSLineupRow;
  groupSize: number;
  isFirstInGroup: boolean;
  scheduleColumns: Array<{
    key: string;
    label: string;
    bgColorClass: string;
  }>;
  
  // 편집 상태
  editingMemo: boolean;
  memoValue: string;
  gbsNumberInput: string;
  memoBgColor: string;
  editingScheduleMemo: boolean;
  scheduleMemoValue: string;

  // 로딩 상태
  isLoading: (id: string, action: string) => boolean;

  // 이벤트 핸들러
  onStartEditMemo: (id: string, currentMemo: string, currentColor?: string) => void;
  onCancelEditMemo: (id: string) => void;
  onSaveMemo: (id: string) => void;
  onDeleteMemo: (id: string) => void;
  onMemoValueChange: (id: string, value: string) => void;
  onMemoBgColorChange: (id: string, color: string) => void;
  onGbsNumberInputChange: (id: string, value: string) => void;
  onSaveGbsNumber: (row: GBSLineupRow & { inputValue?: string; enterKeyTime?: number }) => void;
  onStartEditScheduleMemo: (id: string, currentMemo: string) => void;
  onCancelEditScheduleMemo: (id: string) => void;
  onSaveScheduleMemo: (id: string) => void;
  onScheduleMemoValueChange: (id: string, value: string) => void;
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

export const GBSLineupTableRow = memo<GBSLineupTableRowProps>(({
  row,
  groupSize,
  isFirstInGroup,
  scheduleColumns,
  editingMemo,
  memoValue,
  gbsNumberInput,
  memoBgColor,
  editingScheduleMemo,
  scheduleMemoValue,
  isLoading,
  onStartEditMemo,
  onCancelEditMemo,
  onSaveMemo,
  onDeleteMemo,
  onMemoValueChange,
  onMemoBgColorChange,
  onGbsNumberInputChange,
  onSaveGbsNumber,
  onStartEditScheduleMemo,
  onCancelEditScheduleMemo,
  onSaveScheduleMemo,
  onScheduleMemoValueChange,
}) => {
  const handleGbsNumberKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // 실시간 input 값을 직접 전달하여 디바운싱 지연 문제 해결
      const inputValue = e.currentTarget.value;
      const enterKeyTime = performance.now();
      
      console.log('⌨️ 엔터키 입력:', {
        rowId: row.id,
        inputValue,
        timestamp: new Date().toISOString(),
        performanceTime: enterKeyTime
      });
      
      // 성능 측정을 위한 시작 시간을 함께 전달
      onSaveGbsNumber({ ...row, inputValue, enterKeyTime });
    }
  }, [onSaveGbsNumber, row]);

  const handleGbsNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onGbsNumberInputChange(row.id, e.target.value);
  }, [onGbsNumberInputChange, row.id]);

  const handleMemoClick = useCallback(() => {
    onStartEditMemo(row.id, row.lineupMemo, row.lineupMemocolor);
  }, [onStartEditMemo, row.id, row.lineupMemo, row.lineupMemocolor]);

  const handleScheduleMemoClick = useCallback(() => {
    if (!row.unresolvedLineupHistoryMemo?.trim()) {
      onStartEditScheduleMemo(row.id, row.unresolvedLineupHistoryMemo || "");
    }
  }, [onStartEditScheduleMemo, row.id, row.unresolvedLineupHistoryMemo]);

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
      <TableCell
        className={`text-center px-2 py-1 ${cellClassName}`}
        style={{ backgroundColor: row.lineupMemocolor }}
      >
        {editingMemo ? (
          <div className="flex flex-col gap-2 p-1">
            <OptimizedTextarea
              rowId={row.id}
              value={memoValue}
              onValueChange={onMemoValueChange}
              placeholder="메모를 입력하세요..."
              className={`text-sm resize-none overflow-hidden w-full ${
                row.memoError ? "border border-red-400" : "border border-gray-200"
              }`}
              disabled={isLoading(row.id, "memo")}
            />
            {/* 색상 선택 버튼들 */}
            <div className="flex flex-wrap gap-1">
              {MEMO_COLORS.map(color => {
                const isTransparentSelected = color === "transparent" && (memoBgColor === "" || memoBgColor === undefined);
                const isColorSelected = color !== "transparent" && memoBgColor === color;
                const isSelected = isTransparentSelected || isColorSelected;
                
                return (
                  <button
                    key={color}
                    style={{
                      backgroundColor: color === "transparent" ? "white" : color,
                      border: isSelected ? "2px solid black" : "1px solid #ccc",
                    }}
                    className={`w-5 h-5 rounded-full ${color === "transparent" ? "relative" : ""}`}
                    onClick={() => onMemoBgColorChange(row.id, color === "transparent" ? "" : color)}
                  >
                    {color === "transparent" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-red-500 rotate-45 absolute"></div>
                        <div className="w-3 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSaveMemo(row.id)}
                disabled={isLoading(row.id, "memo")}
                className="h-7 px-2"
              >
                {isLoading(row.id, "memo") ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancelEditMemo(row.id)}
                disabled={isLoading(row.id, "memo")}
                className="h-7 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-1">
            <div
              className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] whitespace-pre-wrap break-words"
              onClick={handleMemoClick}
            >
              {row.lineupMemo || "메모를 추가하려면 클릭하세요"}
            </div>
            {row.lineupMemo && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteMemo(row.id)}
                disabled={isLoading(row.id, "delete_memo")}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
              >
                {isLoading(row.id, "delete_memo") ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        )}
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
        {editingScheduleMemo ? (
          <div className="flex flex-col gap-2 p-2">
            <Textarea
              value={scheduleMemoValue}
              onChange={e => onScheduleMemoValueChange(row.id, e.target.value)}
              placeholder="일정 변동 메모를 입력하세요..."
              className="text-sm resize-none overflow-hidden w-full"
              style={{
                height: Math.max(60, Math.min(200, scheduleMemoValue.split("\n").length * 20 + 20)) + "px",
              }}
              disabled={isLoading(row.id, "schedule_memo")}
              rows={Math.max(3, Math.min(10, scheduleMemoValue.split("\n").length + 1))}
            />
            <div className="flex gap-1 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSaveScheduleMemo(row.id)}
                disabled={isLoading(row.id, "schedule_memo")}
                className="h-7 px-2"
              >
                {isLoading(row.id, "schedule_memo") ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancelEditScheduleMemo(row.id)}
                disabled={isLoading(row.id, "schedule_memo")}
                className="h-7 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-2">
            {row.unresolvedLineupHistoryMemo ? (
              <div className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                {row.unresolvedLineupHistoryMemo}
              </div>
            ) : (
              <div
                className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words"
                onClick={handleScheduleMemoClick}
              >
                일정 변동 메모를 추가하려면 클릭하세요
              </div>
            )}
          </div>
        )}
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

GBSLineupTableRow.displayName = 'GBSLineupTableRow'; 