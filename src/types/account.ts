import { Gender, UserRetreatRegistrationType, UserRetreatRegistrationPaymentStatus } from "./index";

/**
 * 재정 간사 수양회 신청 데이터 타입
 */
export interface IRetreatRegistration {
  id: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  phoneNumber: string;
  userRetreatRegistrationScheduleIds: number[];
  price: number;
  userType: UserRetreatRegistrationType | null;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  createdAt: string;
  paymentConfirmUserName?: string | null;
  paymentConfirmedAt?: string | null;
  accountMemo?: string | null;
  accountMemoId?: number | null;
}
