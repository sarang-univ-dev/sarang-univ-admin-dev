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
import {
  Download,
  Search,
  X,
  PenLine,
  Loader2,
  Sunrise,
  Sun,
  Sunset,
  Bed,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { generateScheduleColumns } from "../utils/retreat-utils";
import {
  TRetreatRegistrationSchedule,
  TRetreatPaymentSchedule,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";
import { formatDate, formatSimpleDate } from "@/utils/formatDate";
import { IUserScheduleChangeRetreat } from "@/hooks/user-schedule-change-retreat-request";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { mutate } from "swr";
import { calculateRegistrationPrice } from "@/utils/calculateRegistrationPrice";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import useSWR from "swr";
import { AxiosError } from "axios";

// 이벤트 타입을 한글로 매핑
const EVENT_TYPE_MAP: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SLEEP: "숙박",
};

const transformScheduleChangeRequestForTable = (
  requests: IUserScheduleChangeRetreat[],
  schedules: TRetreatRegistrationSchedule[]
) => {
  return requests.map(req => ({
    id: req.userRetreatRegistrationId.toString(),
    department: `${req.univGroupNumber}부`,
    grade: `${req.gradeNumber}학년`,
    name: req.userName,
    schedule: schedules.reduce((acc, cur) => {
      acc[`schedule_${cur.id}`] = (
        req.userRetreatRegistrationScheduleIds || []
      ).includes(cur.id);
      return acc;
    }, {} as Record<string, boolean>),
    type: req.userType,
    amount: req.price,
    createdAt: req.createdAt,
    status: req.paymentStatus,
    issuerName: req.issuerName,
    paymentConfirmedAt: req.paymentConfirmedAt,
    memo: req.memo,
    memoCreatedAt: req.memoCreatedAt,
    memoId: req.userRetreatRegistrationHistoryMemoId,
    scheduleIds: req.userRetreatRegistrationScheduleIds || [],
  }));
};

export function RetreatScheduleChangeRequestTable({
  registrations = [],
  schedules = [],
  retreatSlug,
  payments = [],
}: {
  registrations: IUserScheduleChangeRetreat[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
  payments: TRetreatPaymentSchedule[];
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
  const [retreatInfo, setRetreatInfo] = useState<any>(null);

  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/account/schedule-change-request`;

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
          row.type?.toString(),
          row.confirmedBy?.toString(),
          row.memo?.toString(),
        ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredData(dataToFilter);
  }, [data, searchTerm]);

  useEffect(() => {
    const getRetreatInfo = async () => {
      try{
        const response = await webAxios.get(`/api/v1/retreat/${retreatSlug}/info`);
        setRetreatInfo(response.data.retreatInfo);
      } catch(error){
        console.error("Retreat 조회 중 오류 발생:", error);
      }
    }
    getRetreatInfo();
  }, []);

  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  const isLoading = (id: string, action: string) => {
    return !!loadingStates[`${id}_${action}`];
  };

  // TODO: 일정 변동 시 변동 금액 계산하는 로직 필요
  // 현재 날짜에 유효한 payment를 찾는 함수
  const findCurrentPayment = () => {
    const currentDate = new Date();
    if (payments.length === 0) {
      return null;
    }

    // 현재 유효한 payment 찾기
    const validPayment = payments.find(
      (payment: TRetreatPaymentSchedule) =>
        new Date(payment.startAt) <= currentDate &&
        new Date(payment.endAt) >= currentDate
    );

    if (validPayment) {
      return validPayment;
    }

    // 유효한 payment가 없는 경우
    // 현재 이후 가장 이른 payment 찾기
    return payments.reduce(
      (earliest: TRetreatPaymentSchedule, current: TRetreatPaymentSchedule) => {
        const currentEndDate = new Date(current.endAt);
        const earliestEndDate = new Date(earliest.endAt);

        // 현재 날짜 이후의 payment만 고려
        if (currentEndDate < currentDate) return earliest;
        if (earliestEndDate < currentDate) return current;

        // 둘 다 현재 이후라면 더 이른 날짜의 payment 반환
        return currentEndDate < earliestEndDate ? current : earliest;
      }
    );
  };

  // 표시 목적으로 일정에서 고유한 날짜 추출
  const retreatDatesForDisplay = useMemo(
    () =>
      schedules.length > 0
        ? Array.from(
            new Set(
              schedules.map(s => new Date(s.time).toISOString().split("T")[0])
            )
          ).sort()
        : [],
    [schedules]
  );

  // 새로운 일정 선택 처리 함수
  const handleScheduleChange = (id: number) => {
    const newSelectedSchedules = selectedSchedules.includes(id)
      ? selectedSchedules.filter(scheduleId => scheduleId !== id)
      : [...selectedSchedules, id];

    setSelectedSchedules(newSelectedSchedules);

    // 체크박스 변경 즉시 가격 계산
    if (selectedRow && payments.length > 0) {
      calculateNewPrice(newSelectedSchedules);
    }
  };

  // 가격 계산 함수
  const calculateNewPrice = (newSelectedSchedules: number[]) => {

    try {
      const currentPayment = findCurrentPayment();
      if (!currentPayment) {
        return;
      }

      // 사용할 스케줄 데이터 결정
      const schedulesToUse =
        retreatInfo && retreatInfo.schedule ? retreatInfo.schedule : schedules;

      const calculatedNewPrice = calculateRegistrationPrice(
        selectedRow.type,
        schedulesToUse,
        [currentPayment],
        newSelectedSchedules,
        parseInt(selectedRow.grade)
      );

      // 새로운 가격은 max(이전 가격, 변경된 일정으로 계산된 가격)
      const calculatedMaxPrice = Math.max(
        selectedRow.amount,
        calculatedNewPrice
      );
      setCalculatedPrice(calculatedMaxPrice);
    } catch (error) {
      console.error("가격 계산 중 오류 발생:", error);
    }
  };

  // 처음 모달이 열릴 때 선택된 일정에 대해 금액 계산하도록 수정
  useEffect(() => {
    if (selectedRow && selectedSchedules.length > 0 && payments.length > 0) {
      calculateNewPrice(selectedSchedules);
    }
  }, [selectedRow, selectedSchedules, payments]);

  const handleProcessSchedule = (row: any) => {
    setSelectedRow(row);
    setMemoText(row.memo || "");
    setSelectedSchedules(row.scheduleIds || []);
    setIsModalOpen(true);

    // 모달 열릴 때 바로 가격 계산
    if (row.scheduleIds && row.scheduleIds.length > 0) {
      // 리트릿 정보가 로드되었는지 확인
      if (retreatInfo) {
        calculateNewPrice(row.scheduleIds);
      } else {
        // 필요한 정보가 없으면 토스트 메시지 표시
        addToast({
          title: "정보 로드 중",
          description:
            "리트릿 정보를 로드 중입니다. 잠시 후 다시 시도해주세요.",
          variant: "default",
        });
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
    setMemoText("");
    setSelectedSchedules([]);
    setCalculatedPrice(0);
  };

  const handleConfirmScheduleChange = async () => {
    if (!selectedRow) return;

    confirmDialog.show({
      title: "일정 변동 처리 완료",
      description: "해당 일정 변동 요청을 처리하시겠습니까?",
      onConfirm: async () => {
        setLoading(selectedRow.id, "confirm", true);
        try {
          // 일정 변경 요청 처리 API 호출
          await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/account/schedule-history`,
            {
              userRetreatRegistrationId: selectedRow.id,
              afterScheduleIds: selectedSchedules,
            }
          );

          // 데이터 갱신
          await mutate(registrationsEndpoint);

          addToast({
            title: "성공",
            description: "일정 변경 요청이 처리되었습니다.",
            variant: "success",
          });

          handleCloseModal();
        } catch (error) {
          console.error("일정 변경 요청 처리 중 오류 발생:", error);
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
      // 일정 변경 요청 처리 완료 API 호출
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/account/schedule-history/resolve-memo`,
        {
          userRetreatRegistrationHistoryMemoId: row.memoId,
        }
      );

      // 데이터 갱신
      await mutate(registrationsEndpoint);

      addToast({
        title: "성공",
        description: "일정 변경 요청이 처리 완료되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("일정 변경 요청 처리 완료 중 오류 발생:", error);
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

  const exportToExcel = () => {
    alert("엑셀 내보내기 기능은 구현이 필요합니다.");
  };

  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div className="whitespace-nowrap">
          <CardTitle>일정 변경 요청 조회</CardTitle>
          <CardDescription>일정 변경 요청 목록</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="검색 (이름, 부서, 학년, 타입, 처리자, 메모 등)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            className="rounded-md border flex flex-col h-[calc(100vh-300px)]"
            ref={tableContainerRef}
          >
            <div className="overflow-y-auto flex-grow">
              <div className="overflow-x-auto">
                <Table className="w-full whitespace-nowrap relative">
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>부서</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>학년</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap sticky left-0 bg-gray-50 z-20"
                      >
                        <span>이름</span>
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="whitespace-nowrap"
                      >
                        <div className="text-center">수양회 신청 일정</div>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>타입</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>금액</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>신청 시각</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>입금 현황</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>메모 작성자명</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>메모 작성 시각</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>메모 내용</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>메모 작성일</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>액션</span>
                      </TableHead>
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
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={13 + scheduleColumns.length}
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
                          <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                            <TypeBadge type={row.type} />
                          </TableCell>
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
                            {formatDate(row.memoCreatedAt)}
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
                <div>
                  <p className="text-sm text-gray-500">타입</p>
                  <div className="font-medium">
                    <TypeBadge type={selectedRow.type} />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">메모</h4>
                <p className="text-sm text-gray-500">
                  {memoText || "메모 없음"}
                </p>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">일정 변경</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center whitespace-nowrap sm:px-2 px-1">
                          일정 선택
                        </TableHead>
                        {retreatDatesForDisplay.map((date: string) => (
                          <TableHead
                            key={date}
                            className="text-center whitespace-nowrap sm:px-2 px-1"
                          >
                            {formatSimpleDate(date)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {["BREAKFAST", "LUNCH", "DINNER", "SLEEP"].map(
                        eventType => (
                          <TableRow key={eventType}>
                            <TableCell className="flex items-center justify-start whitespace-nowrap sm:px-2 px-1">
                              {eventType === "BREAKFAST" && (
                                <Sunrise className="mr-2" />
                              )}
                              {eventType === "LUNCH" && (
                                <Sun className="mr-2" />
                              )}
                              {eventType === "DINNER" && (
                                <Sunset className="mr-2" />
                              )}
                              {eventType === "SLEEP" && (
                                <Bed className="mr-2" />
                              )}
                              {EVENT_TYPE_MAP[eventType]}
                            </TableCell>
                            {retreatDatesForDisplay.map((date: string) => {
                              const event = schedules.find(
                                s =>
                                  new Date(s.time).toLocaleDateString(
                                    "ko-KR"
                                  ) ===
                                    new Date(date).toLocaleDateString(
                                      "ko-KR"
                                    ) && s.type === eventType
                              );
                              return (
                                <TableCell
                                  key={`${date}-${eventType}`}
                                  className="text-center p-2 sm:px-3 sm:py-2 whitespace-nowrap"
                                >
                                  {event ? (
                                    <Checkbox
                                      className="schedule-checkbox m-2"
                                      checked={selectedSchedules.includes(
                                        event.id
                                      )}
                                      onCheckedChange={() =>
                                        handleScheduleChange(event.id)
                                      }
                                    />
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
