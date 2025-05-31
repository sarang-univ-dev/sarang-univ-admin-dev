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
}

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.retreatShuttleBusRegistrations;
};

export function useUserBusRegistration(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`
    : null;

  return useSWR<IUserBusRegistration[], Error>(endpoint, fetcher);
}
