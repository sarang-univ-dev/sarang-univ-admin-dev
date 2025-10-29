import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";

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
  //TODO: edit once api is made
  lineupResolvedUserName: string | null;
  lineupResolvedAt: string | null;
  dormResolvedUserName: string | null;
  dormResolvedAt: string | null;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.scheduleChangeHistories;
};

export function useUserScheduleChangeHistory(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/account/schedule-change-history`
    : null;

  return useSWR<IUserScheduleChangeHistory[], Error>(endpoint, fetcher);
}
