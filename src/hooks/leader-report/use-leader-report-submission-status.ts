import useSWR, { SWRConfiguration } from "swr";

import {
  LeaderAdminAPI,
  LeaderAdminView,
} from "@/lib/api/leader-admin-api";
import { ILeaderReportSubmissionStatus } from "@/types/leader-report";

interface SubmissionStatusResult {
  submissionStatus: ILeaderReportSubmissionStatus[];
  date: string;
}

/**
 * 리더 리포트 제출 현황 조회 훅 (교육 간사 / EDUCATION_STAFF)
 *
 * - SWR 폴링으로 실시간 동기화
 * - date(optional, 기본값은 서버의 "오늘")
 */
export function useLeaderReportSubmissionStatus(
  retreatSlug: string,
  date?: string,
  view: LeaderAdminView = "department",
  options?: SWRConfiguration<SubmissionStatusResult, Error>
) {
  const endpointSegment = view === "all" ? "admin" : "department-admin";
  const key = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/leader/${endpointSegment}/report-submission-status${date ? `?date=${date}` : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () =>
      view === "all"
        ? LeaderAdminAPI.getReportSubmissionStatus(retreatSlug, date)
        : LeaderAdminAPI.getDepartmentReportSubmissionStatus(
            retreatSlug,
            date
          ),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
      dedupingInterval: 5000,
      ...options,
    }
  );

  return {
    submissionStatus: data?.submissionStatus ?? [],
    date: data?.date ?? date ?? null,
    error,
    isLoading,
    mutate,
  };
}
