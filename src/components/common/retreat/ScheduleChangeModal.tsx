"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToastStore } from "@/store/toast-store";
import { TRetreatRegistrationSchedule, TRetreatPaymentSchedule } from "@/types";

import { ScheduleChangeFormContent } from "./ScheduleChangeFormContent";

interface ScheduleChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  // 콜백
  onConfirm: (data: {
    scheduleIds: number[];
    calculatedAmount: number;
    memo?: string; // memoMode === "editable"일 때만 전달
    selectedPaymentScheduleId?: number; // 선택된 금액 기준 payment schedule
    refundRequired?: boolean;
  }) => Promise<void>;

  // UI 커스터마이징
  confirmButtonText?: string;
  title?: string;
}

/**
 * 일정 변경 공통 모달 컴포넌트
 *
 * @description
 * - 재정 간사, 행정 간사 등 여러 곳에서 재사용 가능
 * - 메모 모드 설정으로 다양한 시나리오 대응
 * - ScheduleChangeFormContent 통합
 * - 중첩 다이얼로그 대신 인라인 확인 UI 사용 (Best Practice)
 *
 * @example
 * ```tsx
 * // 재정 간사: 일정 변경 요청 처리 (메모 readonly)
 * <ScheduleChangeModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   userData={{ name: "홍길동", department: "1부", grade: "3", type: "STAFF" }}
 *   schedules={schedules}
 *   payments={payments}
 *   initialScheduleIds={[1, 2, 3]}
 *   originalAmount={100000}
 *   memo={{ content: "수요일에 올 수 없습니다", issuerName: "김간사", createdAt: "2025-01-01" }}
 *   memoMode="readonly"
 *   onConfirm={async ({ scheduleIds, calculatedAmount }) => {
 *     await processScheduleChange(scheduleIds, calculatedAmount);
 *   }}
 *   confirmButtonText="일정 변동 처리 완료"
 *   title="일정 변경 처리"
 * />
 *
 * // 행정 간사: 일정 변경 요청 생성 (메모 editable)
 * <ScheduleChangeModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   userData={{ name: "홍길동", department: "1부", grade: "3", type: "STAFF" }}
 *   schedules={schedules}
 *   payments={payments}
 *   initialScheduleIds={[1, 2, 3]}
 *   originalAmount={100000}
 *   memoMode="editable"
 *   onConfirm={async ({ scheduleIds, calculatedAmount, memo }) => {
 *     await createScheduleChangeRequest(scheduleIds, calculatedAmount, memo);
 *   }}
 *   confirmButtonText="일정 변경 요청 생성"
 *   title="일정 변경 요청"
 * />
 * ```
 */
export function ScheduleChangeModal({
  open,
  onOpenChange,
  userData,
  schedules,
  payments,
  initialScheduleIds,
  originalAmount,
  retreatInfo,
  memo,
  memoMode = "readonly",
  onConfirm,
  confirmButtonText = "일정 변동 처리 완료",
  title = "일정 변경 처리",
}: ScheduleChangeModalProps) {
  const addToast = useToastStore(state => state.add);
  const [scheduleIds, setScheduleIds] = useState(initialScheduleIds);
  const [calculatedAmount, setCalculatedAmount] = useState(originalAmount);
  const [memoContent, setMemoContent] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<
    number | undefined
  >(payments.length > 0 ? payments[0].id : undefined);
  const [refundRequired, setRefundRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCancelMode, setIsCancelMode] = useState(false);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (open) {
      setScheduleIds(initialScheduleIds);
      setCalculatedAmount(originalAmount);
      setMemoContent("");
      setSelectedPaymentId(payments.length > 0 ? payments[0].id : undefined);
      setRefundRequired(false);
      setShowConfirm(false);
      setIsCancelMode(false);
    }
  }, [open, initialScheduleIds, originalAmount, payments]);

  // 최종 확인 핸들러
  const handleFinalConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm({
        scheduleIds: isCancelMode ? [] : scheduleIds,
        calculatedAmount: isCancelMode ? 0 : calculatedAmount,
        ...(memoMode === "editable" && { memo: memoContent }),
        selectedPaymentScheduleId: isCancelMode
          ? undefined
          : selectedPaymentId,
        refundRequired: isCancelMode ? refundRequired : false,
      });

      addToast({
        title: "성공",
        description: isCancelMode
          ? "신청 취소가 처리되었습니다."
          : "일정 변경이 처리되었습니다.",
        variant: "success",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("일정 변경 처리 실패:", error);
      // 에러 발생 시 확인 상태 해제하여 재시도 가능하게
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 닫기 핸들러 (로딩 중에는 닫지 않음)
  const handleOpenChange = (newOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(newOpen);
  };

  const hasSelectedSchedule = scheduleIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScheduleChangeFormContent
          userData={userData}
          schedules={schedules}
          payments={payments}
          initialScheduleIds={initialScheduleIds}
          originalAmount={originalAmount}
          retreatInfo={retreatInfo}
          memo={memo}
          memoMode={memoMode}
          onMemoChange={setMemoContent}
          onChange={(ids, amount) => {
            setScheduleIds(ids);
            setCalculatedAmount(amount);
          }}
          onPaymentChange={setSelectedPaymentId}
          readOnly={isLoading || showConfirm || isCancelMode}
        />

        {!isCancelMode && !hasSelectedSchedule && (
          <p className="text-xs text-red-600">
            전체 신청 취소는 하단의 신청 취소 버튼으로 처리하세요.
          </p>
        )}

        {isCancelMode && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="refund-required"
                checked={refundRequired}
                onCheckedChange={checked => setRefundRequired(checked === true)}
                disabled={isLoading || showConfirm}
              />
              <Label
                htmlFor="refund-required"
                className="text-sm font-medium text-red-900 cursor-pointer"
              >
                환불 필요
              </Label>
            </div>
            <p className="mt-2 text-xs text-red-700">
              신청 취소는 모든 참여 일정을 제거하고 재정/라인업/인원관리 확인
              대상으로 전달됩니다. 환불이 필요한 경우 체크하면 환불 처리 중
              상태로 변경되고 신청 금액은 0원으로 조정됩니다.
            </p>
          </div>
        )}

        <DialogFooter>
          {showConfirm ? (
            // 확인 UI (인라인)
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                {isCancelMode
                  ? "정말로 신청 취소를 처리하시겠습니까?"
                  : "정말로 일정을 변경하시겠습니까?"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleFinalConfirm}
                  disabled={isLoading || (!isCancelMode && !hasSelectedSchedule)}
                  variant={isCancelMode ? "destructive" : "default"}
                >
                  {isLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isCancelMode ? "취소 처리" : "확인"}
                </Button>
              </div>
            </div>
          ) : (
            // 기본 UI
            <div className="flex w-full items-center justify-between gap-2">
              <div>
                {isCancelMode ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCancelMode(false);
                      setRefundRequired(false);
                    }}
                    disabled={isLoading}
                  >
                    일정 변경으로 돌아가기
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => setIsCancelMode(true)}
                    disabled={isLoading}
                  >
                    신청 취소
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  닫기
                </Button>
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={isLoading || (!isCancelMode && !hasSelectedSchedule)}
                  variant={isCancelMode ? "destructive" : "default"}
                >
                  {isCancelMode ? "취소 처리" : confirmButtonText}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
