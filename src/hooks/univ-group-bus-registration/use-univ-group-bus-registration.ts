import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { IUnivGroupBusRegistration } from "@/types/bus-registration";

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.univGroupShuttleBusRegistrations as IUnivGroupBusRegistration[];
};

interface UseUnivGroupBusRegistrationOptions {
  initialData?: IUnivGroupBusRegistration[];
  revalidateOnFocus?: boolean;
  dedupingInterval?: number;
}

/**
 * 부서 셔틀버스 등록 데이터 조회 Hook (SWR)
 *
 * @description
 * 부서별 셔틀버스 신청자 목록을 조회하고 실시간으로 동기화합니다.
 * - Server Component에서 전달받은 initialData를 fallbackData로 사용
 * - SWR로 자동 revalidation 및 캐싱
 *
 * @param retreatSlug - 수양회 슬러그
 * @param options - SWR 옵션 (initialData, revalidateOnFocus 등)
 * @returns SWR 응답 (data, error, isLoading, mutate)
 *
 * @example
 * ```tsx
 * // Server Component에서 전달받은 initialData 사용
 * const { data, mutate } = useUnivGroupBusRegistration(retreatSlug, {
 *   initialData: serverData,
 *   revalidateOnFocus: true,
 * });
 * ```
 */
export function useUnivGroupBusRegistration(
  retreatSlug: string | null,
  options?: UseUnivGroupBusRegistrationOptions
) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/univ-group-registration`
    : null;

  return useSWR<IUnivGroupBusRegistration[], Error>(endpoint, fetcher, {
    fallbackData: options?.initialData,
    revalidateOnFocus: options?.revalidateOnFocus ?? true,
    dedupingInterval: options?.dedupingInterval ?? 2000,
  });
}
