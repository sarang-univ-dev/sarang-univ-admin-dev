import { Gender, UserRetreatRegistrationType, UserRetreatRegistrationPaymentStatus } from "./index";

/**
 * 부서 행정 간사 - 수양회 신청 데이터
 */
export interface IUnivGroupAdminStaffRetreat {
  id: number;
  retreatId: number;
  userId: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  userPhoneNumber: string;
  userRetreatRegistrationScheduleIds?: number[];
  price: number;
  userType: UserRetreatRegistrationType | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  paymentConfirmedAdminUserId?: number | null;
  paymentConfirmedAt?: string | null;
  paymentConfirmUserName?: string | null;
  currentLeaderName?: string | null;
  qrUrl?: string | null;
  univGroupStaffScheduleHistoryMemo?: string | null;
  retreatRegistrationHistoryMemoId?: number | null;
  univGroupStaffScheduleHistoryResolvedAt?: string | null;
  univGroupStaffScheduleHistoryResolvedUserName?: string | null;
  hadRegisteredShuttleBus: boolean;
  adminMemo?: string | null;
  adminMemoId?: number | null;
}

/**
 * TanStack Table을 위한 변환된 데이터 타입
 */
export interface UnivGroupAdminStaffData {
  id: string;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  phone: string;
  currentLeaderName: string | null;
  schedules: Record<string, boolean>; // schedule_${id} -> boolean
  hasFullAttendance: boolean; // 전체 스케줄 참석 여부
  type: UserRetreatRegistrationType | null;
  amount: number;
  createdAt: string;
  status: UserRetreatRegistrationPaymentStatus;
  confirmedBy: string | null;
  paymentConfirmedAt: string | null;
  hadRegisteredShuttleBus: boolean;
  qrUrl: string | null;
  memo: string | null; // 일정 변동 요청 메모
  historyMemoId: number | null; // 일정 변동 요청 메모 ID
  staffMemo: string; // 행정간사 메모
  adminMemoId: number | null;
}
