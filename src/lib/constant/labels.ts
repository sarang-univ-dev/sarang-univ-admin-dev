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
  NEW_COMER_REQUEST: "새가족 요청",
  SOLDIER_REQUEST: "군지체 요청",
  PENDING: "대기중",
  PAID: "입금완료",
  REFUND_REQUEST: "환불 요청",
  REFUNDED: "환불 완료",
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
