import { AxiosError } from "axios";
import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

import { LeaderAdminAPI } from "@/lib/api/leader-admin-api";
import { useToastStore } from "@/store/toast-store";
import { ILeaderTodayInfo } from "@/types/leader-report";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

/**
 * 리더 리포트 - 오늘(일자) 정보 훅 (리더보고서 간사 / LEADER_STAFF)
 *
 * - days 목록 / 현재 today / lastDay 정보 조회
 * - today 변경 (PUT) 후 revalidate
 */
export function useLeaderToday(
  retreatSlug: string,
  options?: SWRConfiguration<ILeaderTodayInfo, Error>
) {
  const addToast = useToastStore(state => state.add);
  const [isUpdating, setIsUpdating] = useState(false);

  const key = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/leader/admin/today`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => LeaderAdminAPI.getToday(retreatSlug),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...options,
    }
  );

  const updateToday = async (date: string) => {
    setIsUpdating(true);

    try {
      // Optimistic update
      await mutate(
        current => (current ? { ...current, today: date } : current),
        { revalidate: false }
      );

      await LeaderAdminAPI.updateToday(retreatSlug, date);

      await mutate();

      addToast({
        title: "성공",
        description: "오늘 일자를 변경했습니다.",
        variant: "success",
      });
    } catch (err) {
      addToast({
        title: "오류",
        description: getErrorMessage(err, "오늘 일자 변경 중 오류가 발생했습니다."),
        variant: "destructive",
      });

      await mutate();
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    today: data?.today ?? null,
    days: data?.days ?? [],
    lastDay: data?.lastDay ?? null,
    isLastDay: data?.isLastDay ?? false,
    error,
    isLoading,
    isUpdating,
    mutate,
    updateToday,
  };
}
