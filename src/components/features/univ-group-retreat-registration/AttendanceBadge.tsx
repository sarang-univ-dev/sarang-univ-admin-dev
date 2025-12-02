import { CalendarClock } from "lucide-react";

interface AttendanceBadgeProps {
  isFullAttendance: boolean;
}

/**
 * 수양회 참석 상태 뱃지 컴포넌트
 *
 * @description
 * - 전체 참석(전참): 모든 스케줄에 참석
 * - 부분 참석(부분참): 일부 스케줄만 참석
 */
export function AttendanceBadge({ isFullAttendance }: AttendanceBadgeProps) {
  if (isFullAttendance) {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-500 border border-slate-600">
        <CalendarClock className="h-3.5 w-3.5 text-white mr-1.5 flex-shrink-0" />
        <span className="text-xs font-medium text-white whitespace-nowrap">
          전참
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-300">
      <CalendarClock className="h-3.5 w-3.5 text-slate-500 mr-1.5 flex-shrink-0" />
      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
        부분참
      </span>
    </div>
  );
}
