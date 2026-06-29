import { AlertTriangle, Check, X } from "lucide-react";

import { SHUTTLE_BUS_STATUS_LABELS } from "@/lib/constant/labels";
import { UserRetreatShuttleBusStatus } from "@/types";

interface ShuttleBusStatusBadgeProps {
  status: UserRetreatShuttleBusStatus;
}

/**
 * 셔틀버스 신청 현황 배지
 */
export function ShuttleBusStatusBadge({ status }: ShuttleBusStatusBadgeProps) {
  switch (status) {
    case UserRetreatShuttleBusStatus.REGISTERED:
      return (
        <div className="flex items-center justify-center gap-1.5 text-green-600">
          <Check className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">
            {SHUTTLE_BUS_STATUS_LABELS[status]}
          </span>
        </div>
      );
    case UserRetreatShuttleBusStatus.SCHEDULE_REVIEW_REQUIRED:
      return (
        <div className="flex items-center justify-center gap-1.5 text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">
            {SHUTTLE_BUS_STATUS_LABELS[status]}
          </span>
        </div>
      );
    case UserRetreatShuttleBusStatus.NOT_REGISTERED:
      return (
        <div className="flex items-center justify-center gap-1.5 text-red-600">
          <X className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">
            {SHUTTLE_BUS_STATUS_LABELS[status]}
          </span>
        </div>
      );
  }

  return null;
}
