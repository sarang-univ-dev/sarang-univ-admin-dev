import { useState, useCallback } from "react";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";
import { KeyedMutator } from "swr";
import { IDormitoryRetreatRegistration } from "./use-retreat-registration";

/**
 * 숙소팀 일정변동 요청 메모 관리 훅
 *
 * @description
 * - 메모 저장, 수정, 삭제 기능
 * - SWR 캐시 갱신을 통한 실시간 UI 업데이트
 * - 확인 다이얼로그 지원 (삭제 시)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param mutate - SWR mutate 함수 (useDormitoryRetreatRegistration에서 전달)
 * @returns 메모 관련 액션 함수들
 */
export function useDormitoryRetreatRegistrationMemo(
  retreatSlug: string,
  mutate: KeyedMutator<IDormitoryRetreatRegistration[]>
) {
  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirmDialogStore();
  const [isMutating, setIsMutating] = useState(false);

  /**
   * 일정변동 요청 메모 저장 (신규)
   *
   * @param userRetreatRegistrationId - 신청 ID (string)
   * @param memo - 메모 내용
   */
  const saveMemo = useCallback(
    async (userRetreatRegistrationId: string, memo: string) => {
      if (!retreatSlug) return;

      setIsMutating(true);
      try {
        await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/dormitory/${userRetreatRegistrationId}/schedule-change-request-memo-by-team-member`,
          { memo }
        );

        // SWR 캐시 갱신
        await mutate();

        addToast({
          title: "성공",
          description: "일정변동 요청 메모가 저장되었습니다.",
          variant: "success",
        });
      } catch (error) {
        const message =
          error instanceof AxiosError
            ? error.response?.data?.message ||
              "메모 저장 중 오류가 발생했습니다."
            : "메모 저장 중 오류가 발생했습니다.";

        addToast({
          title: "오류 발생",
          description: message,
          variant: "destructive",
        });

        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [retreatSlug, mutate, addToast]
  );

  /**
   * 일정변동 요청 메모 수정
   *
   * @param userRetreatRegistrationId - 신청 ID (string)
   * @param memo - 수정할 메모 내용
   */
  const updateMemo = useCallback(
    async (userRetreatRegistrationId: string, memo: string) => {
      if (!retreatSlug) return;

      setIsMutating(true);
      try {
        await webAxios.patch(
          `/api/v1/retreat/${retreatSlug}/dormitory/${userRetreatRegistrationId}/schedule-change-request-memo-by-team-member`,
          { memo }
        );

        // SWR 캐시 갱신
        await mutate();

        addToast({
          title: "성공",
          description: "일정변동 요청 메모가 수정되었습니다.",
          variant: "success",
        });
      } catch (error) {
        const message =
          error instanceof AxiosError
            ? error.response?.data?.message ||
              "메모 수정 중 오류가 발생했습니다."
            : "메모 수정 중 오류가 발생했습니다.";

        addToast({
          title: "오류 발생",
          description: message,
          variant: "destructive",
        });

        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [retreatSlug, mutate, addToast]
  );

  /**
   * 일정변동 요청 메모 삭제
   *
   * @param userRetreatRegistrationId - 신청 ID (string)
   */
  const deleteMemo = useCallback(
    async (userRetreatRegistrationId: string) => {
      if (!retreatSlug) return;

      confirmDialog.show({
        title: "메모 삭제",
        description: "정말로 일정변동 요청 메모를 삭제하시겠습니까?",
        onConfirm: async () => {
          setIsMutating(true);
          try {
            await webAxios.delete(
              `/api/v1/retreat/${retreatSlug}/dormitory/${userRetreatRegistrationId}/schedule-change-request-memo-by-team-member`
            );

            // SWR 캐시 갱신
            await mutate();

            addToast({
              title: "성공",
              description: "일정변동 요청 메모가 삭제되었습니다.",
              variant: "success",
            });
          } catch (error) {
            const message =
              error instanceof AxiosError
                ? error.response?.data?.message ||
                  "메모 삭제 중 오류가 발생했습니다."
                : "메모 삭제 중 오류가 발생했습니다.";

            addToast({
              title: "오류 발생",
              description: message,
              variant: "destructive",
            });

            throw error;
          } finally {
            setIsMutating(false);
          }
        },
      });
    },
    [retreatSlug, mutate, addToast, confirmDialog]
  );

  return {
    saveMemo,
    updateMemo,
    deleteMemo,
    isMutating,
  };
}
