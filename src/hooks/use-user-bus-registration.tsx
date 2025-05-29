import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";
import Cookies from "js-cookie";

export interface IUserBusRegistration {
  id: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  price: number;
  userRetreatShuttleBusRegistrationScheduleIds: number[];
  isAdminContact: boolean;
  shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus;
  createdAt: string;
  paymentConfirmUserName?: string | null;
  paymentConfirmedAt?: string | null;
  userPhoneNumber: string;
  univGroupStaffShuttleBusHistoryMemo?: string | null;
}

const fetcher = async (url: string) => {
  //TODO once api is  made
  // const accessToken = Cookies.get("accessToken");
  // const response = await webAxios.get(url, {
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`,
  //   },
  // });
  // API 응답 구조 변경 반영
    const response = {
    data: {
      univGroupShuttleBusRegistrations: [
        {
          id: 1,
          univGroupNumber: 3,
          gender: Gender.MALE,
          gradeNumber: 2,
          name: "홍길동",
          price: 15000,
          userRetreatShuttleBusRegistrationScheduleIds: [1, 2, 3],
          isAdminContact: true,
          shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PAID,
          createdAt: "2025-05-27T14:32:45.000Z",
          paymentConfirmUserName: "김관리",
          paymentConfirmedAt: "2025-05-28T02:20:30.000Z",
          userPhoneNumber: "010-1234-5678",
          univGroupStaffShuttleBusHistoryMemo: "정상 처리됨"
        },
        {
          id: 2,
          univGroupNumber: 2,
          gender: Gender.FEMALE,
          gradeNumber: 3,
          name: "이영희",
          price: 15000,
          userRetreatShuttleBusRegistrationScheduleIds: [1, 2, 3, 4],
          isAdminContact: false,
          shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PENDING,
          createdAt: "2025-05-28T00:15:00.000Z",
          paymentConfirmUserName: null,
          paymentConfirmedAt: null,
          userPhoneNumber: "010-9876-5432",
          univGroupStaffShuttleBusHistoryMemo: null
        },
        {
          id: 3,
          univGroupNumber: 8,
          gender: Gender.FEMALE,
          gradeNumber: 1,
          name: "최철수",
          price: 15000,
          userRetreatShuttleBusRegistrationScheduleIds: [1, 2, 3, 4, 5],
          isAdminContact: false,
          shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PENDING,
          createdAt: "2025-05-28T08:45:10.123Z",
          paymentConfirmUserName: null,
          paymentConfirmedAt: null,
          userPhoneNumber: "010-1111-2222",
          univGroupStaffShuttleBusHistoryMemo: "현장 결제 예정"
        }
      ]
    }
  };
  return response.data.univGroupShuttleBusRegistrations;
};

export function useUserBusRegistration(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`
    : null;

  return useSWR<IUserBusRegistration[], Error>(endpoint, fetcher);
}
