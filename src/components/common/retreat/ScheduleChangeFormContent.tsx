"use client";

import { useState, useEffect } from "react";
import { TRetreatRegistrationSchedule, TRetreatPaymentSchedule } from "@/types";
import { TypeBadge } from "@/components/Badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatDate, formatSimpleDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";
import { ScheduleSelectionTable } from "./ScheduleSelectionTable";
import { useScheduleChangePrice } from "@/hooks/retreat/use-schedule-change-price";

interface ScheduleChangeFormContentProps {
  userData: {
    name: string;
    department?: string;
    grade: string;
    type: string;
  };
  schedules: TRetreatRegistrationSchedule[];
  payments: TRetreatPaymentSchedule[];
  initialScheduleIds: number[];
  originalAmount: number;
  retreatInfo?: any;

  // 메모 관련 Props
  memo?: {
    content: string | null;
    issuerName?: string | null;
    createdAt?: string;
  };
  memoMode?: "readonly" | "editable" | "hidden"; // 기본값: "readonly"
  onMemoChange?: (memo: string) => void;

  // 일정 변경 콜백
  onChange?: (scheduleIds: number[], calculatedAmount: number) => void;
  onPaymentChange?: (paymentId: number) => void; // 선택된 payment 변경 콜백
  readOnly?: boolean;
}

/**
 * 일정 변경 폼 내용물 컴포넌트
 *
 * @description
 * - 신청자 정보 표시
 * - 메모 표시/작성
 * - 일정 선택 테이블
 * - 금액 계산 및 표시
 *
 * @example
 * ```tsx
 * <ScheduleChangeFormContent
 *   userData={{ name: "홍길동", department: "1부", grade: "3", type: "STAFF" }}
 *   schedules={schedules}
 *   payments={payments}
 *   initialScheduleIds={[1, 2, 3]}
 *   originalAmount={100000}
 *   memo={{ content: "수요일에 올 수 없습니다", issuerName: "김간사", createdAt: "2025-01-01" }}
 *   memoMode="readonly"
 *   onChange={(scheduleIds, amount) => console.log(scheduleIds, amount)}
 * />
 * ```
 */
export function ScheduleChangeFormContent({
  userData,
  schedules,
  payments,
  initialScheduleIds,
  originalAmount,
  retreatInfo,
  memo,
  memoMode = "readonly",
  onMemoChange,
  onChange,
  onPaymentChange,
  readOnly = false,
}: ScheduleChangeFormContentProps) {
  const [selectedScheduleIds, setSelectedScheduleIds] = useState(initialScheduleIds);
  const [memoContent, setMemoContent] = useState(memo?.content || "");
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | undefined>(
    payments.length > 0 ? payments[0].id : undefined
  );

  // 금액 계산 훅 사용
  const { calculatedPrice } = useScheduleChangePrice({
    userType: userData.type,
    grade: userData.grade,
    schedules,
    payments,
    selectedScheduleIds,
    originalAmount,
    retreatInfo,
    selectedPaymentId,
  });

  // 일정 변경 시 부모에게 알림
  useEffect(() => {
    onChange?.(selectedScheduleIds, calculatedPrice);
  }, [selectedScheduleIds, calculatedPrice, onChange]);

  // 메모 변경 시 부모에게 알림
  useEffect(() => {
    if (memoMode === "editable") {
      onMemoChange?.(memoContent);
    }
  }, [memoContent, memoMode, onMemoChange]);

  // Payment 변경 시 부모에게 알림
  useEffect(() => {
    if (selectedPaymentId) {
      onPaymentChange?.(selectedPaymentId);
    }
  }, [selectedPaymentId, onPaymentChange]);

  // 일정 토글 핸들러
  const handleScheduleChange = (scheduleId: number) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  return (
    <div className="space-y-4">
      {/* 신청자 정보 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">이름</p>
          <p className="font-medium">{userData.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">부서</p>
          <p className="font-medium">
            {userData.department} {userData.grade}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">타입</p>
          <div className="font-medium">
            <TypeBadge type={userData.type as any} />
          </div>
        </div>
      </div>

      {/* 메모 섹션 */}
      {memoMode !== "hidden" && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            메모
            {memo?.issuerName && (
              <span className="text-xs text-gray-500">
                작성자: {memo.issuerName} · {formatDate(memo.createdAt || "")}
              </span>
            )}
          </h4>

          {memoMode === "readonly" ? (
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
              {memo?.content || "메모 없음"}
            </p>
          ) : (
            <Textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="일정 변경 사유를 입력하세요..."
              className="text-sm"
              rows={4}
            />
          )}
        </div>
      )}

      {/* 일정 선택 테이블 */}
      <div>
        <h4 className="font-medium mb-2">일정 변경</h4>
        <ScheduleSelectionTable
          schedules={schedules}
          selectedScheduleIds={selectedScheduleIds}
          onScheduleChange={handleScheduleChange}
          disabled={readOnly}
        />
      </div>

      {/* 금액 기준 선택 */}
      {payments.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">금액 기준 선택</h4>
          <RadioGroup
            value={selectedPaymentId?.toString()}
            onValueChange={(value) => setSelectedPaymentId(parseInt(value))}
            disabled={readOnly}
            className="space-y-2"
          >
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={payment.id.toString()}
                  id={`payment-${payment.id}`}
                />
                <Label
                  htmlFor={`payment-${payment.id}`}
                  className="text-sm cursor-pointer"
                >
                  {payment.name} ({formatSimpleDate(payment.startAt as unknown as string)} ~ {formatSimpleDate(payment.endAt as unknown as string)})
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* 금액 정보 */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between">
          <p className="font-medium">이전 금액:</p>
          <p>{originalAmount.toLocaleString()}원</p>
        </div>
        <div className="flex justify-between">
          <p className="font-medium">변경 후 금액:</p>
          <p
            className={cn(
              calculatedPrice > originalAmount && "text-red-600 font-semibold"
            )}
          >
            {calculatedPrice.toLocaleString()}원
            {calculatedPrice > originalAmount && (
              <span className="text-xs ml-1">
                (+{(calculatedPrice - originalAmount).toLocaleString()}원)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
