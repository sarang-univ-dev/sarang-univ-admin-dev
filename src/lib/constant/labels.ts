import {
  UserRetreatRegistrationType,
  UserRetreatRegistrationPaymentStatus,
  RetreatRegistrationScheduleType,
  UserRetreatShuttleBusStatus,
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
  CANCEL_ONGOING: "취소 처리 중",
  CANCELED: "취소 완료",
  REFUND_REQUEST: "환불 처리 중",
  REFUND_ONGOING: "환불 처리 중",
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

export const SHUTTLE_BUS_STATUS_LABELS: Record<
  UserRetreatShuttleBusStatus,
  string
> = {
  REGISTERED: "셔틀 신청 완료",
  SCHEDULE_REVIEW_REQUIRED: "일정 확인 필요",
  NOT_REGISTERED: "셔틀 신청 안 함",
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
