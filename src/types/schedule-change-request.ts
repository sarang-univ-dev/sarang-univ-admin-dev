import {
  UserRetreatRegistrationType,
  UserRetreatRegistrationPaymentStatus,
} from "./index";

/**
 * 일정 변경 요청 데이터 (서버 응답)
 */
export interface IUserScheduleChangeRetreat {
  userType: UserRetreatRegistrationType | null;
  price: number;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  paymentConfirmedAt: string | null;
  userName: string;
  createdAt: string;
  userRetreatRegistrationId: number;
  userRetreatRegistrationHistoryMemoId: number;
  univGroupNumber: number;
  gradeNumber: number;
  userRetreatRegistrationScheduleIds: number[];
  memo: string;
  issuerName: string;
  memoCreatedAt: string;
}
