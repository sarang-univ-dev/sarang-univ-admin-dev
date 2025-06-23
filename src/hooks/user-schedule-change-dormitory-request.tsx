import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import {
  UserRetreatRegistrationType,
  Gender,
} from "@/types";
import Cookies from "js-cookie";

export interface IUserScheduleChangeDormitory {
  id: number;
  userType: UserRetreatRegistrationType | null;
  userName: string;
  gender: Gender;
  memo: string;
  issuerName: string;
  memoCreatedAt: string;
  userRetreatRegistrationId: number;
  userRetreatRegistrationHistoryMemoId: number;
  univGroupNumber: number;
  gradeNumber: number;
  gbsNumber?: number;
  dormitoryLocation?: string;
  beforeScheduleIds?: number[];
  afterScheduleIds?: number[];
  dormitoryReviewerName?: string;
}

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.scheduleChangeRequests;
};

export function useUserScheduleChangeDormitory(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/schedule-change-request`
    : null;

  const { data, error, isLoading, mutate } = useSWR<IUserScheduleChangeDormitory[], Error>(endpoint, fetcher);

  return { data, error, isLoading, mutate };
} 