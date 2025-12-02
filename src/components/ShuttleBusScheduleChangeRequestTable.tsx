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
import { Search, X, PenLine, Loader2, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { StatusBadge } from "@/components/Badge";
import { generateShuttleBusScheduleColumns } from "../utils/bus-utils";
import {
  // TRetreatRegistrationSchedule,
  TRetreatShuttleBus,
  TRetreatPaymentSchedule,
} from "@/types";
import { formatDate, formatSimpleDate } from "@/utils/formatDate";
import { IUserScheduleChangeShuttleBus } from "@/hooks/user-schedule-change-bus-request";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { mutate } from "swr";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";

// 테이블에 필요한 데이터 변환 함수
const transformScheduleChangeRequestForTable = (
  requests: IUserScheduleChangeShuttleBus[],
  schedules: TRetreatShuttleBus[]
) => {
  return requests.map(req => ({
    id: req.userRetreatShuttleBusRegistrationId.toString(),
    department: `${req.univGroupNumber}부`,
    grade: `${req.gradeNumber}학년`,
    name: req.userName,
    schedule: schedules.reduce(
      (acc, cur) => {
        acc[`schedule_${cur.id}`] = (
          req.userRetreatShuttleBusRegistrationScheduleIds || []
        ).includes(cur.id);
        return acc;
      },
      {} as Record<string, boolean>
    ),
    amount: req.price,
    createdAt: req.createdAt,
    status: req.paymentStatus,
    issuerName: req.issuerName,
    paymentConfirmedAt: req.paymentConfirmedAt,
    memo: req.memo,
    memoCreatedAt: req.memoCreatedAt,
    memoId: req.userRetreatShuttleBusRegistrationHistoryMemoId,
    scheduleIds: req.userRetreatShuttleBusRegistrationScheduleIds || [],
  }));
};

export function ShuttleBusScheduleChangeRequestTable({
  registrations = [],
  schedules = [],
  retreatSlug,
  payments = [],
  retreatLocation,
}: {
  registrations: IUserScheduleChangeShuttleBus[];
  schedules: TRetreatShuttleBus[];
  retreatSlug: string;
  payments: TRetreatPaymentSchedule[];
  retreatLocation: string;
}) {
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirmDialogStore();
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [memoText, setMemoText] = useState("");
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // *** 엔드포인트: 서버 라우트와 일치하도록 수정 ***
  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/shuttle-bus/bus-registration-change-request`;

  useEffect(() => {
    if (registrations.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformScheduleChangeRequestForTable(
          registrations,
          schedules
        );
        setData(transformedData);
        setFilteredData(transformedData);
      } catch (error) {
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
      setData([]);
      setFilteredData([]);
    }
  }, [registrations, schedules, addToast]);

  useEffect(() => {
    let dataToFilter = [...data];
    if (searchTerm) {
      dataToFilter = dataToFilter.filter(row =>
        [
          row.name,
          row.department,
          row.grade?.toString(),
          row.memo?.toString(),
        ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredData(dataToFilter);
  }, [data, searchTerm]);

  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  const isLoading = (id: string, action: string) => {
    return !!loadingStates[`${id}_${action}`];
  };

  // 모달 핸들링
  const handleProcessSchedule = (row: any) => {
    setSelectedRow(row);
    setMemoText(row.memo || "");
    setSelectedSchedules(row.scheduleIds || []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
    setMemoText("");
    setSelectedSchedules([]);
  };

  // 일정 변경 처리
  const handleConfirmScheduleChange = async () => {
    if (!selectedRow) return;
    confirmDialog.show({
      title: "일정 변동 처리 완료",
      description: "해당 일정 변동 요청을 처리하시겠습니까?",
      onConfirm: async () => {
        setLoading(selectedRow.id, "confirm", true);
        try {
          await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/shuttle-bus/${selectedRow.id}/confirm-schedule-change`,
            {
              afterScheduleIds: selectedSchedules,
            }
          );
          await mutate(registrationsEndpoint);
          addToast({
            title: "성공",
            description: "일정 변경 요청이 처리되었습니다.",
            variant: "success",
          });
          handleCloseModal();
        } catch (error) {
          addToast({
            title: "오류",
            description:
              error instanceof AxiosError
                ? error.response?.data?.message || error.message
                : error instanceof Error
                  ? error.message
                  : "일정 변경 요청 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        } finally {
          if (selectedRow) {
            setLoading(selectedRow.id, "confirm", false);
          }
        }
      },
    });
  };

  // 일정 처리 완료 (메모 기준)
  const handleResolveScheduleChange = async (row: any) => {
    if (!row.memoId) {
      addToast({
        title: "오류",
        description: "메모 ID가 없습니다.",
        variant: "destructive",
      });
      return;
    }
    setLoading(row.id, "resolve", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${row.memoId}/resolve-memo`,
        {}
      );
      await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "일정 변경 요청이 처리 완료되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "일정 변경 요청 처리 완료 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(row.id, "resolve", false);
    }
  };

  const scheduleColumns = useMemo(
    () => generateShuttleBusScheduleColumns(schedules),
    [schedules]
  );

  // 셔틀버스 일정 변동 후 금액
  const calculateBusPrice = (newSelectedSchedules: number[]) => {
    try {
      // 사용할 스케줄 데이터 결정
      const schedulesToUse = schedules; // 또는 retreatInfo.shuttleBuses, 상황에 따라

      // 금액 합계 구하기
      const newPrice = schedulesToUse
        .filter(bus =>
          newSelectedSchedules.map(Number).includes(Number(bus.id))
        )
        .reduce((sum, bus) => sum + (bus.price || 0), 0);

      // 정책: 이전 금액과 비교 (예: 이전 금액보다 낮아지면 안 된다면)
      const maxPrice = Math.max(selectedRow.amount || 0, newPrice);

      setCalculatedPrice(maxPrice);
    } catch (error) {
      console.error("셔틀버스 가격 계산 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    if (selectedRow && selectedSchedules.length > 0) {
      calculateBusPrice(selectedSchedules);
    }
    // schedules도 의존성에 추가하면 더 안전함
  }, [selectedRow, selectedSchedules, schedules]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div className="whitespace-nowrap">
          <CardTitle>셔틀버스 일정 변경 요청</CardTitle>
          <CardDescription>셔틀버스 일정 변경 요청 목록</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="검색 (이름, 부서, 학년, 메모 등)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div
            className="rounded-md border flex flex-col h-[calc(100vh-300px)]"
            ref={tableContainerRef}
          >
            <div className="overflow-auto flex-grow">
                <Table className="w-full whitespace-nowrap relative">
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        부서
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        학년
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap sticky left-0 bg-gray-50 z-20"
                      >
                        이름
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="whitespace-nowrap"
                      >
                        <div className="text-center">신청 셔틀버스 일정</div>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        금액
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        신청 시각
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        입금 현황
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        메모 작성자명
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        메모 작성 시각
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        메모 내용
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        메모 작성일
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        액션
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumns.map(scheduleCol => (
                        <TableHead
                          key={scheduleCol.key}
                          className="p-2 text-center whitespace-pre-line"
                        >
                          <span className="text-xs">{scheduleCol.label}</span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11 + scheduleColumns.length}
                          className="text-center py-8 text-gray-500"
                        >
                          데이터가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map(row => (
                        <TableRow
                          key={row.id}
                          className="group hover:bg-gray-50 transition-colors duration-150"
                        >
                          <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                            {row.department}
                          </TableCell>
                          <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                            {row.grade}
                          </TableCell>
                          <TableCell className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center whitespace-nowrap">
                            {row.name}
                          </TableCell>
                          {scheduleColumns.map(col => (
                            <TableCell
                              key={`${row.id}-${col.key}`}
                              className="p-2 text-center group-hover:bg-gray-50 whitespace-nowrap"
                            >
                              <Checkbox
                                checked={row.schedule[col.key]}
                                disabled
                                className={
                                  row.schedule[col.key] ? col.bgColorClass : ""
                                }
                              />
                            </TableCell>
                          ))}
                          <TableCell className="font-medium group-hover:bg-gray-50 text-center whitespace-nowrap">
                            {row.amount.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap">
                            {row.createdAt ? formatDate(row.createdAt) : "-"}
                          </TableCell>
                          <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                            {row.issuerName || "-"}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap">
                            {formatDate(row.paymentConfirmedAt)}
                          </TableCell>
                          <TableCell
                            className="group-hover:bg-gray-50 text-center min-w-[200px] max-w-[300px] whitespace-pre-wrap break-words px-3 py-2.5"
                            title={row.memo}
                          >
                            {row.memo || "-"}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap">
                            {formatDate(row.memoCreatedAt)}
                          </TableCell>
                          <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessSchedule(row)}
                                disabled={isLoading(row.id, "confirm")}
                                className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
                              >
                                {isLoading(row.id, "confirm") ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <PenLine className="h-3.5 w-3.5" />
                                )}
                                <span>일정 처리</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveScheduleChange(row)}
                                disabled={isLoading(row.id, "resolve")}
                                className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors"
                              >
                                {isLoading(row.id, "resolve") ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                <span>처리 완료</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
      </CardContent>

      {isModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl transform transition-all duration-300 ease-out scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">일정 변경 처리</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">이름</p>
                  <p className="font-medium">{selectedRow.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">부서</p>
                  <p className="font-medium">
                    {selectedRow.department} {selectedRow.grade}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">메모</h4>
                <p className="text-sm text-gray-500">
                  {memoText || "메모 없음"}
                </p>
              </div>
              {/* 필요하다면 셔틀버스 일정 선택 UI를 추가 */}
              <div className="mt-6">
                <h4 className="font-medium mb-2">버스 시간표</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center whitespace-nowrap">
                          선택
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          버스 정보
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          출발지
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          도착지
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          출발 시간
                        </TableHead>
                        {/* 필요한 만큼 컬럼 추가 */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map(schedule => (
                        <TableRow key={schedule.id}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedSchedules.includes(schedule.id)}
                              onCheckedChange={() => {
                                if (selectedSchedules.includes(schedule.id)) {
                                  setSelectedSchedules(
                                    selectedSchedules.filter(
                                      id => id !== schedule.id
                                    )
                                  );
                                } else {
                                  setSelectedSchedules([
                                    ...selectedSchedules,
                                    schedule.id,
                                  ]);
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {schedule.name || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {/* 출발지 */}
                            {schedule.direction === "FROM_CHURCH_TO_RETREAT"
                              ? "서초 사랑의교회"
                              : retreatLocation || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {/* 도착지 */}
                            {schedule.direction === "FROM_CHURCH_TO_RETREAT"
                              ? retreatLocation || "-"
                              : "서초 사랑의교회"}
                          </TableCell>
                          <TableCell className="text-center">
                            {schedule.departureTime
                              ? formatDate(
                                  typeof schedule.departureTime === "string"
                                    ? schedule.departureTime
                                    : schedule.departureTime.toISOString()
                                )
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {/* === 버스 시간표 끝 === */}
              <div className="mt-4 flex justify-between">
                <p className="font-medium">이전 금액:</p>
                <p>{selectedRow.amount.toLocaleString()}원</p>
              </div>
              <div className="mt-2 flex justify-between">
                <p className="font-medium">변경 후 금액:</p>
                <p>{calculatedPrice.toLocaleString()}원</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                취소
              </Button>
              <Button
                onClick={handleConfirmScheduleChange}
                disabled={isLoading(selectedRow.id, "confirm")}
                className="hover:bg-black hover:text-white transition-colors"
              >
                {isLoading(selectedRow.id, "confirm") ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                일정 변동 처리 완료
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
