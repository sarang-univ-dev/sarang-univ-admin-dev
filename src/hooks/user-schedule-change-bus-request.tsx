import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import {
  // UserRetreatRegistrationType, >> 새가족, 군인, ...
  UserRetreatShuttleBusPaymentStatus // UserRetreatRegistrationPaymentStatus,
} from "@/types";
import Cookies from "js-cookie";

export interface IUserScheduleChangeShuttleBus {
  price: number;
  paymentStatus: UserRetreatShuttleBusPaymentStatus;
  paymentConfirmedAt: string | null;
  userName: string;
  createdAt: string;
  userRetreatShuttleBusRegistrationId: number;
  userRetreatShuttleBusRegistrationHistoryMemoId: number;
  univGroupNumber: number;
  gradeNumber: number;
  userRetreatShuttleBusRegistrationScheduleIds: number[];
  memo: string;
  issuerName: string;
  memoCreatedAt: string;
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

const DUMMY_SHUTTLE_BUS_REQUESTS = [
  {
    price: 32000,
    paymentStatus: "PAID",
    paymentConfirmedAt: "2025-05-19T13:58:39.618Z",
    userName: "박희서새가족",
    createdAt: "2025-05-19T13:30:32.219Z",
    userRetreatShuttleBusRegistrationId: 2,
    userRetreatShuttleBusRegistrationHistoryMemoId: 9,
    univGroupNumber: 3,
    gradeNumber: 8,
    userRetreatShuttleBusRegistrationScheduleIds: [
      1, 2, 6, 7
    ],
    memo: "memo",
    issuerName: "김상묵",
    memoCreatedAt: "2025-05-22T15:27:27.527Z"
  }
];

export function useUserScheduleChangeShuttleBus(retreatSlug?: string) {
  // const endpoint = retreatSlug
  //   ? `/api/v1/retreat/${retreatSlug}/account/schedule-change-request` // TODO: 이거 api 경로
  //   : null;
  //
  // return useSWR<IUserScheduleChangeShuttleBus[], Error>(endpoint, fetcher);

  return {
    data: DUMMY_SHUTTLE_BUS_REQUESTS,
    isLoading: false,
    error: null,
  };
}
