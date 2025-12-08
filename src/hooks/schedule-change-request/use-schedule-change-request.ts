import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { ScheduleChangeRequestAPI } from "@/lib/api/schedule-change-request-api";
import { IUserScheduleChangeRetreat } from "@/types";
import { AxiosError } from "axios";

/**
 * 일정 변경 요청 통합 훅
 *
 * Features:
 * - SWR로 데이터 페칭 및 캐싱
 * - Optimistic updates
 * - 일정 변경 승인/처리
 * - 일정 변경 처리 완료
 * - 에러 핸들링
 */
export function useScheduleChangeRequest(
  retreatSlug: string,
  options?: SWRConfiguration<IUserScheduleChangeRetreat[], Error>
) {
  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirmDialogStore();
  const [isMutating, setIsMutating] = useState(false);

  const endpoint = `/api/v1/retreat/${retreatSlug}/account/schedule-change-request`;

  // SWR로 데이터 페칭
  const { data, error, isLoading, mutate } = useSWR(
    retreatSlug ? endpoint : null,
    () => ScheduleChangeRequestAPI.getScheduleChangeRequests(retreatSlug),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...options,
    }
  );

  /**
   * 공통 캐시 업데이트 함수
   */
  const updateCache = async (
    action: () => Promise<void>,
    optimisticUpdate?: (currentData: IUserScheduleChangeRetreat[] | undefined) => IUserScheduleChangeRetreat[],
    successMessage?: string
  ) => {
    setIsMutating(true);

    try {
      // Optimistic update
      if (optimisticUpdate) {
        await mutate(optimisticUpdate, {
          revalidate: false,
        });
      }

      // 실제 API 호출
      await action();

      // 서버 데이터로 revalidate
      await mutate();

      if (successMessage) {
        addToast({
          title: "성공",
          description: successMessage,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error during cache update:", error);
      addToast({
        title: "오류",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "작업 중 오류가 발생했습니다.",
        variant: "destructive",
      });

      // Rollback on error
      await mutate();

      // 에러를 다시 throw하여 호출자가 처리할 수 있도록 함
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * 일정 변경 승인 (처리)
   * - 확인 다이얼로그는 ScheduleChangeModal에서 처리
   * - 토스트도 ScheduleChangeModal에서 표시
   */
  const approveScheduleChange = async (
    userRetreatRegistrationId: string,
    afterScheduleIds: number[]
  ) => {
    await updateCache(
      () =>
        ScheduleChangeRequestAPI.approveScheduleChange(
          retreatSlug,
          userRetreatRegistrationId,
          afterScheduleIds
        ),
      undefined,
      undefined // 토스트는 ScheduleChangeModal에서 표시
    );
  };

  /**
   * 일정 변경 처리 완료
   */
  const resolveScheduleChange = async (
    userRetreatRegistrationHistoryMemoId: number
  ) => {
    confirmDialog.show({
      title: "처리 완료",
      description: "일정 변경 요청을 처리 완료하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () =>
            ScheduleChangeRequestAPI.resolveScheduleChange(
              retreatSlug,
              userRetreatRegistrationHistoryMemoId
            ),
          undefined,
          "일정 변경 요청이 처리 완료되었습니다."
        );
      },
    });
  };

  return {
    // 데이터
    scheduleChangeRequests: data ?? [],
    error,
    isLoading,
    isMutating,

    // Mutation
    mutate,

    // 액션
    approveScheduleChange,
    resolveScheduleChange,
  };
}
