import { useState, useEffect } from "react";
import { TRetreatRegistrationSchedule, TRetreatPaymentSchedule } from "@/types";
import { calculateRegistrationPrice } from "@/utils/calculateRegistrationPrice";
import { findCurrentPayment } from "@/components/features/schedule-change-request/utils";

interface UseScheduleChangePriceOptions {
  userType: string;
  grade: string;
  schedules: TRetreatRegistrationSchedule[];
  payments: TRetreatPaymentSchedule[];
  selectedScheduleIds: number[];
  originalAmount: number;
  retreatInfo?: any; // 선택사항
}

/**
 * 일정 변경 시 금액 계산 훅
 *
 * @description
 * - 선택된 일정에 따른 금액 자동 계산
 * - max(이전 금액, 변경된 일정으로 계산된 가격) 로직 적용
 * - 에러 핸들링 포함
 *
 * @example
 * ```tsx
 * const { calculatedPrice, isCalculating, error, priceDifference } = useScheduleChangePrice({
 *   userType: "STAFF",
 *   grade: "3",
 *   schedules,
 *   payments,
 *   selectedScheduleIds: [1, 2, 3],
 *   originalAmount: 100000,
 * });
 * ```
 */
export function useScheduleChangePrice({
  userType,
  grade,
  schedules,
  payments,
  selectedScheduleIds,
  originalAmount,
  retreatInfo,
}: UseScheduleChangePriceOptions) {
  const [calculatedPrice, setCalculatedPrice] = useState(originalAmount);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 선택된 일정이 없으면 원래 금액 유지
    if (selectedScheduleIds.length === 0) {
      setCalculatedPrice(originalAmount);
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // 현재 유효한 payment 찾기
      const currentPayment = findCurrentPayment(payments);
      if (!currentPayment) {
        throw new Error("현재 결제 정보를 찾을 수 없습니다.");
      }

      // 사용할 스케줄 데이터 결정 (retreatInfo가 있으면 우선 사용)
      const schedulesToUse = retreatInfo?.schedule || schedules;

      // 새로운 금액 계산
      const newPrice = calculateRegistrationPrice(
        userType,
        schedulesToUse,
        [currentPayment],
        selectedScheduleIds,
        parseInt(grade)
      );

      // 새로운 가격은 max(이전 가격, 변경된 일정으로 계산된 가격)
      const finalPrice = Math.max(originalAmount, newPrice);
      setCalculatedPrice(finalPrice);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("가격 계산 실패"));
      setCalculatedPrice(originalAmount);
      console.error("가격 계산 중 오류 발생:", err);
    } finally {
      setIsCalculating(false);
    }
  }, [userType, grade, selectedScheduleIds, payments, originalAmount, schedules, retreatInfo]);

  return {
    calculatedPrice,
    isCalculating,
    error,
    priceDifference: calculatedPrice - originalAmount,
  };
}
