import {
  UserRetreatRegistrationType,
  UserRetreatRegistrationPaymentStatus,
  RetreatRegistrationScheduleType,
} from "@/types";

/**
 * 사용자 수양회 신청 타입 라벨
 */
export const USER_RETREAT_TYPE_LABELS: Record<
  UserRetreatRegistrationType,
  string
> = {
  NEW_COMER: "새가족",
  SOLDIER: "군지체",
  STAFF: "간사",
};

/**
 * 사용자 수양회 입금 현황 라벨
 */
export const PAYMENT_STATUS_LABELS: Record<
  UserRetreatRegistrationPaymentStatus,
  string
> = {
  NEW_COMER_REQUEST: "새가족 신청 요청",
  SOLDIER_REQUEST: "군지체 신청 요청",
  PENDING: "입금 확인 대기",
  PAID: "입금 확인 완료",
  REFUND_REQUEST: "환불 처리 대기",
  REFUNDED: "환불 처리 완료",
};

/**
 * 입금 현황 라벨 가져오기 헬퍼 함수
 */
export const getPaymentStatusLabel = (
  status: UserRetreatRegistrationPaymentStatus | string
): string => {
  return (
    PAYMENT_STATUS_LABELS[status as UserRetreatRegistrationPaymentStatus] ||
    status
  );
};

/**
 * 수양회 일정 타입 라벨 (풀네임)
 */
export const SCHEDULE_TYPE_LABELS: Record<
  RetreatRegistrationScheduleType,
  string
> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SLEEP: "숙박",
};

/**
 * 수양회 일정 타입 단축 라벨 (앞글자)
 */
export const SCHEDULE_TYPE_SHORT_LABELS: Record<
  RetreatRegistrationScheduleType,
  string
> = {
  BREAKFAST: "아",
  LUNCH: "점",
  DINNER: "저",
  SLEEP: "숙",
};
