"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Save, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GenderBadge } from "@/components/Badge";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { COMPLETE_GROUP_ROW_COUNT } from "@/lib/constant/lineup.constant";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import { Gender } from "@/types";
import {
  useDormitoryTeamMemberRegistrations,
  IDormitoryTeamMemberRegistration,
  useScheduleChangeRequestMemo,
} from "@/hooks/use-dormitory-team-member";

// Simple debounce hook
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

interface DormitoryTableRowData {
  id: number;
  gbsNumber: number | null | undefined;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  schedule: Record<string, boolean>;
  dormitoryName: string;
  dormitoryTeamMemberMemo: string | null;
  isLeader: boolean;
}

interface DormitoryTableRowProps {
  row: DormitoryTableRowData;
  isFirstInGroup: boolean;
  groupSize: number;
  scheduleColumns: { key: string; label: string; bgColorClass: string }[];
  editingMemo: Record<number, boolean>;
  memoValues: Record<number, string>;
  isMemoLoading: (id: number, action: string) => boolean;
  handleStartEditMemo: (id: number) => void;
  setMemoValues: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleSaveMemo: (id: number) => Promise<void>;
  handleCancelEditMemo: (id: number) => void;
  columnWidths: string[];
}

const DormitoryTableRow = React.memo<DormitoryTableRowProps>(
  ({
    row,
    isFirstInGroup,
    groupSize,
    scheduleColumns,
    editingMemo,
    memoValues,
    isMemoLoading,
    handleStartEditMemo,
    setMemoValues,
    handleSaveMemo,
    handleCancelEditMemo,
    columnWidths,
  }) => {
    const cellClassName = row.isLeader ? "bg-cyan-200" : "";

    return (
      <TableRow>
        {/* GBS 번호 cell */}
        <TableCell
          style={{ width: columnWidths[0] }}
          className={`text-center px-2 py-1 ${cellClassName} ${
            isFirstInGroup ? "font-bold" : ""
          }`}
        >
          {isFirstInGroup && row.gbsNumber != null ? row.gbsNumber : ""}
        </TableCell>

        {/* Department */}
        <TableCell
          style={{ width: columnWidths[1] }}
          className={`text-center px-2 py-1 ${cellClassName}`}
        >
          {row.department}
        </TableCell>

        {/* Gender */}
        <TableCell
          style={{ width: columnWidths[2] }}
          className={`text-center px-2 py-1 ${cellClassName}`}
        >
          <GenderBadge gender={row.gender} />
        </TableCell>

        {/* Grade */}
        <TableCell
          style={{ width: columnWidths[3] }}
          className={`text-center px-2 py-1 ${cellClassName}`}
        >
          {row.grade}
        </TableCell>

        {/* Name */}
        <TableCell
          style={{ width: columnWidths[4] }}
          className={`text-center px-2 py-1 ${cellClassName} ${
            row.isLeader ? "font-bold text-base" : ""
          }`}
        >
          {row.name}
        </TableCell>

        {/* Schedule checkboxes */}
        {scheduleColumns.map((col, i) => (
          <TableCell
            key={`${row.id}-${col.key}`}
            style={{ width: columnWidths[5 + i] }}
            className={`px-2 py-1 text-center whitespace-nowrap ${cellClassName}`}
          >
            <Checkbox
              checked={row.schedule[col.key]}
              disabled
              className={row.schedule[col.key] ? col.bgColorClass : ""}
            />
          </TableCell>
        ))}

        {/* Dormitory */}
        <TableCell
          style={{ width: columnWidths[5 + scheduleColumns.length] }}
          className={`text-center px-2 py-1 ${cellClassName}`}
        >
          {row.dormitoryName || "-"}
        </TableCell>

        {/* Memo */}
        <TableCell
          style={{ width: columnWidths[5 + scheduleColumns.length + 1] }}
          className={`text-left px-2 py-1 ${cellClassName}`}
        >
          {editingMemo[row.id] ? (
            <div className="flex flex-col gap-2 p-2">
              <Textarea
                value={memoValues[row.id] || ""}
                onChange={e =>
                  setMemoValues(prev => ({
                    ...prev,
                    [row.id]: e.target.value,
                  }))
                }
                placeholder="일정변동 요청 메모를 입력하세요..."
                className="text-sm resize-none overflow-hidden w-full"
                style={{
                  height:
                    Math.max(
                      60,
                      Math.min(
                        200,
                        (memoValues[row.id] || "").split("\n").length * 20 + 20
                      )
                    ) + "px",
                }}
                disabled={isMemoLoading(row.id, "memo")}
              />
              <div className="flex gap-1 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveMemo(row.id)}
                  disabled={isMemoLoading(row.id, "memo")}
                  className="h-7 px-2"
                >
                  {isMemoLoading(row.id, "memo") ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancelEditMemo(row.id)}
                  disabled={isMemoLoading(row.id, "memo")}
                  className="h-7 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-2">
              <div
                className={`flex-1 text-sm text-gray-600 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words ${
                  row.dormitoryTeamMemberMemo
                    ? "cursor-default"
                    : "cursor-pointer hover:bg-gray-100"
                }`}
                onClick={() => handleStartEditMemo(row.id)}
              >
                {row.dormitoryTeamMemberMemo ||
                  "일정변동 요청 메모를 추가하려면 클릭하세요"}
              </div>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  }
);
DormitoryTableRow.displayName = "DormitoryTableRow";

const ROW_HEIGHT = 56; // adjust to match your row padding

export const DormitoryTeamMemberTable = React.memo(
  function DormitoryTeamMemberTable({
    schedules = [],
    retreatSlug,
  }: {
    schedules: any[];
    retreatSlug: string;
  }) {
    const addToast = useToastStore(state => state.add);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
      {}
    );
    const [searchTerm, setSearchTerm] = useState("");

    // 메모 관련 상태 - 인라인 편집 방식
    const [editingMemo, setEditingMemo] = useState<Record<number, boolean>>({});
    const [memoValues, setMemoValues] = useState<Record<number, string>>({});
    const { submitScheduleChangeRequestMemo } =
      useScheduleChangeRequestMemo(retreatSlug);

    // 메모 관련 함수들 - 인라인 편집 방식
    const setLoading = useCallback(
      (id: number, action: string, isLoading: boolean) => {
        setLoadingStates(prev => ({
          ...prev,
          [`${id}_${action}`]: isLoading,
        }));
      },
      []
    );

    const isMemoLoading = useCallback(
      (id: number, action: string) => {
        return loadingStates[`${id}_${action}`] || false;
      },
      [loadingStates]
    );

    // 인원관리 팀원용 데이터 가져오기
    const {
      data: registrations = [],
      isLoading,
      error,
      mutate,
    } = useDormitoryTeamMemberRegistrations(retreatSlug);

    // debounce the search term
    const debouncedSearch = useDebounce(searchTerm, 300);

    // 스케줄 컬럼 생성
    const scheduleColumns = useMemo(
      () => generateScheduleColumns(schedules),
      [schedules]
    );

    const columnWidths = useMemo(() => {
      const base = [
        "70px", // GBS
        "70px", // 부서
        "60px", // 성별
        "60px", // 학년
        "100px", // 이름
      ];
      const scheduleW = scheduleColumns.map(() => "45px");
      const trail = [
        "100px", // 숙소
        "300px", // 메모
      ];
      return [...base, ...scheduleW, ...trail];
    }, [scheduleColumns]);

    const totalTableWidth = useMemo(
      () => columnWidths.reduce((sum, w) => sum + parseInt(w, 10), 0),
      [columnWidths]
    );

    // 데이터 변환 및 필터링
    const flatRows = useMemo(() => {
      if (!registrations.length || !schedules.length) return [];

      // 데이터 변환
      const transformedData: DormitoryTableRowData[] = registrations.map(
        (registration: IDormitoryTeamMemberRegistration) => {
          // 스케줄 정보 변환
          const scheduleData: Record<string, boolean> = {};
          schedules.forEach(schedule => {
            scheduleData[`schedule_${schedule.id}`] =
              registration.userRetreatRegistrationScheduleIds?.includes(
                schedule.id
              ) || false;
          });

          return {
            id: registration.id,
            gbsNumber: registration.gbsNumber,
            department: `${registration.univGroupNumber}부`,
            gender: registration.gender,
            grade: `${registration.gradeNumber}학년`,
            name: registration.name,
            schedule: scheduleData,
            dormitoryName: registration.dormitoryLocation || "",
            dormitoryTeamMemberMemo:
              registration.dormitoryTeamMemberMemo || null,
            isLeader: registration.isLeader,
          };
        }
      );

      // 검색 필터
      const q = debouncedSearch.trim().toLowerCase();
      const filtered = q
        ? transformedData.filter(row => {
            return (
              String(row.gbsNumber ?? "").includes(q) ||
              row.name.toLowerCase().includes(q) ||
              row.department.toLowerCase().includes(q) ||
              row.grade.toLowerCase().includes(q) ||
              row.dormitoryName.toLowerCase().includes(q) ||
              (row.dormitoryTeamMemberMemo?.toLowerCase().includes(q) ?? false)
            );
          })
        : transformedData;

      // GBS 번호별로 그룹화
      const groups: Record<string, DormitoryTableRowData[]> = {};
      filtered.forEach(row => {
        const key =
          row.gbsNumber != null ? String(row.gbsNumber) : "unassigned";
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(row);
      });

      // 그룹별 정렬
      Object.keys(groups).forEach(gbsNumStr => {
        const gbsRows = groups[gbsNumStr];
        gbsRows.sort((a, b) => {
          // 1. 리더 우선 (리더가 위로)
          if (a.isLeader !== b.isLeader) {
            return b.isLeader ? 1 : -1;
          }
          // 2. 학년 내림차순 (4학년 -> 1학년)
          const gradeA = parseInt(a.grade.replace("학년", ""));
          const gradeB = parseInt(b.grade.replace("학년", ""));
          if (gradeB !== gradeA) return gradeB - gradeA;
          // 3. 이름 가나다순
          return a.name.localeCompare(b.name, "ko");
        });
      });

      // 키 정렬 및 평탄화
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (a === "unassigned") return 1;
        if (b === "unassigned") return -1;
        return +a - +b;
      });

      return sortedKeys.flatMap(key => {
        const group = groups[key];
        return group.map((row, idx) => ({
          row,
          isFirstInGroup: idx === 0,
          groupSize: group.length,
        }));
      });
    }, [registrations, schedules, debouncedSearch]);

    const handleStartEditMemo = useCallback(
      (id: number) => {
        // 이미 메모가 있으면 편집할 수 없음
        const currentRow = flatRows.find(item => item.row.id === id);
        if (currentRow?.row.dormitoryTeamMemberMemo) {
          return;
        }
        setEditingMemo(prev => ({ ...prev, [id]: true }));
        setMemoValues(prev => ({ ...prev, [id]: "" }));
      },
      [flatRows]
    );

    const handleCancelEditMemo = useCallback((id: number) => {
      setEditingMemo(prev => ({ ...prev, [id]: false }));
      setMemoValues(prev => ({ ...prev, [id]: "" }));
    }, []);

    const handleSaveMemo = useCallback(
      async (id: number) => {
        const memo = memoValues[id];
        if (!memo || !memo.trim()) return;

        setLoading(id, "memo", true);
        try {
          await submitScheduleChangeRequestMemo(id, memo);
          setEditingMemo(prev => ({ ...prev, [id]: false }));
          setMemoValues(prev => ({ ...prev, [id]: "" }));
          // 데이터 새로고침하여 저장된 메모를 UI에 반영
          await mutate();
        } catch (error) {
          // 에러는 hook에서 처리
        } finally {
          setLoading(id, "memo", false);
        }
      },
      [memoValues, submitScheduleChangeRequestMemo, setLoading, mutate]
    );

    if (isLoading) return <div>로딩 중...</div>;
    if (error) return <div>에러가 발생했습니다.</div>;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            인원관리 팀원 관리
          </CardTitle>
          <CardDescription>
            인원관리 팀원이 기숙사 신청자 목록을 조회하고 일정변동 요청 메모를
            작성할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-1 pt-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="GBS번호/부서/학년/이름/숙소/메모로 검색 ..."
                className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Table with virtualized body */}
            <div className="rounded-md border">
              {/* Header */}
              <Table style={{ width: totalTableWidth }} className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="text-center px-2 py-1"
                      style={{ width: columnWidths[0] }}
                    >
                      GBS번호
                    </TableHead>
                    <TableHead
                      className="text-center px-2 py-1"
                      style={{ width: columnWidths[1] }}
                    >
                      부서
                    </TableHead>
                    <TableHead
                      className="text-center px-2 py-1"
                      style={{ width: columnWidths[2] }}
                    >
                      성별
                    </TableHead>
                    <TableHead
                      className="text-center px-2 py-1"
                      style={{ width: columnWidths[3] }}
                    >
                      학년
                    </TableHead>
                    <TableHead
                      className="text-center px-2 py-1"
                      style={{ width: columnWidths[4] }}
                    >
                      이름
                    </TableHead>
                    {scheduleColumns.map((col, i) => (
                      <TableHead
                        key={col.key}
                        className="px-2 py-1 text-center whitespace-nowrap"
                        style={{ width: columnWidths[5 + i] }}
                      >
                        <span className="text-xs">{col.label}</span>
                      </TableHead>
                    ))}
                    <TableHead
                      className="text-center px-2 py-1"
                      style={{
                        width: columnWidths[5 + scheduleColumns.length],
                      }}
                    >
                      숙소
                    </TableHead>
                    <TableHead
                      className="text-center px-2 py-1"
                      style={{
                        width: columnWidths[5 + scheduleColumns.length + 1],
                      }}
                    >
                      일정 변동
                      <br />
                      요청 메모
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </Table>

              {/* Virtualized rows */}
              <List
                height={Math.min(
                  flatRows.length * ROW_HEIGHT,
                  window.innerHeight * 0.6
                )}
                itemCount={flatRows.length}
                itemSize={ROW_HEIGHT}
                width={totalTableWidth}
                itemData={flatRows}
              >
                {({
                  index,
                  style,
                  data,
                }: {
                  index: number;
                  style: React.CSSProperties;
                  data: any[];
                }) => {
                  const { row, isFirstInGroup, groupSize } = data[index];
                  return (
                    <div style={style}>
                      <Table className="w-full table-fixed">
                        <TableBody>
                          <DormitoryTableRow
                            row={row}
                            isFirstInGroup={isFirstInGroup}
                            groupSize={groupSize}
                            scheduleColumns={scheduleColumns}
                            editingMemo={editingMemo}
                            memoValues={memoValues}
                            isMemoLoading={isMemoLoading}
                            handleStartEditMemo={handleStartEditMemo}
                            setMemoValues={setMemoValues}
                            handleSaveMemo={handleSaveMemo}
                            handleCancelEditMemo={handleCancelEditMemo}
                            columnWidths={columnWidths}
                          />
                        </TableBody>
                      </Table>
                    </div>
                  );
                }}
              </List>
            </div>

            {flatRows.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                조건에 맞는 데이터가 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
