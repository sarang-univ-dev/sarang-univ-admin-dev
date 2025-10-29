import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import {
  UserRetreatRegistrationType,
  Gender,
} from "@/types";

export interface IUserScheduleChangeLineup {
  id: number;
  userType: UserRetreatRegistrationType | null;
  createdAt: string;
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
  currentLeaderName: string;
  gbsNumber?: number;
  gbsLeaderNames?: string[];
  lineupReviewerName?: string;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.scheduleChangeRequests;
};

export function useUserScheduleChangeLineup(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/schedule-change-request`
    : null;

  const { data, error, isLoading, mutate } = useSWR<IUserScheduleChangeLineup[], Error>(endpoint, fetcher);

  return { data, error, isLoading, mutate };
} 