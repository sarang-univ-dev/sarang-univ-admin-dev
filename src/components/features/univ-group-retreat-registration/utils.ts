import {
  IUnivGroupAdminStaffRetreat,
  UnivGroupAdminStaffData,
} from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";

/**
 * API 응답 데이터를 TanStack Table 형식으로 변환
 */
export function transformUnivGroupAdminStaffData(
  registrations: IUnivGroupAdminStaffRetreat[],
  schedules: TRetreatRegistrationSchedule[]
): UnivGroupAdminStaffData[] {
  return registrations.map((reg) => {
    const userScheduleIds = reg.userRetreatRegistrationScheduleIds || [];
    const totalScheduleCount = schedules.length;
    const hasFullAttendance =
      userScheduleIds.length > 0 &&
      userScheduleIds.length === totalScheduleCount;

    return {
      id: reg.id.toString(),
      department: `${reg.univGroupNumber}부`,
      gender: reg.gender,
      grade: `${reg.gradeNumber}학년`,
      name: reg.name,
      phone: reg.userPhoneNumber,
      currentLeaderName: reg.currentLeaderName || null,
      schedules: schedules.reduce(
        (acc, cur) => {
          acc[`schedule_${cur.id}`] = userScheduleIds.includes(cur.id);
          return acc;
        },
        {} as Record<string, boolean>
      ),
      hasFullAttendance,
      type: reg.userType,
      amount: reg.price,
      createdAt: reg.createdAt,
      status: reg.paymentStatus,
      confirmedBy: reg.paymentConfirmUserName || null,
      paymentConfirmedAt: reg.paymentConfirmedAt || null,
      hadRegisteredShuttleBus: reg.hadRegisteredShuttleBus,
      qrUrl: reg.qrUrl || null,
      memo: reg.univGroupStaffScheduleHistoryMemo || null,
      historyMemoId: reg.retreatRegistrationHistoryMemoId || null,
      staffMemo: reg.adminMemo || "",
      adminMemoId: reg.adminMemoId || null,
    };
  });
}
