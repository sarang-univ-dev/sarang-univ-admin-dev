import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";
import Cookies from "js-cookie";

export interface IUnivGroupStaffBus {
  id: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  price: number;
  userRetreatShuttleBusRegistrationScheduleIds?: number[];
  isAdminContact: boolean;
  shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus;
  createdAt: string;
  paymentConfirmUserName?: string | null;
  paymentConfirmedAt?: string | null;
  userPhoneNumber: string;
  univGroupStaffShuttleBusHistoryMemo?: string | null;
  currentLeaderName?: string | null;
}

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
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
