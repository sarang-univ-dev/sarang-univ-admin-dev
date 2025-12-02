"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { GenderBadge } from "@/components/Badge";
import { generateScheduleColumns } from "../utils/retreat-utils";
import { TRetreatRegistrationSchedule } from "@/types";
import { formatDate } from "@/utils/formatDate";
import { useToastStore } from "@/store/toast-store";
import { AxiosError } from "axios";
import { IUserScheduleChangeLineup } from "@/hooks/user-schedule-change-lineup-request";
import { webAxios } from "@/lib/api/axios";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";

const transformScheduleChangeRequestsForTable = (
  requests: IUserScheduleChangeLineup[],
  schedules: TRetreatRegistrationSchedule[]
) => {
  const transformedData: any[] = [];

  requests.forEach((request, index) => {
    // 현재 등록된 일정 처리
    const currentScheduleIds = Array.isArray(request.userRetreatRegistrationScheduleIds)
      ? request.userRetreatRegistrationScheduleIds
      : [];

    // 현재 일정 스케줄 맵 생성
    const currentScheduleMap = schedules.reduce(
      (acc, cur) => {
        const scheduleId = cur.id;
        const isIncluded =
          currentScheduleIds.includes(scheduleId) ||
          currentScheduleIds.includes(scheduleId.toString() as any) ||
          currentScheduleIds.includes(parseInt(scheduleId.toString()));
        acc[`schedule_${cur.id}`] = isIncluded;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const row = {
      id: `${request.userRetreatRegistrationId}_${index}`,
      registrationId: request.userRetreatRegistrationId,
      historyMemoId: request.userRetreatRegistrationHistoryMemoId,
      department: `${request.univGroupNumber}부`,
      gender: request.gender,
      grade: `${request.gradeNumber}학년`,
      name: request.userName,
      currentLeader: request.currentLeaderName,
      gbsNumber: request.gbsNumber,
      gbsLeaderNames: request.gbsLeaderNames,
      schedule: currentScheduleMap,
      memo: request.memo,
      issuerName: request.issuerName,
      memoCreatedAt: request.memoCreatedAt,
      userType: request.userType,
      createdAt: request.createdAt,
      lineupReviewerName: request.lineupReviewerName,
      rowIndex: index,
    };

    transformedData.push(row);
  });

  return transformedData;
};

export function RetreatScheduleChangeHistoryTable({
  scheduleChangeHistories = [],
  schedules = [],
  retreatSlug,
  mutate,
}: {
  scheduleChangeHistories: IUserScheduleChangeLineup[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
  mutate?: () => Promise<any>;
}) {
  const addToast = useToastStore(state => state.add);
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const confirmDialog = useConfirmDialogStore();

  // 로딩 상태 설정 함수
  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  // 로딩 상태 확인 함수
  const isLoading = (id: string, action: string) => {
    return !!loadingStates[`${id}_${action}`];
  };

  useEffect(() => {
    if (scheduleChangeHistories.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformScheduleChangeRequestsForTable(
          scheduleChangeHistories,
          schedules
        );
        setAllData(transformedData);
      } catch (error) {
        console.error("데이터 변환 중 오류 발생:", error);
        addToast({
          title: "오류",
          description:
            error instanceof AxiosError
              ? error.response?.data?.message || error.message
              : error instanceof Error
                ? error.message
                : "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } else {
      setAllData([]);
    }
  }, [scheduleChangeHistories, schedules, addToast]);

  useEffect(() => {
    let dataToFilter = [...allData];

    if (searchTerm) {
      dataToFilter = dataToFilter.filter(row =>
        [
          row.name,
          row.department,
          row.grade?.toString(),
          row.currentLeader?.toString(),
          row.gbsNumber?.toString(),
          row.memo?.toString(),
          row.issuerName?.toString(),
        ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredData(dataToFilter);
  }, [allData, searchTerm]);

  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  const renderTableRow = (row: any, index: number) => {
    return (
      <TableRow
        key={row.id}
        className="group hover:bg-gray-50 transition-colors duration-150"
      >
        {/* 부서 */}
        <TableCell className="text-center px-3 py-2.5">
          {row.department}
        </TableCell>

        {/* 성별 */}
        <TableCell className="text-center px-3 py-2.5">
          <GenderBadge gender={row.gender} />
        </TableCell>

        {/* 학년 */}
        <TableCell className="text-center px-3 py-2.5">
          {row.grade}
        </TableCell>

        {/* 이름 */}
        <TableCell
          className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center px-3 py-2.5"
        >
          {row.name}
        </TableCell>

        {/* 현재 리더 */}
        <TableCell
          className="font-medium text-center px-3 py-2.5"
        >
          {row.currentLeader || "-"}
        </TableCell>

        {/* GBS */}
        <TableCell className="text-center px-3 py-2.5">
          {row.gbsNumber ? `${row.gbsNumber}` : "-"}
        </TableCell>

        {/* 일정 */}
        {scheduleColumns.map(col => {
          const isChecked = !!row.schedule?.[col.key];

          return (
            <TableCell key={`${row.id}-${col.key}`} className="p-2 text-center">
              <Checkbox
                checked={isChecked}
                disabled
                className={isChecked ? col.bgColorClass : ""}
              />
            </TableCell>
          );
        })}

        {/* 변경 요청 메모 */}
        <TableCell className="min-w-[200px] max-w-[400px] text-left px-3 py-2.5">
          <div className="text-sm text-gray-600 whitespace-pre-wrap break-words p-2 bg-gray-50 rounded min-h-[24px]">
            {row.memo || "-"}
          </div>
        </TableCell>

        {/* 작성자 */}
        <TableCell className="text-center px-3 py-2.5">
          {row.issuerName || "-"}
        </TableCell>

        {/* 작성일시 */}
        <TableCell className="text-gray-600 text-xs text-center whitespace-nowrap px-3 py-2.5">
          {formatDate(row.memoCreatedAt) || "-"}
        </TableCell>

        {/* 라인업 처리자 */}
        <TableCell className="font-medium text-center px-3 py-2.5">
          {getActionButtons(row)}
        </TableCell>
      </TableRow>
    );
  };

  // 액션 처리 함수들
  const performResolveChange = async (historyMemoId: number) => {
    setLoading(historyMemoId.toString(), "confirm", true);
    try {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/line-up/schedule-history/resolve-memo`,
        {
          userRetreatRegistrationHistoryMemoId: historyMemoId
        }
      );

      // 성공 토스트 메시지
      addToast({
        title: "성공",
        description: "일정 변경 요청이 읽음 처리되었습니다.",
        variant: "success",
      });

      // 데이터 새로고침
      if (mutate) {
        await mutate();
      }
    } catch (error) {
      console.error("일정 변경 요청 읽음 처리 중 오류 발생:", error);

      // 실패 토스트 메시지
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "일정 변경 요청 읽음 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(historyMemoId.toString(), "confirm", false);
    }
  };

  const handleResolveChange = (historyMemoId: number) => {
    confirmDialog.show({
      title: "일정 변경 요청 읽음 처리",
      description:
        "정말로 이 일정 변경 요청을 읽음 처리하시겠습니까?",
      onConfirm: () => performResolveChange(historyMemoId),
    });
  };

  // 라인업 처리자 정보 렌더링
  const getActionButtons = (row: any) => {
    // 라인업 처리자가 있으면 이름 표시, 없으면 읽음 처리 버튼 표시
    if (row.lineupReviewerName) {
      return (
        <div className="text-center px-3 py-2.5">
          <span className="text-sm font-medium text-green-600">
            {row.lineupReviewerName}
          </span>
        </div>
      );
    }

    return(
      <div className="flex flex-col gap-1">
        <Button
            size="sm"
            variant="outline"
            onClick={() => handleResolveChange(row.historyMemoId)}
            disabled={isLoading(row.historyMemoId?.toString(), "confirm")}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
          >
            {isLoading(row.historyMemoId?.toString(), "confirm") ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>읽음 처리</span>
          </Button>
      </div>
    )
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gray-50 border-b px-4 py-3">
        <div>
          <CardTitle className="text-lg">일정 변경 요청 조회</CardTitle>
          <CardDescription className="text-sm">
            처리 대기 중인 일정 변경 요청 목록
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="통합 검색 (이름, 부서, 학년, 현재 리더, GBS, 메모, 작성자 등)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            className="rounded-md border overflow-hidden"
            ref={tableContainerRef}
          >
            <div className="max-h-[80vh] overflow-auto">
                <Table className="min-w-full whitespace-nowrap relative text-sm">
                  <TableHeader className="bg-gray-100 sticky top-0 z-10 select-none">
                    <TableRow>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>부서</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>성별</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>학년</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="sticky left-0 bg-gray-100 z-20 px-3 py-2.5"
                        rowSpan={2}
                      >
                        <div className="flex items-center space-x-1 justify-center">
                          <span>이름</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>부서 리더</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>GBS</span>
                        </div>
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="text-center px-3 py-2.5"
                      >
                        일정
                      </TableHead>
                      <TableHead className="px-6 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>변경 요청 메모</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-6 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>작성자</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-8 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>작성일시</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-6 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>라인업 처리자</span>
                        </div>
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumns.map(scheduleCol => (
                        <TableHead
                          key={scheduleCol.key}
                          className="p-2 text-center"
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-xs whitespace-normal">
                              {scheduleCol.label}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={11 + scheduleColumns.length}
                          className="text-center py-10 text-gray-500"
                        >
                          {allData.length > 0
                            ? "검색 결과가 없습니다."
                            : "표시할 데이터가 없습니다."}
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredData.map((row, index) =>
                      renderTableRow(row, index)
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}
