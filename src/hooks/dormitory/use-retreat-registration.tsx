import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";

/**
 * 숙소팀 수양회 신청 데이터 타입
 */
export interface IDormitoryRetreatRegistration {
  id: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: Gender;
  name: string;
  userRetreatRegistrationScheduleIds: number[];
  gbsNumber?: number | null;
  dormitoryLocation?: string;
  dormitoryTeamMemberMemo?: string;
  isLeader: boolean;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.userRetreatRegistrations;
};

/**
 * 숙소팀 수양회 신청 목록 조회 훅
 *
 * @description
 * - 인원관리 팀원이 조회하는 수양회 신청 목록
 * - SWR을 통한 데이터 캐싱 및 자동 갱신
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns 신청 목록 데이터 및 상태
 */
export function useDormitoryRetreatRegistration(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/user-retreat-dormitory-team-member`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    IDormitoryRetreatRegistration[]
  >(endpoint, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  return {
    registrations: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
