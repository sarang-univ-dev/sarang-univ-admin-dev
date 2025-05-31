import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import Cookies from "js-cookie";

export interface IUserScheduleChangeShuttleBusHistory {
  userRetreatShuttleBusRegistrationId: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  phoneNumber: string;
  beforeUserRetreatShuttleBusRegistrationScheduleIds: number[];
  afterUserRetreatShuttleBusRegistrationScheduleIds: number[];
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

const DUMMY_SHUTTLE_BUS_HISTORIES :IUserScheduleChangeShuttleBusHistory= [
  {
    userRetreatShuttleBusRegistrationId: 147,
    univGroupNumber: 5,
    gender: "MALE",
    gradeNumber: 1,
    name: "오현민",
    phoneNumber: "010-1234-1234",
    beforeUserRetreatShuttleBusRegistrationScheduleIds: [1,2,3,4],
    afterUserRetreatShuttleBusRegistrationScheduleIds: [1,2,3,4,5],
    beforePrice: 60000,
    afterPrice: 60000,
    createdUserName: "신예현",
    createdAt: "2025-05-27T01:29:11.600Z",
    resolvedUserName: null,
    resolvedAt: null
  },
  {
    userRetreatShuttleBusRegistrationId: 212,
    univGroupNumber: 2,
    gender: "MALE",
    gradeNumber: 1,
    name: "진영찬",
    phoneNumber: "010-1234-1234",
    beforeUserRetreatShuttleBusRegistrationScheduleIds: [7,8],
    afterUserRetreatShuttleBusRegistrationScheduleIds: [1,2,3],
    beforePrice: 24000,
    afterPrice: 36000,
    createdUserName: "신예현",
    createdAt: "2025-05-28T02:01:16.095Z",
    resolvedUserName: null,
    resolvedAt: null
  },
  {
    userRetreatShuttleBusRegistrationId: 222,
    univGroupNumber: 7,
    gender: "MALE",
    gradeNumber: 9,
    name: "김학모",
    phoneNumber: "010-2156-6041",
    beforeUserRetreatShuttleBusRegistrationScheduleIds: [1],
    afterUserRetreatShuttleBusRegistrationScheduleIds: [1,2],
    beforePrice: 48000,
    afterPrice: 48000,
    createdUserName: "신예현",
    createdAt: "2025-05-28T04:25:13.876Z",
    resolvedUserName: "신예현",
    resolvedAt: "2025-05-28T04:25:13.881Z"
  }
];


export function useUserScheduleChangeShuttleBusHistory(retreatSlug?: string) {
  // const endpoint = retreatSlug
  //   ? `/api/v1/retreat/${retreatSlug}/account/bus-schedule-change-history`
  //   : null;

  // return useSWR<IUserScheduleChangeShuttleBusHistory[], Error>(endpoint, fetcher);
  return {
    data: DUMMY_SHUTTLE_BUS_HISTORIES,
    isLoading: false,
    error: null,
  };
}
