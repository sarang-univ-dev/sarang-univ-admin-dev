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
}

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.univGroupShuttleBusRegistrations;
};

export function useUnivGroupStaffBus(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/univ-group-registration`
    : null;

  return useSWR<IUnivGroupStaffBus[], Error>(endpoint, fetcher);
}
