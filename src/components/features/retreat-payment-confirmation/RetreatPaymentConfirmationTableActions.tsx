"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, RotateCcw } from "lucide-react";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
import { UserRetreatRegistrationPaymentStatus } from "@/types";

interface RetreatPaymentConfirmationTableActionsProps {
  registration: IUserRetreatRegistration;
  confirmPayment: (registrationId: number) => void;
  sendPaymentRequest: (registrationId: number) => void;
  refundComplete: (registrationId: number) => void;
  isMutating: boolean;
}

/**
 * 부서 재정 팀원 - 입금 확인 테이블 액션 컴포넌트
 * - 입금 확인 버튼 (PENDING 상태)
 * - 입금 요청 버튼 (PENDING 상태)
 * - 환불 처리 완료 버튼 (REFUND_REQUEST 상태)
 */
export function RetreatPaymentConfirmationTableActions({
  registration,
  confirmPayment,
  sendPaymentRequest,
  refundComplete,
  isMutating,
}: RetreatPaymentConfirmationTableActionsProps) {
  // 상태에 따른 액션 버튼 렌더링
  switch (registration.paymentStatus) {
    case UserRetreatRegistrationPaymentStatus.PENDING:
      return (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => confirmPayment(registration.id)}
            disabled={isMutating}
            className="flex items-center gap-1.5 text-xs h-7 hover:bg-black hover:text-white transition-colors"
          >
            {isMutating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>입금 확인</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendPaymentRequest(registration.id)}
            disabled={isMutating}
            className="flex items-center gap-1.5 text-xs h-7"
          >
            {isMutating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>입금 요청</span>
          </Button>
        </div>
      );

    case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
      return (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refundComplete(registration.id)}
            disabled={isMutating}
            className="flex items-center gap-1.5 text-xs h-7 hover:bg-black hover:text-white transition-colors"
          >
            {isMutating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            <span>환불 처리 완료</span>
          </Button>
        </div>
      );

    default:
      return null;
  }
}
