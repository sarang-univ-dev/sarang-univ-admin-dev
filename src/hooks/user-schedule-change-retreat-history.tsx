import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import Cookies from "js-cookie";

export interface IUserScheduleChangeHistory {
  userRetreatRegistrationId: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  phoneNumber: string;
  beforeUserRetreatRegistrationScheduleIds: number[];
  afterUserRetreatRegistrationScheduleIds: number[];
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
  return response.data.scheduleChangeHistories;
};

export function useUserScheduleChangeHistory(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/account/schedule-change-history`
    : null;

  return useSWR<IUserScheduleChangeHistory[], Error>(endpoint, fetcher);
}
