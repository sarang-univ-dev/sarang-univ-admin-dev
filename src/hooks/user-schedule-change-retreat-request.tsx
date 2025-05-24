import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import {
  UserRetreatRegistrationType,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";

export interface IUserScheduleChangeRetreat {
  userType: UserRetreatRegistrationType | null;
  price: number;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  paymentConfirmedAt: string | null;
  userName: string;
  createdAt: string;
  userRetreatRegistrationId: number;
  userRetreatRegistrationHistoryMemoId: number;
  univGroupNumber: number;
  gradeNumber: number;
  userRetreatRegistrationScheduleIds: number[];
  memo: string;
  issuerName: string;
  memoCreatedAt: string;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.scheduleChangeRequests;
};

export function useUserScheduleChangeRetreat(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/account/schedule-change-request`
    : null;

  return useSWR<IUserScheduleChangeRetreat[], Error>(endpoint, fetcher);
}
