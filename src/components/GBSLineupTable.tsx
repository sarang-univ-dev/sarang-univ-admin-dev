"use client";

import {useState, useEffect, useRef, useMemo} from "react";
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
  Trash2, Search, Download,
} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {GenderBadge, TypeBadge} from "@/components/Badge";
import { SearchBar } from "@/components/RegistrationTableSearchBar";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { mutate } from "swr";
import { AxiosError } from "axios";
import {
  generateScheduleColumns,
} from "@/utils/retreat-utils";
import {COMPLETE_GROUP_ROW_COUNT, MEMO_COLORS} from "@/lib/constant/lineup.constant";
import {Input} from "@/components/ui/input";
import {formatDate} from "@/utils/formatDate";


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
  const [memoBgColors, setMemoBgColors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);



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
        lineupMemocolor: registration.lineupMemocolor,
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


  // 2. 검색 + "미배정만 조회" 필터 동시 적용
  useEffect(() => {
    let temp = data;

    // 미배정만 체크되었으면 gbsNumber 없는 것만
    if (showOnlyUnassigned) {
      temp = temp.filter(row => !row.gbsNumber || row.gbsNumber === "" || row.gbsNumber === null);
    }

    // 검색어 필터
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      temp = temp.filter(row =>
          String(row.gbsNumber ?? "").includes(lower) ||
          (row.name?.toLowerCase().includes(lower) ?? false) ||
          (row.lineupMemo?.toLowerCase().includes(lower) ?? false) ||
          (row.department?.toLowerCase().includes(lower) ?? false) ||
          (row.grade?.toLowerCase().includes(lower) ?? false) ||
          (row.type?.toLowerCase().includes(lower) ?? false)
      );
    }

    setFilteredData(temp);
  }, [data, showOnlyUnassigned, searchTerm]);


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
    const color = memoBgColors[id];
    const currentRow = filteredData.find(row => row.id === id);
    const hasExistingMemo =
        currentRow?.lineupMemo && currentRow.lineupMemo.trim();
    const memoId = currentRow?.lineupMemoId;

    setLoading(id, "memo", true);

    try {
      if ((memo && memo.trim()) || (color && color.trim())) {
        if (hasExistingMemo && memoId) {
          // 기존 메모가 있는 경우 - PUT 요청으로 수정
          await webAxios.put(
              `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`,
              {
                memo: memo.trim(),
                color: color ? color.trim() : undefined,
              }
          );
        } else {
          // 새 메모 생성 - POST 요청
          await webAxios.post(
              `/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`,
              {
                memo: memo.trim(),
                color: color ? color.trim() : undefined,
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
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
          <div className="whitespace-nowrap">
            <CardTitle>GBS 라인업 현황 조회</CardTitle>
            <CardDescription>대학부 전체 GBS 목록 조회 및 배정</CardDescription>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  alert("엑셀 다운로드 기능은 구현이 필요합니다.");
                  /*
                  setLoadingStates(prev => ({ ...prev, exportExcel: true }));
                  try {
                    const response = await webAxios.get(
                        `/api/v1/retreat/${retreatSlug}/account/download-`,
                        { responseType: 'blob' }
                    );

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `수양회_신청현황_${formatDate(new Date().toISOString())}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    addToast({
                      title: "성공",
                      description: "엑셀 파일이 다운로드되었습니다.",
                      variant: "success",
                    });
                  } catch (error) {
                    console.error("엑셀 다운로드 중 오류 발생:", error);
                    addToast({
                      title: "오류 발생",
                      description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
                      variant: "destructive",
                    });
                  } finally {
                    setLoadingStates(prev => ({ ...prev, exportExcel: false }));
                  }
                  */
                }}
                disabled={loadingStates.exportExcel}
                className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
            >
              {loadingStates.exportExcel ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                  <Download className="h-4 w-4" />
              )}
              <span>엑셀로 내보내기</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  alert("부서 GBS 꼬리표 다운로드 기능은 구현이 필요합니다.");
                  /*
                  setLoadingStates(prev => ({ ...prev, exportDepartmentGbsTags: true }));
                  try {
                    const response = await webAxios.get(
                        `/api/v1/retreat/${retreatSlug}/account/download-`,
                        { responseType: 'blob' }
                    );

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `수양회_신청현황_${formatDate(new Date().toISOString())}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    addToast({
                      title: "성공",
                      description: "엑셀 파일이 다운로드되었습니다.",
                      variant: "success",
                    });
                  } catch (error) {
                    console.error("엑셀 다운로드 중 오류 발생:", error);
                    addToast({
                      title: "오류 발생",
                      description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
                      variant: "destructive",
                    });
                  } finally {
                    setLoadingStates(prev => ({ ...prev, exportDepartmentGbsTags: false }));
                  }
                  */
                }}
                disabled={loadingStates.exportDepartmentGbsTags}
                className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
            >
              {loadingStates.exportDepartmentGbsTags ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                  <Download className="h-4 w-4" />
              )}
              <span>부서 GBS 꼬리표 다운로드</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  alert("수양회 GBS 꼬리표 다운로드 기능은 구현이 필요합니다.");
                  /*
                  setLoadingStates(prev => ({ ...prev, exportRetreatGbsTags: true }));
                  try {
                    const response = await webAxios.get(
                        `/api/v1/retreat/${retreatSlug}/account/download-`,
                        { responseType: 'blob' }
                    );

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `수양회_신청현황_${formatDate(new Date().toISOString())}.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    addToast({
                      title: "성공",
                      description: "엑셀 파일이 다운로드되었습니다.",
                      variant: "success",
                    });
                  } catch (error) {
                    console.error("엑셀 다운로드 중 오류 발생:", error);
                    addToast({
                      title: "오류 발생",
                      description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
                      variant: "destructive",
                    });
                  } finally {
                    setLoadingStates(prev => ({ ...prev, exportRetreatGbsTags: false }));
                  }
                  */
                }}
                disabled={loadingStates.exportRetreatGbsTags}
                className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
            >
              {loadingStates.exportRetreatGbsTags ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                  <Download className="h-4 w-4" />
              )}
              <span>수양회 GBS 꼬리표 다운로드</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"/>
              <Input
                  placeholder={"GBS번호/부서/학년/이름/타입/메모로 검색 ..."}
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
                        <TableHead rowSpan={2} className="text-center">GBS번호</TableHead>
                        <TableHead rowSpan={2} className="text-center">전참/부분참</TableHead>
                        <TableHead rowSpan={2} className="text-center">남/여</TableHead>
                        {/* 이하 기존 컬럼 */}
                        <TableHead rowSpan={2} className="text-center">부서</TableHead>
                        <TableHead rowSpan={2} className="text-center">성별</TableHead>
                        <TableHead rowSpan={2} className="text-center">학년</TableHead>
                        <TableHead rowSpan={2} className="text-center">이름</TableHead>
                        <TableHead rowSpan={2} className="text-center">부서 리더명</TableHead>
                        <TableHead rowSpan={2} className="text-center">전화번호</TableHead>
                        <TableHead rowSpan={2} className="text-center">라인업 메모</TableHead>
                        <TableHead rowSpan={2} className="text-center whitespace-nowrap"><span>타입</span></TableHead>
                        <TableHead colSpan={scheduleColumns.length} className="whitespace-nowrap">
                          <div className="text-center">수양회 신청 일정</div>
                        </TableHead>
                        <TableHead className="text-center">GBS 배정하기</TableHead>
                        <TableHead rowSpan={2} className="text-center">GBS 메모</TableHead>
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
                        <TableHead>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-gray-600">미배정만 조회</span>
                            <Checkbox
                                checked={showOnlyUnassigned}
                                onCheckedChange={() => setShowOnlyUnassigned(prev => !prev)}
                                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                          </div>
                        </TableHead>
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
                                      <TableCell rowSpan={withNumber.length} className={`align-middle font-bold text-center ${withNumber.length > COMPLETE_GROUP_ROW_COUNT ? "bg-rose-200" : ""}`}>
                                        {row.gbsNumber}
                                      </TableCell>
                                      {/* 전참/부분참 */}
                                      <TableCell rowSpan={withNumber.length} className="align-middle text-center font-semibold">
                                        전참 {row.fullAttendanceCount} / 부분참 {row.partialAttendanceCount}
                                      </TableCell>
                                      {/* 남/여 */}
                                      <TableCell rowSpan={withNumber.length} className="align-middle text-center font-semibold">
                                        남 {row.maleCount} / 여 {row.femaleCount}
                                      </TableCell>
                                    </>
                                )}
                                {/* 이하 기존 row 컬럼 렌더링 */}
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200" : "text-center"}>{row.department}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200" : "text-center"}><GenderBadge gender={row.gender} /></TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200" : "text-center"}>{row.grade}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200 font-bold text-base" : "text-center"}>{row.name}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200" : "text-center"}>{row.currentLeader}</TableCell>
                                <TableCell className={row.isLeader ? "text-center bg-cyan-200" : "text-center"}>{row.phoneNumber}</TableCell>
                                {/* 라인업 메모(개별 row마다) */}
                                <TableCell
                                    className={
                                            row.isLeader
                                                ? "bg-cyan-200 text-center"
                                                : "text-center"
                                    }
                                    style={{backgroundColor: row.lineupMemocolor}}
                                >
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
                                        {/* 색상 선택 버튼들 */}
                                        <div className="flex flex-wrap gap-1">
                                          {MEMO_COLORS.map(color => (
                                              <button
                                                  key={color}
                                                  style={{
                                                    backgroundColor: color,
                                                    border: memoBgColors[row.id] === color ? "2px solid black" : "1px solid #ccc",
                                                  }}
                                                  className="w-5 h-5 rounded-full"
                                                  onClick={() =>
                                                      setMemoBgColors(prev => ({...prev, [row.id]: color}))
                                                  }
                                              />
                                          ))}
                                        </div>
                                        <div className="flex gap-1 justify-end">
                                          <Button size="sm" variant="outline" onClick={() => handleSaveMemo(row.id)}
                                                  disabled={isLoading(row.id, "memo")} className="h-7 px-2">
                                            {isLoading(row.id, "memo") ? (
                                                <div
                                                    className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                                            ) : <Save className="h-3 w-3"/>}
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => handleCancelEditMemo(row.id)}
                                                  disabled={isLoading(row.id, "memo")} className="h-7 px-2">
                                            <X className="h-3 w-3"/>
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
                                            <Button size="sm" variant="ghost"
                                                    onClick={() => handleConfirmDeleteMemo(row.id)}
                                                    disabled={isLoading(row.id, "delete_memo")}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1">
                                              {isLoading(row.id, "delete_memo") ? (
                                                  <div
                                                      className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                                              ) : <Trash2 className="h-3 w-3"/>}
                                            </Button>
                                        )}
                                      </div>
                                  )}
                                </TableCell>
                                <TableCell className={`group-hover:bg-gray-50 text-center whitespace-nowrap ${row.isLeader ? "bg-cyan-200" : ""}`}>
                                  <TypeBadge type={row.type} />
                                </TableCell>
                                {scheduleColumns.map(col => (
                                    <TableCell
                                        key={`${row.id}-${col.key}`}
                                        className={`p-2 text-center group-hover:bg-gray-50 whitespace-nowrap ${row.isLeader ? "bg-cyan-200" : ""}`}
                                    >
                                      <Checkbox
                                          checked={row.schedule[col.key]}
                                          disabled
                                          className={row.schedule[col.key] ? col.bgColorClass : ""}
                                      />
                                    </TableCell>
                                ))}
                                <TableCell className={`align-middle text-center py-3 ${row.isLeader ? "bg-cyan-200" : ""}`}>
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

                              </TableRow>
                          )),
                          ...withoutNumber.map(row => (
                              <TableRow key={row.id}>
                                {/* 앞 3개 빈 칸 */}
                                <TableCell className="text-center"/>
                                <TableCell className="text-center"/>
                                <TableCell className="text-center"/>
                                {/* 이하 나머지 컬럼 */}
                                <TableCell className="text-center">{row.department}</TableCell>
                                <TableCell className="text-center"><GenderBadge gender={row.gender} /></TableCell>
                                <TableCell className="text-center">{row.grade}</TableCell>
                                <TableCell className={row.isLeader ? "font-bold text-blue-600 text-center" : "text-center"}>{row.name}</TableCell>
                                <TableCell className={row.isLeader ? "font-bold text-blue-600 text-center" : "text-center"}>{row.currentLeader}</TableCell>
                                <TableCell className="text-center">{row.phoneNumber}</TableCell>
                                {/* 라인업 메모(개별 row마다) */}
                                <TableCell
                                    className={
                                      row.isLeader
                                          ? "bg-cyan-200 text-center"
                                          : "text-center"
                                    }
                                    style={{backgroundColor: row.lineupMemocolor}}
                                >
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
                                        {/* 색상 선택 버튼들 */}
                                        <div className="flex flex-wrap gap-1">
                                          {MEMO_COLORS.map(color => (
                                              <button
                                                  key={color}
                                                  style={{
                                                    backgroundColor: color,
                                                    border: memoBgColors[row.id] === color ? "2px solid black" : "1px solid #ccc",
                                                  }}
                                                  className="w-5 h-5 rounded-full"
                                                  onClick={() =>
                                                      setMemoBgColors(prev => ({...prev, [row.id]: color}))
                                                  }
                                              />
                                          ))}
                                        </div>
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
                                <TableCell className={`group-hover:bg-gray-50 text-center whitespace-nowrap ${row.isLeader ? "bg-cyan-200" : ""}`}>
                                  <TypeBadge type={row.type} />
                                </TableCell>
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
