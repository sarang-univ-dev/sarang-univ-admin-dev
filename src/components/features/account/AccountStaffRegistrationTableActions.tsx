"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import { AccountStaffTableData } from "@/hooks/account/use-account-staff-columns";
import { useAccountStaffRegistration } from "@/hooks/account/use-account-staff-registration";

interface AccountStaffRegistrationTableActionsProps {
  row: AccountStaffTableData;
  retreatSlug: string;
}

/**
 * 재정 간사 신청 테이블 액션 버튼
 *
 * @description
 * - 입금 현황(paymentStatus)에 따라 다른 액션 버튼 표시
 * - PENDING: 입금 확인 완료, 간사 배정
 * - PAID: 환불 처리
 * - 그 외: 액션 없음
 */
export function AccountStaffRegistrationTableActions({
  row,
  retreatSlug,
}: AccountStaffRegistrationTableActionsProps) {
  const { assignStaff, confirmPayment, refundComplete, isMutating } =
    useAccountStaffRegistration(retreatSlug);

  const handleAssignStaff = () => {
    assignStaff(String(row.id));
  };

  const handleConfirmPayment = () => {
    confirmPayment(String(row.id));
  };

  const handleRefundComplete = () => {
    refundComplete(String(row.id));
  };

  // 입금 대기 중 (PENDING)
  if (row.status === UserRetreatRegistrationPaymentStatus.PENDING) {
    return (
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleConfirmPayment}
          disabled={isMutating}
          className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors whitespace-nowrap"
        >
          {isMutating ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span>입금 확인 완료</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAssignStaff}
          disabled={isMutating}
          className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
        >
          {isMutating ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span>간사 배정</span>
        </Button>
      </div>
    );
  }

  // 입금 완료 (PAID)
  if (row.status === UserRetreatRegistrationPaymentStatus.PAID) {
    return (
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefundComplete}
          disabled={isMutating}
          className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
        >
          {isMutating ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          <span>환불 처리</span>
        </Button>
      </div>
    );
  }

  // 그 외 상태는 액션 없음
  return null;
}
