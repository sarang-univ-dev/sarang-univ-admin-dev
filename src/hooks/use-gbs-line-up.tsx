import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";

export interface IUserRetreatGBSLineup {
  gbsNumber: number;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  fullAttendanceCount: number;
  partialAttendanceCount: number;
  id: number;
  userId: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: "MALE" | "FEMALE";
  name: string;
  phoneNumber: string;
  isLeader: boolean;
  gbsMemo: string;
  lineupMemo: string;
  lineupMemoId: string;
  lineupMemocolor: string;
  isFullAttendance: boolean;
  currentLeader: string;
  userType: string | null;
  userRetreatRegistrationScheduleIds: number[];
  unresolvedLineupHistoryMemo?: string | null;
  adminMemo?: string | null;
}


const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  // API 응답 구조 변경 반영
  return response.data.userRetreatGbsLineups;
};

export function useUserLineups(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`
    : null;

  return useSWR<IUserRetreatGBSLineup[], Error>(
      endpoint,
      fetcher,
      {
        // 2초마다 자동 리패치
        refreshInterval: 2000,
        // 탭 포커스 복귀 시 리패치
        revalidateOnFocus: true,
        // 네트워크 재연결 시 리패치
        revalidateOnReconnect: true,
      }
  );
}
