import { Check, X } from "lucide-react";

interface ShuttleBusStatusBadgeProps {
  hasRegistered: boolean;
}

/**
 * 셔틀버스 신청 여부 배지
 */
export function ShuttleBusStatusBadge({
  hasRegistered,
}: ShuttleBusStatusBadgeProps) {
  if (hasRegistered) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-green-600">
        <Check className="h-3.5 w-3.5" />
        <span className="text-sm font-medium">신청함</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 text-red-600">
      <X className="h-3.5 w-3.5" />
      <span className="text-sm font-medium">신청 안함</span>
    </div>
  );
}
