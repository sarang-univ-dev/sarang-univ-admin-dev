import { AxiosError } from "axios";
import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

import {
  LeaderAdminAPI,
  LeaderAdminView,
} from "@/lib/api/leader-admin-api";
import { useToastStore } from "@/store/toast-store";
import {
  ILeaderScheduleChangeRequest,
  LeaderScheduleChangeRequestStatus,
} from "@/types/leader-report";

/**
 * 서버 에러 메시지를 추출 (AxiosError 우선, fallback 제공)
 */
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
 * 리더 일정 변경 요청 통합 훅 (인원관리 / DORMITORY)
 *
 * Features:
 * - SWR 폴링으로 실시간 동기화
 * - Optimistic update + rollback (mutate)
 * - 승인 / 거절 처리
 * - destructive toast 에러 핸들링
 */
export function useLeaderScheduleChangeRequest(
  retreatSlug: string,
  status: LeaderScheduleChangeRequestStatus = "PENDING",
  view: LeaderAdminView = "department",
  options?: SWRConfiguration<ILeaderScheduleChangeRequest[], Error>
) {
  const addToast = useToastStore(state => state.add);
  const [isMutating, setIsMutating] = useState(false);

  const endpointSegment = view === "all" ? "admin" : "department-admin";
  const key = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/leader/${endpointSegment}/schedule-change-requests?status=${status}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () =>
      view === "all"
        ? LeaderAdminAPI.getScheduleChangeRequests(retreatSlug, status)
        : LeaderAdminAPI.getDepartmentScheduleChangeRequests(
            retreatSlug,
            status
          ),
    {
      revalidateOnFocus: false,
      refreshInterval: 10000,
      dedupingInterval: 5000,
      ...options,
    }
  );

  const runMutation = async (
    action: () => Promise<ILeaderScheduleChangeRequest>,
    requestId: number,
    successMessage: string,
    fallbackErrorMessage: string
  ) => {
    setIsMutating(true);

    try {
      // Optimistic update: 처리된 요청을 목록에서 제거 (현재 status 필터 기준)
      await mutate(
        current => (current ?? []).filter(req => req.id !== requestId),
        { revalidate: false }
      );

      await action();

      await mutate();

      addToast({
        title: "성공",
        description: successMessage,
        variant: "success",
      });
    } catch (err) {
      addToast({
        title: "오류",
        description: getErrorMessage(err, fallbackErrorMessage),
        variant: "destructive",
      });

      // Rollback
      await mutate();
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const approveRequest = async (
    requestId: number,
    memo: string,
    afterScheduleIds: number[]
  ) => {
    await runMutation(
      () =>
        LeaderAdminAPI.approveScheduleChangeRequest(
          retreatSlug,
          requestId,
          memo,
          afterScheduleIds
        ),
      requestId,
      "일정 변경 요청을 승인했습니다.",
      "일정 변경 요청 승인 중 오류가 발생했습니다."
    );
  };

  const rejectRequest = async (requestId: number) => {
    await runMutation(
      () => LeaderAdminAPI.rejectScheduleChangeRequest(retreatSlug, requestId),
      requestId,
      "일정 변경 요청을 거절했습니다.",
      "일정 변경 요청 거절 중 오류가 발생했습니다."
    );
  };

  const runMemoMutation = async (
    action: () => Promise<unknown>,
    successMessage: string,
    fallbackErrorMessage: string
  ) => {
    setIsMutating(true);

    try {
      await action();
      await mutate();
      addToast({
        title: "성공",
        description: successMessage,
        variant: "success",
      });
    } catch (err) {
      addToast({
        title: "오류",
        description: getErrorMessage(err, fallbackErrorMessage),
        variant: "destructive",
      });
      await mutate();
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const saveMemo = async (requestId: number, memo: string) => {
    await runMemoMutation(
      () =>
        view === "all"
          ? LeaderAdminAPI.createScheduleChangeRequestMemo(
              retreatSlug,
              requestId,
              memo
            )
          : LeaderAdminAPI.createDepartmentScheduleChangeRequestMemo(
              retreatSlug,
              requestId,
              memo
            ),
      "메모를 저장했습니다.",
      "메모 저장 중 오류가 발생했습니다."
    );
  };

  const updateMemo = async (memoId: number, memo: string) => {
    await runMemoMutation(
      () =>
        view === "all"
          ? LeaderAdminAPI.updateScheduleChangeRequestMemo(
              retreatSlug,
              memoId,
              memo
            )
          : LeaderAdminAPI.updateDepartmentScheduleChangeRequestMemo(
              retreatSlug,
              memoId,
              memo
            ),
      "메모를 저장했습니다.",
      "메모 저장 중 오류가 발생했습니다."
    );
  };

  const deleteMemo = async (memoId: number) => {
    await runMemoMutation(
      () =>
        view === "all"
          ? LeaderAdminAPI.deleteScheduleChangeRequestMemo(
              retreatSlug,
              memoId
            )
          : LeaderAdminAPI.deleteDepartmentScheduleChangeRequestMemo(
              retreatSlug,
              memoId
            ),
      "메모를 삭제했습니다.",
      "메모 삭제 중 오류가 발생했습니다."
    );
  };

  return {
    requests: data ?? [],
    error,
    isLoading,
    isMutating,
    mutate,
    approveRequest,
    rejectRequest,
    saveMemo,
    updateMemo,
    deleteMemo,
  };
}
