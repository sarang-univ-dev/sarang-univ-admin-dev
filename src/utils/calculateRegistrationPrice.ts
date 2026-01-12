import {
  TRetreatPaymentSchedule,
  UserRetreatRegistrationType
} from "@/types";

/**
 * 행사 등록 가격 계산
 * @param userType - 사용자 타입
 * @param retreatPaymentSchedules - 수양회 입급 일정
 * @param userRetreatRegistrationScheduleIds - 사용자가 신청한 수양회 식수 일정
 * @param userGradeNumber - 사용자 학년
 * @returns 등록 가격
 */
export function calculateRegistrationPrice(
  userType: UserRetreatRegistrationType | string | null,
  retreatPaymentSchedules: TRetreatPaymentSchedule[],
  userRetreatRegistrationScheduleIds: number[],
  userGradeNumber?: number
): number {
  // 사용자 타입에 따라 결제 스케줄 적용
  let applicablePaymentSchedule: TRetreatPaymentSchedule;

  if (userType === UserRetreatRegistrationType.STAFF) {
    // STAFF는 무료
    return 0;
  } else if (
    userType === UserRetreatRegistrationType.NEW_COMER ||
    userType === UserRetreatRegistrationType.SOLDIER ||
    (userGradeNumber && userGradeNumber === 1)
  ) {
    // NEW_COMER와 SOLDIER의 경우 가장 이른 결제 스케줄 사용
    applicablePaymentSchedule = retreatPaymentSchedules.reduce(
      (earliest, schedule) =>
        new Date(schedule.startAt) < new Date(earliest.startAt) ? schedule : earliest,
      retreatPaymentSchedules[0]
    );
  } else {
    // 기본 결제 스케줄은 현재 날짜에 해당하는 스케줄로 설정
    const currentDate = new Date();
    const currentPaymentSchedules = retreatPaymentSchedules.filter(
      (schedule) =>
        new Date(schedule.startAt) <= currentDate &&
        new Date(schedule.endAt) >= currentDate
    );

    if (currentPaymentSchedules.length === 0) {
      // 현재 유효한 스케줄이 없으면 가장 마지막 스케줄 사용
      applicablePaymentSchedule = retreatPaymentSchedules.reduce(
        (latest, schedule) =>
          new Date(schedule.endAt) > new Date(latest.endAt) ? schedule : latest,
        retreatPaymentSchedules[0]
      );
    } else {
      applicablePaymentSchedule = currentPaymentSchedules[0];
    }
  }

  // 선택된 스케줄의 개수 계산
  const eventCount = userRetreatRegistrationScheduleIds.length;

  // 가격 계산
  const calculatedPrice =
    eventCount * applicablePaymentSchedule.partialPricePerSchedule;
  return Math.min(calculatedPrice, applicablePaymentSchedule.totalPrice);
} 