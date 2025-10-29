import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";

export interface IRetreatRegistration {
  id: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  phoneNumber: string;
  userRetreatRegistrationScheduleIds: number[];
  price: number;
  userType: UserRetreatRegistrationType | null;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  createdAt: string;
  paymentConfirmUserName?: string | null;
  paymentConfirmedAt?: string | null;
  accountMemo?: string | null;
  accountMemoId?: number | null;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  // API 응답 구조 변경 반영
  return response.data.retreatRegistrations;
};

export function useUserRetreatRegistration(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/account/retreat-registrations`
    : null;

  return useSWR<IRetreatRegistration[], Error>(endpoint, fetcher);
}
