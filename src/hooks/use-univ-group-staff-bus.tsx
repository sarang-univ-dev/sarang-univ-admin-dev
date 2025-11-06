import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";

/**
 * 부서 셔틀버스 등록 데이터
 *
 * @description
 * 부서별 셔틀버스 신청자 정보를 담고 있는 인터페이스입니다.
 * - 입금 현황, 일정 변경 메모 등 포함
 * - 서버 API 응답과 일치하는 구조
 */
export interface IUnivGroupStaffBus {
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

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
//   const response = {
//     data: {
//       univGroupShuttleBusRegistrations: [
//         {
//           id: 1,
//           univGroupNumber: 3,
//           gender: Gender.MALE,
//           gradeNumber: 2,
//           name: "홍길동",
//           price: 15000,
//           userRetreatShuttleBusRegistrationScheduleIds: [1, 2, 3],
//           isAdminContact: true,
//           shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PAID,
//           createdAt: "2025-05-27T14:32:45.000Z",
//           paymentConfirmUserName: "김관리",
//           paymentConfirmedAt: "2025-05-28T02:20:30.000Z",
//           userPhoneNumber: "010-1234-5678",
//           univGroupStaffShuttleBusHistoryMemo: "정상 처리됨",
//           currentLeaderName: "김리더"
//         },
//         {
//           id: 2,
//           univGroupNumber: 2,
//           gender: Gender.FEMALE,
//           gradeNumber: 3,
//           name: "이영희",
//           price: 15000,
//           userRetreatShuttleBusRegistrationScheduleIds: [1, 2, 3, 4],
//           isAdminContact: false,
//           shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PENDING,
//           createdAt: "2025-05-28T00:15:00.000Z",
//           paymentConfirmUserName: null,
//           paymentConfirmedAt: null,
//           userPhoneNumber: "010-9876-5432",
//           univGroupStaffShuttleBusHistoryMemo: null,
//           currentLeaderName: "김리더"
//         },
//         {
//           id: 3,
//           univGroupNumber: 5,
//           gender: Gender.FEMALE,
//           gradeNumber: 1,
//           name: "최철수",
//           price: 15000,
//           userRetreatShuttleBusRegistrationScheduleIds: [1, 2, 3, 4, 5],
//           isAdminContact: false,
//           shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PAID,
//           createdAt: "2025-05-28T08:45:10.123Z",
//           paymentConfirmUserName: null,
//           paymentConfirmedAt: null,
//           userPhoneNumber: "010-1111-2222",
//           univGroupStaffShuttleBusHistoryMemo: "현장 결제 예정",
//           currentLeaderName: "김리더"
//         },
//         {
//           id: 4,
//           univGroupNumber: 5,
//           gender: Gender.FEMALE,
//           gradeNumber: 1,
//           name: "김조원",
//           price: 15000,
//           userRetreatShuttleBusRegistrationScheduleIds: [1, 2, 3, 4, 5],
//           isAdminContact: false,
//           shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PAID,
//           createdAt: "2025-05-28T08:45:10.123Z",
//           paymentConfirmUserName: null,
//           paymentConfirmedAt: null,
//           userPhoneNumber: "010-1111-2222",
//           univGroupStaffShuttleBusHistoryMemo: null,
//           currentLeaderName: "김리더"
//         }
//       ]
//   }
// };
  return response.data.univGroupShuttleBusRegistrations;
};

export function useUnivGroupStaffBus(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/univ-group-registration`
    : null;  

  return useSWR<IUnivGroupStaffBus[], Error>(endpoint, fetcher);
}
