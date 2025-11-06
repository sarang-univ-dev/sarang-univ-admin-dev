import { Gender, UserRetreatShuttleBusPaymentStatus } from "@/types";

/**
 * 부서 셔틀버스 등록 데이터
 *
 * @description
 * 부서별 셔틀버스 신청자 정보를 담고 있는 인터페이스입니다.
 * - 입금 현황, 일정 변경 메모 등 포함
 * - 서버 API 응답과 일치하는 구조
 */
export interface IUnivGroupBusRegistration {
  /** 등록 ID (고유 식별자) */
  id: number;
  /** 부서 번호 */
  univGroupNumber: number;
  /** 성별 */
  gender: Gender;
  /** 학년 */
  gradeNumber: number;
  /** 신청자 이름 */
  name: string;
  /** 버스 요금 */
  price: number;
  /** 선택한 셔틀버스 스케줄 ID 목록 */
  userRetreatShuttleBusRegistrationScheduleIds?: number[];
  /** 관리자 연락처 여부 */
  isAdminContact: boolean;
  /** 입금 현황 상태 */
  shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus;
  /** 신청 생성 시각 */
  createdAt: string;
  /** 입금 확인 처리자 이름 (nullable) */
  paymentConfirmUserName?: string | null;
  /** 입금 확인 처리 시각 (nullable) */
  paymentConfirmedAt?: string | null;
  /** 신청자 전화번호 */
  userPhoneNumber: string;
  /** 일정 변경 요청 메모 (nullable) */
  univGroupStaffShuttleBusHistoryMemo?: string | null;
  /** 현재 부서 리더 이름 (nullable) */
  currentLeaderName?: string | null;
}
