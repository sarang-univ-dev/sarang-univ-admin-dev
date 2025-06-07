"use client";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  X,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GenderBadge} from "@/components/Badge";
import { SearchBar } from "@/components/RegistrationTableSearchBar";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { mutate } from "swr";
import { AxiosError } from "axios";
import {
  generateScheduleColumns,
} from "@/utils/retreat-utils";


export function GBSLineupTable({
                                    registrations = [],
                                    schedules = [],
                                    retreatSlug,
                                  }: {
  registrations: any[];
  schedules: any[];
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [editingMemo, setEditingMemo] = useState<Record<string, boolean>>({});
  const [memoValues, setMemoValues] = useState<Record<string, string>>({});
  const [gbsNumberInputs, setGbsNumberInputs] = useState<Record<string, string>>({});

  const confirmDialog = useConfirmDialogStore();

  // API 엔드포인트
  const lineupEndpoint = `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`;

  // 데이터 변환 함수
  const transformRegistrationsForLineup = (
      registrations: any[],
      schedules: any[]
  ) => {
    return registrations.map(registration => {
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
        maleCount: registration.maleCount,
        femaleCount: registration.femaleCount,
        fullAttendanceCount: registration.fullAttendanceCount,
        partialAttendanceCount: registration.partialAttendanceCount,
        department: `${registration.univGroupNumber}부`,
        gender: registration.gender,
        grade: `${registration.gradeNumber}학년`,
        name: registration.name,
        phoneNumber: registration.phoneNumber,
        schedule: scheduleData,
        type: registration.userType,
        isLeader: registration.isLeader,
        isFullAttendance: registration.isFullAttendance,
        currentLeader: registration.currentLeader,
        gbsNumber: registration.gbsNumber,
        gbsMemo: registration.gbsMemo,
        lineupMemo: registration.lineupMemo,
        lineupMemoId: registration.lineupMemoId,
      };
    });


  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (registrations.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformRegistrationsForLineup(
            registrations,
            schedules
        );
        setData(transformedData);
        setFilteredData(transformedData);
      } catch (error) {
        console.error("데이터 변환 중 오류 발생:", error);
      }
    }
  }, [registrations, schedules]);

  // 검색 결과 처리 함수
  const handleSearchResults = (results: any[]) => {
    setFilteredData(results);
  };

  // 로딩 상태 설정 함수
  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  // 로딩 상태 확인 함수
  const isLoading = (id: string, action: string) => {
    return loadingStates[`${id}_${action}`];
  };

  // 메모 편집 시작
  const handleStartEditMemo = (id: string, currentMemo: string) => {
    setEditingMemo(prev => ({ ...prev, [id]: true }));
    setMemoValues(prev => ({ ...prev, [id]: currentMemo || "" }));
  };

  // 메모 편집 취소
  const handleCancelEditMemo = (id: string) => {
    setEditingMemo(prev => ({ ...prev, [id]: false }));
    setMemoValues(prev => ({ ...prev, [id]: "" }));
  };

  const handleSaveGbsNumber = async (row: any) => {
    const newGbsNumber = gbsNumberInputs[row.id] ?? String(row.gbsNumber);

    setLoading(row.id, "gbsNumber", true);

    try {
      // 실제 API 호출 예시 (endpoint, body는 맞게 수정!)
      await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/line-up/assign-gbs`,
          {userRetreatRegistrationId: row.id, gbsNumber: newGbsNumber }
      );

      // 성공 시 데이터 즉시 반영
      setFilteredData(prev =>
          prev.map(r =>
              r.id === row.id
                  ? { ...r, gbsNumber: newGbsNumber, gbsNumberError: false }
                  : r
          )
      );
      setData(prev =>
          prev.map(r =>
              r.id === row.id
                  ? { ...r, gbsNumber: newGbsNumber, gbsNumberError: false }
                  : r
          )
      );

      await mutate(lineupEndpoint);

      addToast({
        title: "성공",
        description: "GBS가 배정되었습니다.",
        variant: "success",
      });



    } catch (error) {
      // 실패 시 에러 표시
      setFilteredData(prev =>
          prev.map(r =>
              r.id === row.id
                  ? { ...r, gbsNumberError: true }
                  : r
          )
      );
      setData(prev =>
          prev.map(r =>
              r.id === row.id
                  ? { ...r, gbsNumberError: true }
                  : r
          )
      );

      addToast({
        title: "오류 발생",
        description: "GBS번호 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(row.id, "gbsNumber", false);
    }
  };

  // 메모 저장
  const handleSaveMemo = async (id: string) => {
    const memo = memoValues[id];
    const currentRow = filteredData.find(row => row.id === id);
    const hasExistingMemo =
        currentRow?.lineupMemo && currentRow.lineupMemo.trim();
    const memoId = currentRow?.lineupMemoId;

    setLoading(id, "memo", true);

    try {
      if (memo && memo.trim()) {
        if (hasExistingMemo && memoId) {
          // 기존 메모가 있는 경우 - PUT 요청으로 수정
          await webAxios.put(
              `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`,
              {
                memo: memo.trim(),
              }
          );
        } else {
          // 새 메모 생성 - POST 요청
          await webAxios.post(
              `/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`,
              {
                memo: memo.trim(),
              }
          );
        }
      }

      setFilteredData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, lineupMemo: memo, lineupMemoId: memoId ?? row.lineupMemoId, memoError: false }
                  : row
          )
      );
      setData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, lineupMemo: memo, lineupMemoId: memoId ?? row.lineupMemoId, memoError: false }
                  : row
          )
      );

      await mutate(lineupEndpoint);

      setEditingMemo(prev => ({ ...prev, [id]: false }));
      setMemoValues(prev => ({ ...prev, [id]: "" }));

      addToast({
        title: "성공",
        description: hasExistingMemo
            ? "메모가 성공적으로 수정되었습니다."
            : "메모가 성공적으로 저장되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("메모 저장 중 오류 발생:", error);

      setFilteredData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, memoError: true }
                  : row
          )
      );
      setData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, memoError: true }
                  : row
          )
      );

      addToast({
        title: "오류 발생",
        description:
            error instanceof AxiosError
                ? error.response?.data?.message || error.message
                : error instanceof Error
                    ? error.message
                    : "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "memo", false);
    }
  };

  // 메모 삭제
  const handleDeleteMemo = async (id: string) => {
    const currentRow = filteredData.find(row => row.id === id);
    const memoId = currentRow?.lineupMemoId;

    setLoading(id, "delete_memo", true);

    try {
      await webAxios.delete(
          `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`
      );

      // 💡 여기서 filteredData/data 직접 업데이트!
      setFilteredData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, lineupMemo: "", lineupMemoId: undefined, memoError: false }
                  : row
          )
      );
      setData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, lineupMemo: "", lineupMemoId: undefined, memoError: false }
                  : row
          )
      );

      await mutate(lineupEndpoint);

      addToast({
        title: "성공",
        description: "메모가 성공적으로 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("메모 삭제 중 오류 발생:", error);

      setFilteredData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, memoError: true }
                  : row
          )
      );
      setData(prev =>
          prev.map(row =>
              row.id === id
                  ? { ...row, memoError: true }
                  : row
          )
      );

      addToast({
        title: "오류 발생",
        description:
            error instanceof AxiosError
                ? error.response?.data?.message || error.message
                : error instanceof Error
                    ? error.message
                    : "메모 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "delete_memo", false);
    }
  };

  // 메모 삭제 확인
  const handleConfirmDeleteMemo = (id: string) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: () => handleDeleteMemo(id),
    });
  };

  // registrations를 gbsNumber별로 그룹화, 각 그룹 내 isLeader true 먼저 정렬
  function groupByGbsNumber(rows: any[]) {
    const group: Record<string, any[]> = {};
    rows.forEach(row => {
      if (!group[row.gbsNumber]) group[row.gbsNumber] = [];
      group[row.gbsNumber].push(row);
    });

    Object.keys(group).forEach(gbsNumStr => {
      group[gbsNumStr].sort((a, b) => {
        // 1. 리더 우선
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        // 2. 학년 내림차순
        if (b.grade !== a.grade) return b.grade - a.grade;
        // 3. 이름 가나다순
        return a.name.localeCompare(b.name, "ko");
      });
    });

    return group;
  }


  // 일정 체크박스 컬럼 정의
  const scheduleColumns = generateScheduleColumns(schedules);
  const grouped = groupByGbsNumber(filteredData);

  return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            <SearchBar onSearch={handleSearchResults} data={data} />
            <div className="rounded-md border overflow-x-auto">
              <div className="min-w-max">
                <div className="max-h-[80vh] overflow-y-auto">
                  <Table className="w-full whitespace-nowrap relative">
                    <TableHeader>
                      <TableRow>
                        <TableHead rowSpan={2}>GBS번호</TableHead>
                        <TableHead rowSpan={2}>전참/부분참</TableHead>
                        <TableHead rowSpan={2}>남/여</TableHead>
                        {/* 이하 기존 컬럼 */}
                        <TableHead rowSpan={2}>부서</TableHead>
                        <TableHead rowSpan={2}>성별</TableHead>
                        <TableHead rowSpan={2}>학년</TableHead>
                        <TableHead rowSpan={2}>이름</TableHead>
                        <TableHead rowSpan={2}>부서 리더명</TableHead>
                        <TableHead rowSpan={2}>전화번호</TableHead>
                        <TableHead colSpan={scheduleColumns.length} className="whitespace-nowrap">
                          <div className="text-center">수양회 신청 일정</div>
                        </TableHead>
                        <TableHead rowSpan={2}>GBS 배정하기</TableHead>
                        <TableHead rowSpan={2}>GBS 메모</TableHead>
                        <TableHead rowSpan={2}>라인업 메모</TableHead>
                      </TableRow>
                      <TableRow>
                        {scheduleColumns.map(scheduleCol => (
                            <TableHead
                                key={scheduleCol.key}
                                className="p-2 text-center whitespace-nowrap"
                            >
                              <span className="text-xs">{scheduleCol.label}</span>
                            </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(grouped).map(([gbsNum, groupRows]) => {
                        // gbsNumber가 null인 row 개수와 아닌 row 개수 구분
                        const withNumber = groupRows.filter(r => r.gbsNumber != null);
                        const withoutNumber = groupRows.filter(r => r.gbsNumber == null);

                        // gbsNumber가 null이 아닌 row(=withNumber)는 rowspan으로 합쳐서 표현
                        // gbsNumber가 null인 row(=withoutNumber)는 각 row에서 빈 칸 3개
                        return [
                          ...withNumber.map((row, idx) => (
                              <TableRow key={row.id}>
                                {idx === 0 && (
                                    <>
                                      {/* GBS번호: input, rowSpan */}
                                      <TableCell rowSpan={withNumber.length} className="align-middle font-bold">
                                        {row.gbsNumber}
                                      </TableCell>
                                      {/* 전참/부분참 */}
                                      <TableCell rowSpan={withNumber.length} className="align-middle font-semibold">
                                        전참 {row.fullAttendanceCount} / 부분참 {row.partialAttendanceCount}
                                      </TableCell>
                                      {/* 남/여 */}
                                      <TableCell rowSpan={withNumber.length} className="align-middle font-semibold">
                                        남 {row.maleCount} / 여 {row.femaleCount}
                                      </TableCell>
                                    </>
                                )}
                                {/* 이하 기존 row 컬럼 렌더링 */}
                                <TableCell>{row.department}</TableCell>
                                <TableCell><GenderBadge gender={row.gender} /></TableCell>
                                <TableCell>{row.grade}</TableCell>
                                <TableCell className={row.isLeader ? "font-bold text-base" : ""}>{row.name}</TableCell>
                                <TableCell>{row.currentLeader}</TableCell>
                                <TableCell>{row.phoneNumber}</TableCell>
                                {scheduleColumns.map(col => (
                                    <TableCell
                                        key={`${row.id}-${col.key}`}
                                        className="p-2 text-center group-hover:bg-gray-50 whitespace-nowrap"
                                    >
                                      <Checkbox
                                          checked={row.schedule[col.key]}
                                          disabled
                                          className={row.schedule[col.key] ? col.bgColorClass : ""}
                                      />
                                    </TableCell>
                                ))}
                                <TableCell className="align-middle text-center py-3">
                                  {row.isLeader ? (
                                      <span className="
                                        inline-block w-36 text-center py-1 font-semibold rounded
                                        bg-gray-100 text-gray-800 border border-gray-400 text-base tracking-wide
                                        ">
                                        리더
                                      </span>
                                  ) : (
                                      <input
                                          type="text"
                                          defaultValue={row.gbsNumber}
                                          className={
                                              "rounded px-2 py-1 text-center w-36 transition-all " +
                                              ((gbsNumberInputs[row.id] ?? row.gbsNumber ?? "") // 값이 있으면
                                                  ? "border border-blue-400 font-bold bg-blue-50"
                                                  : "border border-gray-300 bg-white font-normal text-gray-700")
                                          }
                                          onClick={e => e.currentTarget.select()}
                                          onChange={e => setGbsNumberInputs(prev => ({
                                            ...prev,
                                            [row.id]: e.target.value,
                                          }))}
                                          placeholder="gbs 번호 입력후 엔터"
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveGbsNumber(row);
                                          }}
                                          readOnly={false}
                                      />
                                  )}
                                </TableCell>

                                {/* GBS 메모 rowSpan */}
                                {idx === 0 && (
                                    <TableCell rowSpan={withNumber.length} className="align-middle">
                                      {row.gbsMemo}
                                    </TableCell>
                                )}
                                {/* 라인업 메모(개별 row마다) */}
                                <TableCell>
                                  {editingMemo[row.id] ? (
                                      /* 메모 수정 UI */
                                      <div className="flex flex-col gap-2 p-2">
                                        <Textarea
                                            value={memoValues[row.id] || ""}
                                            onChange={e =>
                                                setMemoValues(prev => ({
                                                  ...prev,
                                                  [row.id]: e.target.value,
                                                }))
                                            }
                                            placeholder="메모를 입력하세요..."
                                            className={
                                                "text-sm resize-none overflow-hidden w-full" +
                                                (row.memoError ? " border border-red-400" : " border border-gray-200")
                                            }
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
                                            disabled={isLoading(row.id, "memo")}
                                            rows={Math.max(
                                                3,
                                                Math.min(10, (memoValues[row.id] || "").split("\n").length + 1)
                                            )}
                                        />
                                        <div className="flex gap-1 justify-end">
                                          <Button size="sm" variant="outline" onClick={() => handleSaveMemo(row.id)}
                                                  disabled={isLoading(row.id, "memo")} className="h-7 px-2">
                                            {isLoading(row.id, "memo") ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : <Save className="h-3 w-3" />}
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => handleCancelEditMemo(row.id)}
                                                  disabled={isLoading(row.id, "memo")} className="h-7 px-2">
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                  ) : (
                                      <div className="flex items-start gap-2 p-2">
                                        <div
                                            className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words"
                                            onClick={() => handleStartEditMemo(row.id, row.lineupMemo)}
                                        >
                                          {row.lineupMemo || "메모를 추가하려면 클릭하세요"}
                                        </div>
                                        {row.lineupMemo && (
                                            <Button size="sm" variant="ghost" onClick={() => handleConfirmDeleteMemo(row.id)}
                                                    disabled={isLoading(row.id, "delete_memo")}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1">
                                              {isLoading(row.id, "delete_memo") ? (
                                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                              ) : <Trash2 className="h-3 w-3" />}
                                            </Button>
                                        )}
                                      </div>
                                  )}
                                </TableCell>
                              </TableRow>
                          )),
                          ...withoutNumber.map(row => (
                              <TableRow key={row.id}>
                                {/* 앞 3개 빈 칸 */}
                                <TableCell />
                                <TableCell />
                                <TableCell />
                                {/* 이하 나머지 컬럼 */}
                                <TableCell>{row.department}</TableCell>
                                <TableCell><GenderBadge gender={row.gender} /></TableCell>
                                <TableCell>{row.grade}</TableCell>
                                <TableCell className={row.isLeader ? "font-bold text-blue-600" : ""}>{row.name}</TableCell>
                                <TableCell className={row.isLeader ? "font-bold text-blue-600" : ""}>{row.currentLeader}</TableCell>
                                <TableCell>{row.phoneNumber}</TableCell>
                                {scheduleColumns.map(col => (
                                    <TableCell
                                        key={`${row.id}-${col.key}`}
                                        className="p-2 text-center group-hover:bg-gray-50 whitespace-nowrap"
                                    >
                                      <Checkbox
                                          checked={row.schedule[col.key]}
                                          disabled
                                          className={row.schedule[col.key] ? col.bgColorClass : ""}
                                      />
                                    </TableCell>
                                ))}
                                <TableCell className="align-middle text-center py-3">
                                  {row.isLeader ? (
                                      <span className="
                                        inline-block w-36 text-center py-1 font-semibold rounded
                                        bg-gray-100 text-gray-800 border border-gray-400 text-base tracking-wide
                                        ">
                                        리더
                                      </span>
                                  ) : (
                                      <input
                                          type="text"
                                          defaultValue={row.gbsNumber}
                                          className={
                                              "rounded px-2 py-1 text-center w-36 transition-all " +
                                              ((gbsNumberInputs[row.id] ?? row.gbsNumber ?? "") // 값이 있으면
                                                  ? "border border-blue-400 font-bold bg-blue-50"
                                                  : "border border-gray-300 bg-white font-normal text-gray-700")
                                          }
                                          onClick={e => e.currentTarget.select()}
                                          onChange={e => setGbsNumberInputs(prev => ({
                                            ...prev,
                                            [row.id]: e.target.value,
                                          }))}
                                          placeholder="gbs 번호 입력후 엔터"
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveGbsNumber(row);
                                          }}
                                          readOnly={false}
                                      />
                                  )}
                                </TableCell>
                                {/* GBS 메모는 없음 */}
                                <TableCell/>
                                {/* 라인업 메모(개별 row마다) */}
                                <TableCell>
                                  {editingMemo[row.id] ? (
                                      /* 메모 수정 UI */
                                      <div className="flex flex-col gap-2 p-2">
                                        <Textarea
                                            value={memoValues[row.id] || ""}
                                            onChange={e =>
                                                setMemoValues(prev => ({
                                                  ...prev,
                                                  [row.id]: e.target.value,
                                                }))
                                            }
                                            placeholder="메모를 입력하세요..."
                                            className={
                                                "text-sm resize-none overflow-hidden w-full" +
                                                (row.memoError ? " border border-red-400" : " border border-gray-200")
                                            }
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
                                            disabled={isLoading(row.id, "memo")}
                                            rows={Math.max(
                                                3,
                                                Math.min(10, (memoValues[row.id] || "").split("\n").length + 1)
                                            )}
                                        />
                                        <div className="flex gap-1 justify-end">
                                          <Button size="sm" variant="outline" onClick={() => handleSaveMemo(row.id)}
                                                  disabled={isLoading(row.id, "memo")} className="h-7 px-2">
                                            {isLoading(row.id, "memo") ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : <Save className="h-3 w-3" />}
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => handleCancelEditMemo(row.id)}
                                                  disabled={isLoading(row.id, "memo")} className="h-7 px-2">
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                  ) : (
                                      <div className="flex items-start gap-2 p-2">
                                        <div
                                            className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words"
                                            onClick={() => handleStartEditMemo(row.id, row.lineupMemo)}
                                        >
                                          {row.lineupMemo || "메모를 추가하려면 클릭하세요"}
                                        </div>
                                        {row.lineupMemo && (
                                            <Button size="sm" variant="ghost" onClick={() => handleConfirmDeleteMemo(row.id)}
                                                    disabled={isLoading(row.id, "delete_memo")}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1">
                                              {isLoading(row.id, "delete_memo") ? (
                                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                              ) : <Trash2 className="h-3 w-3" />}
                                            </Button>
                                        )}
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
}
