"use client";

import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";

interface BusRegistrationRow {
  id: string;
  status: UserRetreatShuttleBusPaymentStatus;
  memo?: string | null;
}

interface UnivGroupBusRegistrationTableActionsProps {
  row: BusRegistrationRow;
  onOpenMemo: (id: string) => void;
}

/**
 * 부서 셔틀버스 등록 테이블 액션 컴포넌트
 * - 메모 작성 버튼 (입금 완료 상태이고 메모 없을 때만 표시)
 */
export function UnivGroupBusRegistrationTableActions({
  row,
  onOpenMemo,
}: UnivGroupBusRegistrationTableActionsProps) {
  // 메모가 이미 있거나 입금 완료 상태가 아니면 버튼 표시 안 함
  if (
    row.memo ||
    row.status !== UserRetreatShuttleBusPaymentStatus.PAID
  ) {
    return (
      <div className="text-center text-gray-400 text-sm">
        -
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onOpenMemo(row.id)}
        className="flex items-center gap-1.5 text-xs h-7"
      >
        <Edit className="h-3.5 w-3.5" />
        <span>작성</span>
      </Button>
    </div>
  );
}
