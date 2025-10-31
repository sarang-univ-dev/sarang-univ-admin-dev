"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Sunrise, Sun, Sunset, Bed, Loader2 } from "lucide-react";
import { TRetreatRegistrationSchedule, TRetreatPaymentSchedule } from "@/types";
import { TypeBadge } from "@/components/common/retreat";
import { formatSimpleDate } from "@/utils/formatDate";
import { calculateRegistrationPrice } from "@/utils/calculateRegistrationPrice";
import { getRetreatDatesForDisplay, findCurrentPayment } from "./utils";
import { ScheduleChangeRequestTableData } from "@/hooks/schedule-change-request/use-schedule-change-request-columns";
import { useToastStore } from "@/store/toast-store";

// 이벤트 타입을 한글로 매핑
const EVENT_TYPE_MAP: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SLEEP: "숙박",
};

interface ScheduleChangeModalProps {
  isOpen: boolean;
  selectedRow: ScheduleChangeRequestTableData | null;
  schedules: TRetreatRegistrationSchedule[];
  payments: TRetreatPaymentSchedule[];
  retreatInfo: any;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (afterScheduleIds: number[]) => void;
}

export function ScheduleChangeModal({
  isOpen,
  selectedRow,
  schedules,
  payments,
  retreatInfo,
  isLoading = false,
  onClose,
  onConfirm,
}: ScheduleChangeModalProps) {
  const addToast = useToastStore((state) => state.add);
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  // 표시 목적으로 일정에서 고유한 날짜 추출
  const retreatDatesForDisplay = getRetreatDatesForDisplay(schedules);

  // 모달이 열릴 때 초기 일정 설정
  useEffect(() => {
    if (selectedRow && isOpen) {
      setSelectedSchedules(selectedRow.scheduleIds || []);
    }
  }, [selectedRow, isOpen]);

  // 일정 선택 변경 시 금액 계산
  useEffect(() => {
    if (selectedRow && selectedSchedules.length > 0 && payments.length > 0) {
      calculateNewPrice(selectedSchedules);
    }
  }, [selectedRow, selectedSchedules, payments]);

  /**
   * 새로운 일정 선택 처리 함수
   */
  const handleScheduleChange = (id: number) => {
    const newSelectedSchedules = selectedSchedules.includes(id)
      ? selectedSchedules.filter((scheduleId) => scheduleId !== id)
      : [...selectedSchedules, id];

    setSelectedSchedules(newSelectedSchedules);
  };

  /**
   * 가격 계산 함수
   */
  const calculateNewPrice = (newSelectedSchedules: number[]) => {
    if (!selectedRow) return;

    try {
      const currentPayment = findCurrentPayment(payments);
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
      addToast({
        title: "오류",
        description: "가격 계산 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedSchedules);
  };

  if (!isOpen || !selectedRow) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl transform transition-all duration-300 ease-out scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">일정 변경 처리</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          {/* 신청자 정보 */}
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
                <TypeBadge type={selectedRow.type as any} />
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">메모</h4>
            <p className="text-sm text-gray-500">
              {selectedRow.memo || "메모 없음"}
            </p>
          </div>

          {/* 일정 변경 */}
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
                    (eventType) => (
                      <TableRow key={eventType}>
                        <TableCell className="flex items-center justify-start whitespace-nowrap sm:px-2 px-1">
                          {eventType === "BREAKFAST" && (
                            <Sunrise className="mr-2" />
                          )}
                          {eventType === "LUNCH" && <Sun className="mr-2" />}
                          {eventType === "DINNER" && <Sunset className="mr-2" />}
                          {eventType === "SLEEP" && <Bed className="mr-2" />}
                          {EVENT_TYPE_MAP[eventType]}
                        </TableCell>
                        {retreatDatesForDisplay.map((date: string) => {
                          const event = schedules.find(
                            (s) =>
                              new Date(s.time).toLocaleDateString("ko-KR") ===
                                new Date(date).toLocaleDateString("ko-KR") &&
                              s.type === eventType
                          );
                          return (
                            <TableCell
                              key={`${date}-${eventType}`}
                              className="text-center p-2 sm:px-3 sm:py-2 whitespace-nowrap"
                            >
                              {event ? (
                                <Checkbox
                                  className="schedule-checkbox m-2"
                                  checked={selectedSchedules.includes(event.id)}
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

          {/* 금액 정보 */}
          <div className="mt-4 flex justify-between">
            <p className="font-medium">이전 금액:</p>
            <p>{selectedRow.amount.toLocaleString()}원</p>
          </div>
          <div className="mt-2 flex justify-between">
            <p className="font-medium">변경 후 금액:</p>
            <p>{calculatedPrice.toLocaleString()}원</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="hover:bg-black hover:text-white transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            일정 변동 처리 완료
          </Button>
        </div>
      </div>
    </div>
  );
}
