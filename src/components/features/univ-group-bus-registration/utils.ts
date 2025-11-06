import { TRetreatShuttleBus } from "@/types";
import { IUnivGroupBusRegistration } from "@/types/bus-registration";

/**
 * 부서 셔틀버스 등록 데이터를 테이블 형식으로 변환
 *
 * @param registrations - 원본 등록 데이터
 * @param schedules - 셔틀버스 스케줄 목록
 * @returns 테이블에 표시할 형식으로 변환된 데이터
 */
export function transformBusRegistrationsForTable(
  registrations: IUnivGroupBusRegistration[],
  schedules: TRetreatShuttleBus[]
) {
  return registrations.map((reg) => ({
    id: reg.id.toString(),
    department: `${reg.univGroupNumber}부`,
    gender: reg.gender,
    grade: `${reg.gradeNumber}학년`,
    name: reg.name,
    phone: reg.userPhoneNumber,
    schedule: schedules.reduce(
      (acc, cur) => {
        acc[`schedule_${cur.id}`] = (
          reg.userRetreatShuttleBusRegistrationScheduleIds || []
        ).includes(cur.id);
        return acc;
      },
      {} as Record<string, boolean>
    ),
    amount: reg.price,
    createdAt: reg.createdAt,
    status: reg.shuttleBusPaymentStatus,
    confirmedBy: reg.paymentConfirmUserName,
    paymentConfirmedAt: reg.paymentConfirmedAt,
    currentLeaderName: reg.currentLeaderName,
    memo: reg.univGroupStaffShuttleBusHistoryMemo,
  }));
}
