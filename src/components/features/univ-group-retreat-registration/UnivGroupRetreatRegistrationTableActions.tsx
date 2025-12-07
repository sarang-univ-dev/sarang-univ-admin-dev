"use client";

import { Button } from "@/components/ui/button";
import { CheckSquare, XSquare, RotateCcw } from "lucide-react";
import { useUnivGroupRetreatRegistration } from "@/hooks/univ-group-retreat-registration/use-univ-group-retreat-registration";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { UserRetreatRegistrationPaymentStatus } from "@/types";

interface UnivGroupRetreatRegistrationTableActionsProps {
  row: UnivGroupAdminStaffData;
  retreatSlug: string;
}

/**
 * 테이블 액션 컬럼 컴포넌트
 * - 환불 처리
 * - 새가족 신청 승인/거절
 * - 군지체 신청 승인/거절
 */
export function UnivGroupRetreatRegistrationTableActions({
  row,
  retreatSlug,
}: UnivGroupRetreatRegistrationTableActionsProps) {
  const {
    isMutating,
    refundComplete,
    handleNewFamilyRequest,
    handleMilitaryRequest,
  } = useUnivGroupRetreatRegistration(retreatSlug);

  // 상태에 따른 액션 버튼 렌더링
  switch (row.status) {
    case UserRetreatRegistrationPaymentStatus.PENDING:
      return null;

    case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
      return (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refundComplete(row.id)}
            disabled={isMutating}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors text-xs h-7"
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

    case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
      return (
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleNewFamilyRequest(row.id, true)}
            disabled={isMutating}
            className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors text-xs h-7"
          >
            {isMutating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckSquare className="h-3.5 w-3.5" />
            )}
            <span>새가족 승인</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleNewFamilyRequest(row.id, false)}
            disabled={isMutating}
            className="flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-colors text-xs h-7"
          >
            {isMutating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <XSquare className="h-3.5 w-3.5" />
            )}
            <span>새가족 거절</span>
          </Button>
        </div>
      );

    case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
      return (
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMilitaryRequest(row.id, true)}
            disabled={isMutating}
            className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors text-xs h-7"
          >
            {isMutating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckSquare className="h-3.5 w-3.5" />
            )}
            <span>군지체 승인</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleMilitaryRequest(row.id, false)}
            disabled={isMutating}
            className="flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-colors text-xs h-7"
          >
            {isMutating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <XSquare className="h-3.5 w-3.5" />
            )}
            <span>군지체 거절</span>
          </Button>
        </div>
      );

    default:
      return null;
  }
}
