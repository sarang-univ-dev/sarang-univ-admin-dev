"use client";

import { AxiosError } from "axios";
import { CheckCircle2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { GenderBadge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { IUserScheduleChangeDormitory } from "@/hooks/user-schedule-change-dormitory-request";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { TRetreatRegistrationSchedule } from "@/types";
import { formatDate } from "@/utils/formatDate";

import { generateScheduleColumns } from "../utils/retreat-utils";

type DormitoryScheduleChangeRow = {
  id: string;
  registrationId: number;
  historyMemoId: number;
  department: string;
  gender: IUserScheduleChangeDormitory["gender"];
  grade: string;
  name: string;
  gbsNumber?: number;
  dormitoryLocation?: string;
  schedule: Record<string, boolean>;
  memo?: string;
  issuerName?: string;
  memoCreatedAt?: string;
  dormitoryReviewerName?: string;
};

const buildScheduleMap = (
  scheduleIds: number[],
  schedules: TRetreatRegistrationSchedule[]
) =>
  schedules.reduce(
    (acc, cur) => {
      const scheduleId = cur.id;
      acc[`schedule_${cur.id}`] =
        scheduleIds.includes(scheduleId) ||
        scheduleIds.includes(scheduleId.toString() as any) ||
        scheduleIds.includes(parseInt(scheduleId.toString()));
      return acc;
    },
    {} as Record<string, boolean>
  );

const transformScheduleChangeRequestsForTable = (
  requests: IUserScheduleChangeDormitory[],
  schedules: TRetreatRegistrationSchedule[]
): DormitoryScheduleChangeRow[] =>
  requests.map((request, index) => ({
    id: `${request.userRetreatRegistrationId}_${index}`,
    registrationId: request.userRetreatRegistrationId,
    historyMemoId: request.userRetreatRegistrationHistoryMemoId,
    department: `${request.univGroupNumber}부`,
    gender: request.gender,
    grade: `${request.gradeNumber}학년`,
    name: request.userName,
    gbsNumber: request.gbsNumber,
    dormitoryLocation: request.dormitoryLocation,
    schedule: buildScheduleMap(
      Array.isArray(request.userRetreatRegistrationScheduleIds)
        ? request.userRetreatRegistrationScheduleIds
        : [],
      schedules
    ),
    memo: request.memo,
    issuerName: request.issuerName,
    memoCreatedAt: request.memoCreatedAt,
    dormitoryReviewerName: request.dormitoryReviewerName,
  }));

export function RetreatScheduleChangeHistoryTable({
  scheduleChangeHistories = [],
  schedules = [],
  retreatSlug,
  mutate,
}: {
  scheduleChangeHistories: IUserScheduleChangeDormitory[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
  mutate?: () => void | Promise<unknown>;
}) {
  const addToast = useToastStore(state => state.add);
  const [allData, setAllData] = useState<DormitoryScheduleChangeRow[]>([]);
  const [filteredData, setFilteredData] = useState<
    DormitoryScheduleChangeRow[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const confirmDialog = useConfirm();

  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  useEffect(() => {
    if (scheduleChangeHistories.length > 0 && schedules.length > 0) {
      try {
        setAllData(
          transformScheduleChangeRequestsForTable(
            scheduleChangeHistories,
            schedules
          )
        );
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
    if (!searchTerm) {
      setFilteredData(allData);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    setFilteredData(
      allData.filter(row =>
        [
          row.name,
          row.department,
          row.grade,
          row.gbsNumber?.toString(),
          row.dormitoryLocation,
          row.memo,
          row.issuerName,
          row.dormitoryReviewerName,
        ].some(field => field?.toLowerCase().includes(lowerSearchTerm))
      )
    );
  }, [allData, searchTerm]);

  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  const isLoading = (id: string, action: string) =>
    !!loadingStates[`${id}_${action}`];

  const performResolveChange = async (historyMemoId: number) => {
    setLoading(historyMemoId.toString(), "confirm", true);

    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/dormitory/schedule-history/resolve-memo`,
        {
          userRetreatRegistrationHistoryMemoId: historyMemoId,
        }
      );

      addToast({
        title: "성공",
        description: "수양회 일정 변경이 읽음 처리되었습니다.",
        variant: "success",
      });

      await mutate?.();
    } catch (error) {
      console.error("수양회 일정 변경 읽음 처리 중 오류 발생:", error);
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "수양회 일정 변경 읽음 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(historyMemoId.toString(), "confirm", false);
    }
  };

  const handleResolveChange = (historyMemoId: number) => {
    void confirmDialog.open({
      title: "일정 변경 읽음 처리",
      description: "정말로 수양회 일정 변경을 읽음 처리하시겠습니까?",
      onConfirm: () => performResolveChange(historyMemoId),
    });
  };

  const renderReviewCell = (row: DormitoryScheduleChangeRow) => {
    if (row.dormitoryReviewerName) {
      return (
        <span className="text-sm font-medium text-green-600">
          {row.dormitoryReviewerName}
        </span>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleResolveChange(row.historyMemoId)}
        disabled={isLoading(row.historyMemoId.toString(), "confirm")}
        className="inline-flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
      >
        {isLoading(row.historyMemoId.toString(), "confirm") ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        <span>읽음 처리</span>
      </Button>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gray-50 border-b px-4 py-3">
        <CardTitle className="text-lg">인원관리 일정변경 이력</CardTitle>
        <CardDescription className="text-sm">
          인원관리 간사가 확인해야 하는 기존 수양회 신청 일정변경 메모 목록
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="통합 검색"
              className="pl-8"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
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
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      부서
                    </TableHead>
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      성별
                    </TableHead>
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      학년
                    </TableHead>
                    <TableHead
                      className="sticky left-0 bg-gray-100 z-20 text-center px-3 py-2.5"
                      rowSpan={2}
                    >
                      이름
                    </TableHead>
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      GBS 번호
                    </TableHead>
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      숙소
                    </TableHead>
                    <TableHead
                      colSpan={scheduleColumns.length}
                      className="text-center px-3 py-2.5"
                    >
                      수양회 일정
                    </TableHead>
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      메모
                    </TableHead>
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      작성자
                    </TableHead>
                    <TableHead className="text-center px-3 py-2.5" rowSpan={2}>
                      작성일시
                    </TableHead>
                    <TableHead className="text-center px-6 py-2.5" rowSpan={2}>
                      처리자/액션
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    {scheduleColumns.map(scheduleCol => (
                      <TableHead
                        key={scheduleCol.key}
                        className="p-2 text-center"
                      >
                        <span className="text-xs whitespace-normal">
                          {scheduleCol.label}
                        </span>
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
                  {filteredData.map(row => (
                    <TableRow
                      key={row.id}
                      className="group hover:bg-gray-50 transition-colors duration-150"
                    >
                      <TableCell className="text-center px-3 py-2.5">
                        {row.department}
                      </TableCell>
                      <TableCell className="text-center px-3 py-2.5">
                        <GenderBadge gender={row.gender} />
                      </TableCell>
                      <TableCell className="text-center px-3 py-2.5">
                        {row.grade}
                      </TableCell>
                      <TableCell className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center px-3 py-2.5">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-center px-3 py-2.5">
                        {row.gbsNumber || "-"}
                      </TableCell>
                      <TableCell className="text-center px-3 py-2.5">
                        {row.dormitoryLocation || "-"}
                      </TableCell>
                      {scheduleColumns.map(col => {
                        const isChecked = !!row.schedule?.[col.key];

                        return (
                          <TableCell
                            key={`${row.id}-${col.key}`}
                            className="p-2 text-center"
                          >
                            <Checkbox
                              checked={isChecked}
                              disabled
                              className={isChecked ? col.bgColorClass : ""}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="min-w-[200px] max-w-[400px] text-left px-3 py-2.5">
                        <div className="text-sm text-gray-600 whitespace-pre-wrap break-words p-2 bg-gray-50 rounded min-h-[24px]">
                          {row.memo || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-3 py-2.5">
                        {row.issuerName || "-"}
                      </TableCell>
                      <TableCell className="text-gray-600 text-xs text-center whitespace-nowrap px-3 py-2.5">
                        {formatDate(row.memoCreatedAt ?? null) || "-"}
                      </TableCell>
                      <TableCell className="text-center px-6 py-2.5">
                        {renderReviewCell(row)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
