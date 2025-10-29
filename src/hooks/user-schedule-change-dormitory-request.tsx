import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import {
  UserRetreatRegistrationType,
  Gender,
} from "@/types";

export interface IUserScheduleChangeDormitory {
  id: number;
  userType: UserRetreatRegistrationType | null;
  userName: string;
  gender: Gender;
  userRetreatRegistrationScheduleIds: number[];
  memo: string;
  issuerName: string;
  memoCreatedAt: string;
  userRetreatRegistrationId: number;
  userRetreatRegistrationHistoryMemoId: number;
  univGroupNumber: number;
  gradeNumber: number;
  gbsNumber?: number;
  dormitoryLocation?: string;
  dormitoryReviewerName?: string;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.scheduleChangeRequests;
};

export function useUserScheduleChangeDormitory(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/schedule-change-request`
    : null;

  const { data, error, isLoading, mutate } = useSWR<IUserScheduleChangeDormitory[], Error>(endpoint, fetcher);

  return { data, error, isLoading, mutate };
} 