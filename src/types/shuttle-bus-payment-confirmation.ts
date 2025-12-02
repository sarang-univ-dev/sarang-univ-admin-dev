import { Gender, UserRetreatShuttleBusPaymentStatus } from "@/types";

/**
 * 셔틀버스 재정 팀원용 신청 내역 데이터
 *
 * @description
 * SHUTTLE_BUS_ACCOUNT_MEMBER 권한으로 조회 가능한 셔틀버스 신청 정보
 */
export interface IShuttleBusPaymentConfirmationRegistration {
  /** 신청 ID */
  id: number;

  /** 부서 번호 */
  univGroupNumber: number;

  /** 성별 */
  gender: Gender;

  /** 학년 */
  gradeNumber: number;

  /** 이름 */
  name: string;

  /** 전화번호 */
  userPhoneNumber?: string;

  /** 금액 */
  price: number;

  /** 선택한 셔틀버스 스케줄 ID 배열 */
  userRetreatShuttleBusRegistrationScheduleIds: number[];

  /** 관리자 연락처 여부 */
  isAdminContact: boolean;

  /** 입금 현황 */
  shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus;

  /** 신청 시각 (timestamp) */
  createdAt: string;

  /** 처리자명 (입금 확인 처리한 사람) */
  paymentConfirmUserName?: string | null;

  /** 처리 시각 (입금 확인 처리 시각) (timestamp) */
  paymentConfirmedAt?: string | null;
}
