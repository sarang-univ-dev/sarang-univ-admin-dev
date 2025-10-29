import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";

export interface IUnivGroupStaffRetreat {
  id: number;
  retreatId: number;
  userId: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  userPhoneNumber: string;
  userRetreatRegistrationScheduleIds?: number[];
  price: number;
  userType: UserRetreatRegistrationType | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  paymentConfirmedUserId?: number | null;
  paymentConfirmedAt?: string | null;
  paymentConfirmUserName?: string | null;
  currentLeaderName?: string | null;
  qrUrl?: string | null;
  gbsName: string | null;
  dormitoryName: string | null;
  univGroupStaffScheduleHistoryMemo?: string | null;
  univGroupStaffScheduleHistoryResolvedAt?: string | null;
  univGroupStaffScheduleHistoryResolvedUserName?: string | null;
  hadRegisteredShuttleBus: boolean;
  adminMemo?: string | null;
  adminMemoId?: number | null;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  // API 응답 구조 변경 반영
  return response.data.userRetreatRegistrations;
};

export function useUnivGroupStaffRetreat(retreatSlug?: string) {
  //TODO once api is made
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`
    : null;

  return useSWR<IUnivGroupStaffRetreat[], Error>(endpoint, fetcher);
}
