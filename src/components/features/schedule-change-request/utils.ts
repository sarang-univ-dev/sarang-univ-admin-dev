import {
  TRetreatRegistrationSchedule,
  TRetreatPaymentSchedule,
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
 * 현재 날짜에 유효한 payment를 찾는 함수
 */
export function findCurrentPayment(
  payments: TRetreatPaymentSchedule[]
): TRetreatPaymentSchedule | null {
  const currentDate = new Date();

  if (payments.length === 0) {
    return null;
  }

  // 현재 유효한 payment 찾기
  const validPayment = payments.find(
    (payment: TRetreatPaymentSchedule) =>
      new Date(payment.startAt) <= currentDate &&
      new Date(payment.endAt) >= currentDate
  );

  if (validPayment) {
    return validPayment;
  }

  // 유효한 payment가 없는 경우
  // 현재 이후 가장 이른 payment 찾기
  return payments.reduce(
    (earliest: TRetreatPaymentSchedule, current: TRetreatPaymentSchedule) => {
      const currentEndDate = new Date(current.endAt);
      const earliestEndDate = new Date(earliest.endAt);

      // 현재 날짜 이후의 payment만 고려
      if (currentEndDate < currentDate) return earliest;
      if (earliestEndDate < currentDate) return current;

      // 둘 다 현재 이후라면 더 이른 날짜의 payment 반환
      return currentEndDate < earliestEndDate ? current : earliest;
    }
  );
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
