import useSWR from "swr";

import { webAxios } from "@/lib/api/axios";
import {
  UserRetreatRegistrationType,
  Gender,
  UserRetreatRegistrationScheduleHistoryMemoType,
} from "@/types";

export type ScheduleHistoryRoleMemo = {
  id: number;
  memoType: UserRetreatRegistrationScheduleHistoryMemoType;
  memo: string;
  createdAdminUserName?: string | null;
  updatedAdminUserName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface IUserScheduleChangeLineup {
  userType: UserRetreatRegistrationType | null;
  createdAt: string;
  userName: string;
  phoneNumber: string;
  gender: Gender;
  userRetreatRegistrationId: number;
  userRetreatRegistrationScheduleHistoryId: number;
  beforeUserRetreatRegistrationScheduleIds: number[];
  afterUserRetreatRegistrationScheduleIds: number[];
  beforePrice: number;
  afterPrice: number;
  createdUserName: string;
  historyCreatedAt: string;
  resolvedUserName?: string | null;
  resolvedAt?: string | null;
  univGroupNumber: number;
  gradeNumber: number;
  currentLeaderName: string;
  gbsNumber?: number;
  gbsLeaderNames?: string[];
  lineupReviewerName?: string | null;
  lineupReviewedAt?: string | null;
  scheduleHistoryMemos?: Partial<
    Record<UserRetreatRegistrationScheduleHistoryMemoType, ScheduleHistoryRoleMemo>
  >;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.scheduleChangeRequests;
};

export function useUserScheduleChangeLineup(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/schedule-change-request`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    IUserScheduleChangeLineup[],
    Error
  >(endpoint, fetcher);

  return { data, error, isLoading, mutate };
}
