import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { TRetreatUnivGroup } from "@/types";

/**
 * 수양회 부서 정보를 가져오는 SWR 훅
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns SWR 응답 (univGroups, isLoading, error)
 */
export function useRetreatUnivGroups(retreatSlug?: string) {
  return useSWR(
    retreatSlug ? `/api/v1/retreat/${retreatSlug}/univ-group-info` : null,
    async (url) => {
      const response = await webAxios.get(url);
      return response.data.retreatUnivGroup as TRetreatUnivGroup[];
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 캐싱
    }
  );
}
