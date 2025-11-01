import useSWR, { SWRConfiguration } from "swr";
import { webAxios } from "@/lib/api/axios";

export interface IUserRetreatGBSLineup {
  gbsNumber: number | null;
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
  return response.data.userRetreatGbsLineups;
};

/**
 * 수양회 GBS 라인업 데이터 조회 훅 (실시간 polling)
 *
 * @description
 * - 2초마다 polling하여 실시간 협업 지원
 * - SWR의 deep comparison으로 불필요한 리렌더링 방지
 * - fallbackData로 Server Component의 initialData 활용
 *
 * @param retreatSlug - 수양회 슬러그
 * @param options - SWR 설정 옵션
 * @returns 라인업 데이터, 에러, 로딩 상태, mutate 함수
 */
export function useRetreatGbsLineupData(
  retreatSlug: string,
  options?: SWRConfiguration<IUserRetreatGBSLineup[], Error>
) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`
    : null;

  return useSWR<IUserRetreatGBSLineup[], Error>(
    endpoint,
    fetcher,
    {
      // ✅ 실시간 협업을 위한 2초 polling
      refreshInterval: 2000,

      // ✅ 탭 포커스 시 갱신
      revalidateOnFocus: true,

      // ✅ 네트워크 재연결 시 갱신
      revalidateOnReconnect: true,

      // ✅ 2초 내 중복 요청 제거
      dedupingInterval: 2000,

      // ✅ 에러 발생 시 재시도
      errorRetryCount: 3,
      errorRetryInterval: 5000,

      // ✅ Server Component의 initialData를 fallback으로 사용
      ...options,
    }
  );
}
