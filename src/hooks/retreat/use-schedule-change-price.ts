import { useState, useEffect } from "react";
import { TRetreatRegistrationSchedule, TRetreatPaymentSchedule } from "@/types";
import { calculateRegistrationPrice } from "@/utils/calculateRegistrationPrice";

interface UseScheduleChangePriceOptions {
  userType: string;
  grade: string;
  schedules: TRetreatRegistrationSchedule[];
  payments: TRetreatPaymentSchedule[];
  selectedScheduleIds: number[];
  originalAmount: number;
  retreatInfo?: any; // 선택사항
  selectedPaymentId?: number; // 선택된 payment schedule ID
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
  selectedPaymentId,
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

    // 선택된 payment가 없으면 원래 금액 유지
    if (!selectedPaymentId) {
      setCalculatedPrice(originalAmount);
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // 선택된 payment 찾기
      const selectedPayment = payments.find((p) => p.id === selectedPaymentId);
      if (!selectedPayment) {
        throw new Error("선택된 결제 정보를 찾을 수 없습니다.");
      }

      // 새로운 금액 계산
      const newPrice = calculateRegistrationPrice(
        userType,
        [selectedPayment],
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
  }, [userType, grade, selectedScheduleIds, payments, originalAmount, selectedPaymentId]);

  return {
    calculatedPrice,
    isCalculating,
    error,
    priceDifference: calculatedPrice - originalAmount,
  };
}
