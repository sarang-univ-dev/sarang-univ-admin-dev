import { AccountStaffTableData } from "@/hooks/account/use-account-staff-columns";
import { TRetreatRegistrationSchedule } from "@/types";
import { IRetreatRegistration } from "@/types/account";

/**
 * IRetreatRegistration을 AccountStaffTableData로 변환하는 함수
 *
 * @param registrations - 원본 신청 데이터 배열
 * @param schedules - 수양회 스케줄 목록
 * @returns 테이블에 표시할 데이터 배열
 */
export function transformRegistrationsForTable(
  registrations: IRetreatRegistration[],
  schedules: TRetreatRegistrationSchedule[]
): AccountStaffTableData[] {
  return registrations.map(registration => {
    // 스케줄 정보 변환
    const scheduleData: Record<string, boolean> = {};
    schedules.forEach(schedule => {
      scheduleData[`schedule_${schedule.id}`] =
        registration.userRetreatRegistrationScheduleIds?.includes(
          schedule.id
        ) || false;
    });

    return {
      id: registration.id,
      department: `${registration.univGroupNumber}부`,
      gender: registration.gender,
      grade: `${registration.gradeNumber}학년`,
      name: registration.name,
      phoneNumber: registration.phoneNumber,
      schedules: scheduleData,
      type: registration.userType,
      amount: registration.price,
      createdAt: registration.createdAt,
      status: registration.paymentStatus,
      confirmedBy: registration.paymentConfirmUserName ?? null,
      paymentConfirmedAt: registration.paymentConfirmedAt ?? null,
      accountMemo: registration.accountMemo ?? null,
      accountMemoId: registration.accountMemoId ?? null,
    };
  });
}
