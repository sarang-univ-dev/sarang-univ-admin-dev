import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { TRetreatRegistrationSchedule } from "@/types";

/**
 * 수양회 스케줄 데이터를 가져오는 SWR 훅
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns SWR 응답 (schedules, isLoading, error)
 */
export function useRetreatSchedules(retreatSlug?: string) {
  return useSWR(
    retreatSlug ? `/api/v1/retreat/${retreatSlug}/info` : null,
    async (url) => {
      const response = await webAxios.get(url);
      return response.data.retreatInfo.schedule as TRetreatRegistrationSchedule[];
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 캐싱 (스케줄은 자주 변경되지 않음)
    }
  );
}
