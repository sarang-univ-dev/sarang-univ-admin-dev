import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";

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
  const response = await webAxios.get(url);

  return response.data.retreatShuttleBusRegistrations;
};

export function useUserBusRegistration(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`
    : null;

  return useSWR<IUserBusRegistration[], Error>(endpoint, fetcher);
}
