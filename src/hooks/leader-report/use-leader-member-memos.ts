import useSWR, { SWRConfiguration } from "swr";

import { LeaderAdminAPI } from "@/lib/api/leader-admin-api";
import { ILeaderMemberMemo } from "@/types/leader-report";

interface MemberMemoResult {
  memos: ILeaderMemberMemo[];
  date: string;
}

/**
 * 리더 비고(특이사항) 모아보기 훅 (리더보고서 간사 / LEADER_STAFF)
 *
 * - 해당 일자에 비고가 있는 전체 조원 (오늘 일정 유무 무관)
 * - SWR 폴링으로 실시간 동기화
 * - date(optional, 기본값은 서버의 "오늘")
 */
export function useLeaderMemberMemos(
  retreatSlug: string,
  date?: string,
  options?: SWRConfiguration<MemberMemoResult, Error>
) {
  const key = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/leader/admin/member-memos${date ? `?date=${date}` : ""}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => LeaderAdminAPI.getMemberMemos(retreatSlug, date),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
      dedupingInterval: 5000,
      ...options,
    }
  );

  return {
    memos: data?.memos ?? [],
    date: data?.date ?? date ?? null,
    error,
    isLoading,
    mutate,
  };
}
