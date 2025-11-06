"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import { useGBSLineup } from "@/hooks/gbs-line-up/use-gbs-lineup";
import { GbsLineUpTableHeader } from "./GbsLineUpTableHeader";
import { GbsLineUpTableRow } from "./GbsLineUpTableRow";
import { webAxios } from "@/lib/api/axios";
import { AxiosError } from "axios";
import { useRetreatGbsLineupData, type IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import type { TRetreatRegistrationSchedule } from "@/types";

interface GbsLineUpTableProps {
  initialData: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * GBS Line-Up 테이블 (Client Component)
 *
 * @description
 * - TanStack Table 기반
 * - SWR 2초 polling으로 실시간 협업 지원
 * - useMemo/useCallback으로 최적화
 * - React.memo로 불필요한 리렌더링 방지
 */
export const GbsLineUpTable = React.memo(function GbsLineUpTable({
  initialData,
  schedules,
  retreatSlug,
}: GbsLineUpTableProps) {
  // ✅ SWR로 실시간 데이터 가져오기 (2초 polling)
  const { data: pollingData } = useRetreatGbsLineupData(retreatSlug, {
    fallbackData: initialData,
  });

  // SWR 데이터 또는 initialData 사용
  const registrations = pollingData || initialData;
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirmDialogStore();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isScheduleFilterModalOpen, setIsScheduleFilterModalOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // 커스텀 훅 사용
  const {
    searchTerm,
    setSearchTerm,
    showOnlyUnassigned,
    setShowOnlyUnassigned,
    selectedDepartments,
    setSelectedDepartments,
    includedSchedules,
    setIncludedSchedules,
    excludedSchedules,
    setExcludedSchedules,
    departmentOptions,
    groupedData,
    editingMemo,
    setEditingMemo,
    memoValues,
    setMemoValues,
    gbsNumberInputs,
    setGbsNumberInputs,
    memoBgColors,
    setMemoBgColors,
    editingScheduleMemo,
    setEditingScheduleMemo,
    scheduleMemoValues,
    setScheduleMemoValues,
    isLoading,
    debouncedUpdateMemo,
    handleSaveGbsNumber,
    handleSaveMemo,
    handleDeleteMemo,
  } = useGBSLineup(retreatSlug, registrations, schedules);

  // GBS 번호 입력 변경
  const handleGbsNumberInputChange = useCallback((id: string, value: string) => {
    setGbsNumberInputs(prev => ({ ...prev, [id]: value }));
  }, [setGbsNumberInputs]);

  // ✅ 라인업 메모 핸들러 (LineUpMemoEditor용)
  const handleSaveLineupMemo = useCallback(async (id: string, memo: string, color?: string) => {
    const currentRow = registrations.find(r => r.id.toString() === id);
    if (!currentRow) return;

    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`,
        { memo: memo.trim(), color: color || null }
      );

      addToast({
        title: "성공",
        description: "메모가 저장되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류",
        description: "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  }, [retreatSlug, registrations, addToast]);

  const handleUpdateLineupMemo = useCallback(async (id: string, memo: string, color?: string) => {
    const currentRow = registrations.find(r => r.id.toString() === id);
    const memoId = currentRow?.lineupMemoId;
    if (!memoId) return;

    try {
      await webAxios.put(
        `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`,
        { memo: memo.trim(), color: color || null }
      );

      addToast({
        title: "성공",
        description: "메모가 수정되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류",
        description: "메모 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  }, [retreatSlug, registrations, addToast]);

  const handleDeleteLineupMemo = useCallback(async (id: string) => {
    const currentRow = registrations.find(r => r.id.toString() === id);
    const memoId = currentRow?.lineupMemoId;
    if (!memoId) return;

    try {
      await webAxios.delete(
        `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`
      );

      addToast({
        title: "성공",
        description: "메모가 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류",
        description: "메모 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  }, [retreatSlug, registrations, addToast]);

  // ✅ 일정 변동 메모 핸들러 (MemoEditor용)
  const handleSaveScheduleMemo = useCallback(async (id: string, memo: string) => {
    addToast({
      title: "알림",
      description: "일정 변동 메모 추가 기능은 구현 예정입니다.",
      variant: "default",
    });
  }, [addToast]);

  const handleUpdateScheduleMemo = useCallback(async (id: string, memo: string) => {
    addToast({
      title: "알림",
      description: "일정 변동 메모 수정 기능은 구현 예정입니다.",
      variant: "default",
    });
  }, [addToast]);

  const handleDeleteScheduleMemo = useCallback(async (id: string) => {
    addToast({
      title: "알림",
      description: "일정 변동 메모 삭제 기능은 구현 예정입니다.",
      variant: "default",
    });
  }, [addToast]);

  // 꼬리표 다운로드 함수들
  const handleDownloadUnivGbsLabel = async () => {
    setLoadingStates(prev => ({ ...prev, exportDepartmentGbsTags: true }));
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/line-up/univ-gbs-label`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `부서_GBS_꼬리표_${formatDate(new Date().toISOString())}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "부서 GBS 꼬리표 파일이 다운로드되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("부서 GBS 꼬리표 다운로드 중 오류 발생:", error);
      let errorMessage = "부서 GBS 꼬리표 다운로드 중 오류가 발생했습니다.";
      
      if (error instanceof AxiosError) {
        if (error.response?.data) {
          // Blob 응답인 경우 텍스트로 변환
          if (error.response.data instanceof Blob) {
            try {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = `서버 오류: ${error.response.status} ${error.response.statusText}`;
            }
          } else if (typeof error.response.data === 'object') {
            errorMessage = error.response.data.message || error.response.data.error || errorMessage;
          } else {
            errorMessage = error.response.data || errorMessage;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      addToast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, exportDepartmentGbsTags: false }));
    }
  };

  const handleDownloadRetreatGbsLabel = async () => {
    setLoadingStates(prev => ({ ...prev, exportRetreatGbsTags: true }));
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/line-up/retreat-gbs-label`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `수양회_GBS_꼬리표_${formatDate(new Date().toISOString())}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "수양회 GBS 꼬리표 파일이 다운로드되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("수양회 GBS 꼬리표 다운로드 중 오류 발생:", error);
      let errorMessage = "수양회 GBS 꼬리표 다운로드 중 오류가 발생했습니다.";
      
      if (error instanceof AxiosError) {
        if (error.response?.data) {
          // Blob 응답인 경우 텍스트로 변환
          if (error.response.data instanceof Blob) {
            try {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = `서버 오류: ${error.response.status} ${error.response.statusText}`;
            }
          } else if (typeof error.response.data === 'object') {
            errorMessage = error.response.data.message || error.response.data.error || errorMessage;
          } else {
            errorMessage = error.response.data || errorMessage;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      addToast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, exportRetreatGbsTags: false }));
    }
  };

  const handleDownloadFullLineupExcel = async () => {
    setLoadingStates(prev => ({ ...prev, exportExcel: true }));
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/line-up/full-lineup-excel`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `전체_라인업_${formatDate(new Date().toISOString())}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "전체 라인업 엑셀 파일이 다운로드되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("전체 라인업 엑셀 다운로드 중 오류 발생:", error);
      let errorMessage = "전체 라인업 엑셀 다운로드 중 오류가 발생했습니다.";
      
      if (error instanceof AxiosError) {
        if (error.response?.data) {
          // Blob 응답인 경우 텍스트로 변환
          if (error.response.data instanceof Blob) {
            try {
              const text = await error.response.data.text();
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = `서버 오류: ${error.response.status} ${error.response.statusText}`;
            }
          } else if (typeof error.response.data === 'object') {
            errorMessage = error.response.data.message || error.response.data.error || errorMessage;
          } else {
            errorMessage = error.response.data || errorMessage;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      addToast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, exportExcel: false }));
    }
  };

  // ✅ useMemo로 scheduleColumns 안정화 (필수!)
  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );



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
              setLoadingStates(prev => ({ ...prev, exportExcel: true }));
              try {
                const response = await webAxios.get(
                  `/api/v1/retreat/${retreatSlug}/line-up/full-lineup-excel`,
                  { responseType: 'blob' }
                );
                
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `수양회 GBS 라인업_${formatDate(new Date().toISOString()).replace(/[: ]/g, '_').replace(/\(/g, '').replace(/\)/g, '')}.xlsx`);
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
            onClick={handleDownloadUnivGbsLabel}
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
            onClick={handleDownloadRetreatGbsLabel}
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
      <CardContent className="px-1 pt-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="GBS번호/부서/학년/이름/타입/메모로 검색 ..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="rounded-md border">
            <div className="min-w-max">
              <div className="max-h-[80vh] overflow-auto">
                <Table className="w-full whitespace-nowrap relative">
                  <GbsLineUpTableHeader
                    scheduleColumns={scheduleColumns}
                    selectedDepartments={selectedDepartments}
                    setSelectedDepartments={setSelectedDepartments}
                    departmentOptions={departmentOptions}
                    isFilterModalOpen={isFilterModalOpen}
                    setIsFilterModalOpen={setIsFilterModalOpen}
                    includedSchedules={includedSchedules}
                    setIncludedSchedules={setIncludedSchedules}
                    excludedSchedules={excludedSchedules}
                    setExcludedSchedules={setExcludedSchedules}
                    isScheduleFilterModalOpen={isScheduleFilterModalOpen}
                    setIsScheduleFilterModalOpen={setIsScheduleFilterModalOpen}
                    showOnlyUnassigned={showOnlyUnassigned}
                    setShowOnlyUnassigned={setShowOnlyUnassigned}
                  />
                  <TableBody>
                    {Object.entries(groupedData).map(([gbsNum, groupRows]) => {
                      const withNumber = groupRows.filter(r => r.gbsNumber != null);
                      const withoutNumber = groupRows.filter(r => r.gbsNumber == null);

                      return [
                        ...withNumber.map((row, idx) => (
                          <GbsLineUpTableRow
                            key={row.id}
                            row={row}
                            groupSize={withNumber.length}
                            isFirstInGroup={idx === 0}
                            retreatSlug={retreatSlug}
                            scheduleColumns={scheduleColumns}
                            gbsNumberInput={gbsNumberInputs[row.id] || ""}
                            onGbsNumberInputChange={handleGbsNumberInputChange}
                            onSaveGbsNumber={handleSaveGbsNumber}
                            onSaveLineupMemo={handleSaveLineupMemo}
                            onUpdateLineupMemo={handleUpdateLineupMemo}
                            onDeleteLineupMemo={handleDeleteLineupMemo}
                            onSaveScheduleMemo={handleSaveScheduleMemo}
                            onUpdateScheduleMemo={handleUpdateScheduleMemo}
                            onDeleteScheduleMemo={handleDeleteScheduleMemo}
                            isLoading={isLoading}
                          />
                        )),
                        ...withoutNumber.map(row => (
                          <GbsLineUpTableRow
                            key={row.id}
                            row={row}
                            groupSize={1}
                            isFirstInGroup={false}
                            retreatSlug={retreatSlug}
                            scheduleColumns={scheduleColumns}
                            gbsNumberInput={gbsNumberInputs[row.id] || ""}
                            onGbsNumberInputChange={handleGbsNumberInputChange}
                            onSaveGbsNumber={handleSaveGbsNumber}
                            onSaveLineupMemo={handleSaveLineupMemo}
                            onUpdateLineupMemo={handleUpdateLineupMemo}
                            onDeleteLineupMemo={handleDeleteLineupMemo}
                            onSaveScheduleMemo={handleSaveScheduleMemo}
                            onUpdateScheduleMemo={handleUpdateScheduleMemo}
                            onDeleteScheduleMemo={handleDeleteScheduleMemo}
                            isLoading={isLoading}
                          />
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