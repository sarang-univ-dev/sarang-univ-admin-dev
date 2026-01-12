import {
  TRetreatRegistrationSchedule,
  IUserScheduleChangeRetreat,
} from "@/types";
import { ScheduleChangeRequestTableData } from "@/hooks/schedule-change-request/use-schedule-change-request-columns";

/**
 * 서버 데이터를 테이블 데이터 형식으로 변환
 */
export function transformScheduleChangeRequestForTable(
  requests: IUserScheduleChangeRetreat[],
  schedules: TRetreatRegistrationSchedule[]
): ScheduleChangeRequestTableData[] {
  return requests.map((req) => ({
    id: req.userRetreatRegistrationId.toString(),
    department: `${req.univGroupNumber}부`,
    grade: `${req.gradeNumber}학년`,
    name: req.userName,
    schedules: schedules.reduce((acc, cur) => {
      acc[`schedule_${cur.id}`] = (
        req.userRetreatRegistrationScheduleIds || []
      ).includes(cur.id);
      return acc;
    }, {} as Record<string, boolean>),
    type: req.userType,
    amount: req.price,
    createdAt: req.createdAt,
    status: req.paymentStatus,
    issuerName: req.issuerName,
    memoCreatedAt: req.memoCreatedAt,
    memo: req.memo,
    memoId: req.userRetreatRegistrationHistoryMemoId,
    scheduleIds: req.userRetreatRegistrationScheduleIds || [],
  }));
}

/**
 * 표시 목적으로 일정에서 고유한 날짜 추출
 */
export function getRetreatDatesForDisplay(
  schedules: TRetreatRegistrationSchedule[]
): string[] {
  if (schedules.length === 0) return [];

  return Array.from(
    new Set(
      schedules.map((s) => new Date(s.time).toISOString().split("T")[0])
    )
  ).sort();
}
