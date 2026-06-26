import useSWR, { SWRConfiguration } from "swr";

import { LeaderAdminAPI } from "@/lib/api/leader-admin-api";
import { ILeaderReport } from "@/types/leader-report";

/**
 * 리더 리포트(은혜나눔/기도제목) 조회 훅 (리더보고서 간사 / LEADER_STAFF)
 *
 * - SWR 폴링으로 실시간 동기화
 * - date(optional)로 일자 필터링
 */
export function useLeaderReports(
  retreatSlug: string,
  date?: string,
  options?: SWRConfiguration<ILeaderReport[], Error>
) {
  const key = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/leader/department-admin/reports${date ? `?date=${date}` : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => LeaderAdminAPI.getDepartmentReports(retreatSlug, date),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
      dedupingInterval: 5000,
      ...options,
    }
  );

  return {
    reports: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
