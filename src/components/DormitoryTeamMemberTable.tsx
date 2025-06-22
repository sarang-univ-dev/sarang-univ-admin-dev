"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import {
  COMPLETE_GROUP_ROW_COUNT,
} from "@/lib/constant/lineup.constant";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import { useDormitoryTeamMemberRegistrations, IDormitoryTeamMemberRegistration, useScheduleChangeRequestMemo } from "@/hooks/use-dormitory-team-member";

export const DormitoryTeamMemberTable = React.memo(function DormitoryTeamMemberTable({
  schedules = [],
  retreatSlug,
}: {
  schedules: any[];
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");

  // 메모 관련 상태 - 인라인 편집 방식
  const [editingMemo, setEditingMemo] = useState<Record<number, boolean>>({});
  const [memoValues, setMemoValues] = useState<Record<number, string>>({});
  const { submitScheduleChangeRequestMemo } = useScheduleChangeRequestMemo(retreatSlug);

  // 메모 관련 함수들 - 인라인 편집 방식
  const setLoading = (id: number, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading
    }));
  };

  const isMemoLoading = (id: number, action: string) => {
    return loadingStates[`${id}_${action}`] || false;
  };

  const handleStartEditMemo = (id: number) => {
    // 이미 메모가 있으면 편집할 수 없음
    const currentRow = filteredData.find(row => row.id === id);
    if (currentRow?.dormitoryTeamMemberMemo) {
      return;
    }
    setEditingMemo(prev => ({ ...prev, [id]: true }));
    setMemoValues(prev => ({ ...prev, [id]: "" }));
  };

  const handleCancelEditMemo = (id: number) => {
    setEditingMemo(prev => ({ ...prev, [id]: false }));
    setMemoValues(prev => ({ ...prev, [id]: "" }));
  };

  const handleSaveMemo = async (id: number) => {
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
  };

  // 인원관리 팀원용 데이터 가져오기
  const { data: registrations = [], isLoading, error, mutate } = useDormitoryTeamMemberRegistrations(retreatSlug);

  // 데이터 변환 함수를 useMemo로 최적화
  const transformedData = useMemo(() => {
    if (!registrations.length || !schedules.length) return [];
    
    return registrations.map((registration: IDormitoryTeamMemberRegistration) => {
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
        department: `${registration.univGroupNumber}부`,
        gender: registration.gender,
        grade: `${registration.gradeNumber}학년`,
        name: registration.name,
        schedule: scheduleData,
        gbsNumber: registration.gbsNumber,
        dormitoryName: registration.dormitoryLocation || "",
        dormitoryTeamMemberMemo: registration.dormitoryTeamMemberMemo || null, // 인원관리 팀원이 작성한 메모
      };
    });
  }, [registrations, schedules]);

  // 컴포넌트 마운트 시 데이터 로드 - transformedData 사용
  useEffect(() => {
    if (transformedData.length > 0) {
      setData(transformedData);
      setFilteredData(transformedData);
    }
  }, [transformedData]);

  // 검색 필터 적용을 useMemo로 최적화
  const filteredDataMemo = useMemo(() => {
    let temp = data;

    // 검색어 필터
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      temp = temp.filter(
        row =>
          String(row.gbsNumber ?? "").includes(lower) ||
          (row.name?.toLowerCase().includes(lower) ?? false) ||
          (row.department?.toLowerCase().includes(lower) ?? false) ||
          (row.grade?.toLowerCase().includes(lower) ?? false) ||
          (row.dormitoryName?.toLowerCase().includes(lower) ?? false) ||
          (row.dormitoryTeamMemberMemo?.toLowerCase().includes(lower) ?? false)
      );
    }

    return temp;
  }, [data, searchTerm]);

  // filteredData 상태 업데이트
  useEffect(() => {
    setFilteredData(filteredDataMemo);
  }, [filteredDataMemo]);

  // groupByGbsNumber 함수를 useMemo로 최적화
  const groupedData = useMemo(() => {
    function groupByGbsNumber(rows: any[]) {
      const group: Record<string, any[]> = {};

      rows.forEach(row => {
        const key = row.gbsNumber?.toString() || "null";
        if (!group[key]) {
          group[key] = [];
        }
        group[key].push(row);
      });

      // 각 그룹별로 정렬
      Object.keys(group).forEach(gbsNumStr => {
        const gbsRows = group[gbsNumStr];
        
        // 각 row에 리더 정보 추가
        gbsRows.forEach(row => {
          row.isLeader = false; // 리더 정보는 없으므로 false로 설정
        });

        // 그룹 내 정렬 (리더는 없으므로 학년 -> 이름 순)
        gbsRows.sort((a, b) => {
          // 1. 학년 내림차순 (4학년 -> 1학년)
          const gradeA = parseInt(a.grade.replace('학년', ''));
          const gradeB = parseInt(b.grade.replace('학년', ''));
          if (gradeB !== gradeA) return gradeB - gradeA;
          // 2. 이름 가나다순
          return a.name.localeCompare(b.name, "ko");
        });
      });

      return group;
    }
    
    return groupByGbsNumber(filteredData);
  }, [filteredData]);

  // 스케줄 컬럼 생성
  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러가 발생했습니다.</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">기숙사 팀원 관리</CardTitle>
        <CardDescription>
          인원관리 팀원이 기숙사 신청자 목록을 조회하고 일정변동 요청 메모를 작성할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-1 pt-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={"GBS번호/부서/학년/이름/숙소/메모로 검색 ..."}
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <div className="min-w-max">
              <div className="max-h-[80vh] overflow-y-auto">
                <Table className="w-full whitespace-nowrap relative">
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2} className="text-center px-2 py-1">
                        GBS번호
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center px-2 py-1">
                        부서
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center px-2 py-1">
                        성별
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center px-2 py-1">
                        학년
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center px-2 py-1">
                        이름
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="whitespace-nowrap px-2 py-1 text-center"
                      >
                        수양회 신청 일정
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center px-2 py-1">
                        숙소
                      </TableHead>
                      <TableHead rowSpan={2} className="text-center px-2 py-1">
                        일정 변동<br/>요청 메모
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumns.map(scheduleCol => (
                        <TableHead
                          key={scheduleCol.key}
                          className="px-2 py-1 text-center whitespace-nowrap"
                        >
                          <span className="text-xs">{scheduleCol.label}</span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedData).map(([gbsNum, groupRows]) => {
                      // gbsNumber가 null인 row 개수와 아닌 row 개수 구분
                      const withNumber = groupRows.filter(
                        r => r.gbsNumber != null
                      );
                      const withoutNumber = groupRows.filter(
                        r => r.gbsNumber == null
                      );

                      // gbsNumber가 null이 아닌 row(=withNumber)는 rowspan으로 합쳐서 표현
                      // gbsNumber가 null인 row(=withoutNumber)는 각 row에서 빈 칸 표시
                      return [
                        ...withNumber.map((row, idx) => (
                          <TableRow key={row.id}>
                            {idx === 0 && (
                              <>
                                {/* GBS번호 */}
                                <TableCell
                                  rowSpan={withNumber.length}
                                  className={`align-middle font-bold text-center px-2 py-1 ${withNumber.length > COMPLETE_GROUP_ROW_COUNT ? "bg-rose-200" : ""}`}
                                >
                                  {row.gbsNumber}
                                </TableCell>
                              </>
                            )}
                            {/* 이하 기존 row 컬럼 렌더링 */}
                            <TableCell
                              className={
                                row.isLeader
                                  ? "text-center bg-cyan-200 px-2 py-1"
                                  : "text-center px-2 py-1"
                              }
                            >
                              {row.department}
                            </TableCell>
                            <TableCell
                              className={
                                row.isLeader
                                  ? "text-center bg-cyan-200 px-2 py-1"
                                  : "text-center px-2 py-1"
                              }
                            >
                              <GenderBadge gender={row.gender} />
                            </TableCell>
                            <TableCell
                              className={
                                row.isLeader
                                  ? "text-center bg-cyan-200 px-2 py-1"
                                  : "text-center px-2 py-1"
                              }
                            >
                              {row.grade}
                            </TableCell>
                            <TableCell
                              className={
                                row.isLeader
                                  ? "text-center bg-cyan-200 font-bold text-base px-2 py-1"
                                  : "text-center px-2 py-1"
                              }
                            >
                              {row.name}
                            </TableCell>
                            {scheduleColumns.map(col => (
                              <TableCell
                                key={`${row.id}-${col.key}`}
                                className={`px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap ${row.isLeader ? "bg-cyan-200" : ""}`}
                              >
                                <Checkbox
                                  checked={row.schedule[col.key]}
                                  disabled
                                  className={
                                    row.schedule[col.key]
                                      ? col.bgColorClass
                                      : ""
                                  }
                                />
                              </TableCell>
                            ))}
                            {/* 숙소 */}
                            <TableCell
                              className={
                                row.isLeader
                                  ? "text-center bg-cyan-200 px-2 py-1"
                                  : "text-center px-2 py-1"
                              }
                            >
                              {row.dormitoryName || "-"}
                            </TableCell>
                            {/* 일정 변동 요청 메모 */}
                            <TableCell
                              className={`group-hover:bg-gray-50 text-left px-2 py-1 ${row.isLeader ? "bg-cyan-200" : ""}`}
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
                                            (memoValues[row.id] || "").split("\n")
                                              .length *
                                              20 +
                                              20
                                          )
                                        ) + "px",
                                    }}
                                    disabled={isMemoLoading(row.id, "memo")}
                                    rows={Math.max(
                                      3,
                                      Math.min(
                                        10,
                                        (memoValues[row.id] || "").split("\n")
                                          .length + 1
                                      )
                                    )}
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
                        )),
                        ...withoutNumber.map(row => (
                          <TableRow key={row.id}>
                            {/* 앞 빈 칸 */}
                            <TableCell className="text-center px-2 py-1" />
                            {/* 이하 나머지 컬럼 */}
                            <TableCell className="text-center px-2 py-1">
                              {row.department}
                            </TableCell>
                            <TableCell className="text-center px-2 py-1">
                              <GenderBadge gender={row.gender} />
                            </TableCell>
                            <TableCell className="text-center px-2 py-1">
                              {row.grade}
                            </TableCell>
                            <TableCell
                              className={
                                row.isLeader
                                  ? "font-bold text-blue-600 text-center px-2 py-1"
                                  : "text-center px-2 py-1"
                              }
                            >
                              {row.name}
                            </TableCell>
                            {scheduleColumns.map(col => (
                              <TableCell
                                key={`${row.id}-${col.key}`}
                                className="px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap"
                              >
                                <Checkbox
                                  checked={row.schedule[col.key]}
                                  disabled
                                  className={
                                    row.schedule[col.key]
                                      ? col.bgColorClass
                                      : ""
                                  }
                                />
                              </TableCell>
                            ))}
                            {/* 숙소 */}
                            <TableCell className="text-center px-2 py-1">
                              {row.dormitoryName || "-"}
                            </TableCell>
                            {/* 일정 변동 요청 메모 */}
                            <TableCell className="group-hover:bg-gray-50 text-left px-2 py-1">
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
                                            (memoValues[row.id] || "").split("\n")
                                              .length *
                                              20 +
                                              20
                                          )
                                        ) + "px",
                                    }}
                                    disabled={isMemoLoading(row.id, "memo")}
                                    rows={Math.max(
                                      3,
                                      Math.min(
                                        10,
                                        (memoValues[row.id] || "").split("\n")
                                          .length + 1
                                      )
                                    )}
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
                        )),
                      ];
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

    </Card>
  );
}); 