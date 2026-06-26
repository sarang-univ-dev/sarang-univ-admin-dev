import useSWR, { SWRConfiguration } from "swr";

import {
  LeaderAdminAPI,
  LeaderAdminView,
} from "@/lib/api/leader-admin-api";
import { ILeaderAttendance } from "@/types/leader-report";

interface AttendanceResult {
  attendance: ILeaderAttendance[];
  date: string;
}

/**
 * 리더 출석 현황 조회 훅 (리더보고서 간사 / LEADER_STAFF)
 *
 * - SWR 폴링으로 실시간 동기화
 * - date(optional, 기본값은 서버의 "오늘")
 */
export function useLeaderAttendance(
  retreatSlug: string,
  date?: string,
  view: LeaderAdminView = "department",
  options?: SWRConfiguration<AttendanceResult, Error>
) {
  const endpointSegment = view === "all" ? "admin" : "department-admin";
  const key = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/leader/${endpointSegment}/attendance${date ? `?date=${date}` : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () =>
      view === "all"
        ? LeaderAdminAPI.getAttendance(retreatSlug, date)
        : LeaderAdminAPI.getDepartmentAttendance(retreatSlug, date),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
      dedupingInterval: 5000,
      ...options,
    }
  );

  return {
    attendance: data?.attendance ?? [],
    date: data?.date ?? date ?? null,
    error,
    isLoading,
    mutate,
  };
}
