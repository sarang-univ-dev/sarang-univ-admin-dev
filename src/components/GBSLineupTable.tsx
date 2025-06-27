"use client";

import React, { useState, useCallback } from "react";
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
import { useGBSLineup } from "@/hooks/useGBSLineup";
import { GBSLineupTableHeader } from "@/components/GBSLineup/TableHeader";
import { GBSLineupTableRow } from "@/components/GBSLineup/GBSLineupTableRow";
import { webAxios } from "@/lib/api/axios";

export const GBSLineupTable = React.memo(function GBSLineupTable({
  registrations = [],
  schedules = [],
  retreatSlug,
}: {
  registrations: any[];
  schedules: any[];
  retreatSlug: string;
}) {
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
    debouncedUpdateGbsNumber,
    handleSaveGbsNumber,
    handleSaveMemo,
    handleDeleteMemo,
  } = useGBSLineup(retreatSlug, registrations, schedules);

  // 일정 변동 메모 편집 시작 (메모가 없을 때만 가능)
  const handleStartEditScheduleMemo = useCallback((id: string, currentMemo: string) => {
    if (currentMemo && currentMemo.trim()) {
      return;
    }
    setEditingScheduleMemo(prev => ({ ...prev, [id]: true }));
    setScheduleMemoValues(prev => ({ ...prev, [id]: currentMemo || "" }));
  }, [setEditingScheduleMemo, setScheduleMemoValues]);

  // 일정 변동 메모 편집 취소
  const handleCancelEditScheduleMemo = useCallback((id: string) => {
    setEditingScheduleMemo(prev => ({ ...prev, [id]: false }));
    setScheduleMemoValues(prev => ({ ...prev, [id]: "" }));
  }, [setEditingScheduleMemo, setScheduleMemoValues]);

  // 일정 변동 메모 저장
  const handleSaveScheduleMemo = useCallback(async (id: string) => {
    alert('일정 변동 요청 메모 추가는 구현이 필요합니다');
  }, []);

  // 메모 편집 시작
  const handleStartEditMemo = useCallback((id: string, currentMemo: string, currentColor?: string) => {
    setEditingMemo(prev => ({ ...prev, [id]: true }));
    setMemoValues(prev => ({ ...prev, [id]: currentMemo || "" }));
    setMemoBgColors(prev => ({ 
      ...prev, 
      [id]: currentColor || "" 
    }));
  }, [setEditingMemo, setMemoValues, setMemoBgColors]);

  // 메모 편집 취소
  const handleCancelEditMemo = useCallback((id: string) => {
    setEditingMemo(prev => ({ ...prev, [id]: false }));
    setMemoValues(prev => ({ ...prev, [id]: "" }));
  }, [setEditingMemo, setMemoValues]);

  // 메모 삭제 확인
  const handleConfirmDeleteMemo = useCallback((id: string) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: () => handleDeleteMemo(id),
    });
  }, [confirmDialog, handleDeleteMemo]);

  // 메모 값 변경
  const handleMemoValueChange = useCallback((id: string, value: string) => {
    debouncedUpdateMemo(id, value);
  }, [debouncedUpdateMemo]);

  // 메모 배경색 변경
  const handleMemoBgColorChange = useCallback((id: string, color: string) => {
    setMemoBgColors(prev => ({ ...prev, [id]: color }));
  }, [setMemoBgColors]);

  // GBS 번호 입력 변경 - 디바운싱 적용
  const handleGbsNumberInputChange = useCallback((id: string, value: string) => {
    debouncedUpdateGbsNumber(id, value);
  }, [debouncedUpdateGbsNumber]);

  // 스케줄 메모 값 변경
  const handleScheduleMemoValueChange = useCallback((id: string, value: string) => {
    setScheduleMemoValues(prev => ({ ...prev, [id]: value }));
  }, [setScheduleMemoValues]);

  // 일정 체크박스 컬럼 정의
  const scheduleColumns = generateScheduleColumns(schedules);



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
            onClick={async () => {
              alert("부서 GBS 꼬리표 다운로드 기능은 구현이 필요합니다.");
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
          <div className="rounded-md border overflow-x-auto">
            <div className="min-w-max">
              <div className="max-h-[80vh] overflow-y-auto">
                <Table className="w-full whitespace-nowrap relative">
                  <GBSLineupTableHeader
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
                          <GBSLineupTableRow
                            key={row.id}
                            row={row}
                            groupSize={withNumber.length}
                            isFirstInGroup={idx === 0}
                            scheduleColumns={scheduleColumns}
                            editingMemo={editingMemo[row.id] || false}
                            memoValue={memoValues[row.id] || ""}
                            gbsNumberInput={gbsNumberInputs[row.id] || ""}
                            memoBgColor={memoBgColors[row.id] || ""}
                            editingScheduleMemo={editingScheduleMemo[row.id] || false}
                            scheduleMemoValue={scheduleMemoValues[row.id] || ""}
                            isLoading={isLoading}
                            onStartEditMemo={handleStartEditMemo}
                            onCancelEditMemo={handleCancelEditMemo}
                            onSaveMemo={handleSaveMemo}
                            onDeleteMemo={handleConfirmDeleteMemo}
                            onMemoValueChange={handleMemoValueChange}
                            onMemoBgColorChange={handleMemoBgColorChange}
                            onGbsNumberInputChange={handleGbsNumberInputChange}
                            onSaveGbsNumber={handleSaveGbsNumber}
                            onStartEditScheduleMemo={handleStartEditScheduleMemo}
                            onCancelEditScheduleMemo={handleCancelEditScheduleMemo}
                            onSaveScheduleMemo={handleSaveScheduleMemo}
                            onScheduleMemoValueChange={handleScheduleMemoValueChange}
                          />
                        )),
                        ...withoutNumber.map(row => (
                          <GBSLineupTableRow
                            key={row.id}
                            row={row}
                            groupSize={1}
                            isFirstInGroup={false}
                            scheduleColumns={scheduleColumns}
                            editingMemo={editingMemo[row.id] || false}
                            memoValue={memoValues[row.id] || ""}
                            gbsNumberInput={gbsNumberInputs[row.id] || ""}
                            memoBgColor={memoBgColors[row.id] || ""}
                            editingScheduleMemo={editingScheduleMemo[row.id] || false}
                            scheduleMemoValue={scheduleMemoValues[row.id] || ""}
                            isLoading={isLoading}
                            onStartEditMemo={handleStartEditMemo}
                            onCancelEditMemo={handleCancelEditMemo}
                            onSaveMemo={handleSaveMemo}
                            onDeleteMemo={handleConfirmDeleteMemo}
                            onMemoValueChange={handleMemoValueChange}
                            onMemoBgColorChange={handleMemoBgColorChange}
                            onGbsNumberInputChange={handleGbsNumberInputChange}
                            onSaveGbsNumber={handleSaveGbsNumber}
                            onStartEditScheduleMemo={handleStartEditScheduleMemo}
                            onCancelEditScheduleMemo={handleCancelEditScheduleMemo}
                            onSaveScheduleMemo={handleSaveScheduleMemo}
                            onScheduleMemoValueChange={handleScheduleMemoValueChange}
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