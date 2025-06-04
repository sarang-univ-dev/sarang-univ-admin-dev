import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import Cookies from "js-cookie";

export interface IUserScheduleChangeShuttleBusHistory {
  userRetreatShuttleBusRegistrationId: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  phoneNumber: string;
  beforeUserRetreatShuttleBusRegistrationScheduleIds: number[];
  afterUserRetreatShuttleBusRegistrationScheduleIds: number[];
  beforePrice: number;
  afterPrice: number;
  createdUserName: string;
  createdAt: string;
  resolvedUserName: string | null;
  resolvedAt: string | null;
}

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.shuttleBusScheduleChangeHistories;
};

export function useUserScheduleChangeShuttleBusHistory(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/bus-registration-change-history`
    : null;

  return useSWR<IUserScheduleChangeShuttleBusHistory[], Error>(endpoint, fetcher);
}
