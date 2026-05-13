/**
 * GBS 라인업 관리 훅 (SWR + 뮤테이션)
 *
 * - GBS 목록 조회
 * - GBS 생성/삭제
 * - 리더 배정/해제
 * - 메모 저장/수정/삭제
 * - Optimistic updates with rollback
 * - useCallback으로 함수 참조 안정화 (컬럼 훅에서 의존성으로 사용)
 */
import { useCallback } from "react";
import useSWR from "swr";
import { GbsLineupAPI } from "@/lib/api/gbs-lineup-api";
import { GbsLineupRow } from "@/types/gbs-lineup";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";

interface UseGbsLineupManagementOptions {
  fallbackData?: GbsLineupRow[];
}

export function useGbsLineupManagement(
  retreatSlug: string,
  options?: UseGbsLineupManagementOptions
) {
  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirmDialogStore();

  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/gbslist`
    : null;

  const { data, error, isLoading, mutate } = useSWR<GbsLineupRow[]>(
    endpoint,
    () => GbsLineupAPI.getGbsList(retreatSlug),
    {
      fallbackData: options?.fallbackData,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  const gbsList = data ?? [];

  /**
   * GBS 그룹 생성
   */
  const createGbsGroups = useCallback(
    async (gbsNumbers: string[]) => {
      try {
        await GbsLineupAPI.createGbsGroups(retreatSlug, { gbsNumbers });
        await mutate();
        addToast({
          title: "성공",
          description: "GBS 그룹이 생성되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류 발생",
          description: "GBS 그룹 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, mutate, addToast]
  );

  /**
   * GBS 그룹 삭제 (확인 다이얼로그 포함)
   */
  const deleteGbsGroup = useCallback(
    (gbsNumber: number) => {
      confirmDialog.show({
        title: "GBS 삭제",
        description: `GBS ${gbsNumber}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 배정된 인원도 함께 해제됩니다.`,
        onConfirm: async () => {
          try {
            // Optimistic update
            await mutate(
              async (currentData) => {
                await GbsLineupAPI.deleteGbsGroup(retreatSlug, gbsNumber);
                return (currentData ?? []).filter(
                  (gbs) => gbs.number !== gbsNumber
                );
              },
              {
                optimisticData: (currentData) =>
                  (currentData ?? []).filter((gbs) => gbs.number !== gbsNumber),
                rollbackOnError: true,
                revalidate: false,
              }
            );
            addToast({
              title: "성공",
              description: `GBS ${gbsNumber}이(가) 삭제되었습니다.`,
              variant: "success",
            });
          } catch (error) {
            addToast({
              title: "오류 발생",
              description: "GBS 그룹 삭제 중 오류가 발생했습니다.",
              variant: "destructive",
            });
          }
        },
      });
    },
    [retreatSlug, mutate, addToast, confirmDialog]
  );

  /**
   * 리더 배정
   */
  const assignLeaders = useCallback(
    async (gbsNumber: number, leaderUserIds: number[]) => {
      try {
        await GbsLineupAPI.assignLeaders(retreatSlug, {
          gbsNumber,
          leaderUserIds,
        });
        await mutate();
        addToast({
          title: "성공",
          description: "GBS에 리더가 배정되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류 발생",
          description: "리더 배정 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, mutate, addToast]
  );

  /**
   * 리더 배정 해제 (확인 다이얼로그 포함)
   */
  const unassignLeaders = useCallback(
    (gbsId: number) => {
      confirmDialog.show({
        title: "리더 삭제",
        description: "정말로 리더 배정을 삭제하시겠습니까?",
        onConfirm: async () => {
          try {
            await GbsLineupAPI.unassignLeaders(retreatSlug, gbsId);
            await mutate();
            addToast({
              title: "성공",
              description: "GBS 리더 배정이 취소되었습니다.",
              variant: "success",
            });
          } catch (error) {
            addToast({
              title: "오류 발생",
              description: "GBS 리더 배정 취소 중 오류가 발생했습니다.",
              variant: "destructive",
            });
          }
        },
      });
    },
    [retreatSlug, mutate, addToast, confirmDialog]
  );

  /**
   * GBS 메모 저장 (신규 생성 또는 수정)
   */
  const saveGbsMemo = useCallback(
    async (gbsNumber: string, memo: string) => {
      const gbsNum = Number(gbsNumber);
      try {
        // Optimistic update
        await mutate(
          async (currentData) => {
            await GbsLineupAPI.saveGbsMemo(retreatSlug, {
              gbsNumber: gbsNum,
              memo,
            });
            return (currentData ?? []).map((gbs) =>
              gbs.number === gbsNum ? { ...gbs, memo } : gbs
            );
          },
          {
            optimisticData: (currentData) =>
              (currentData ?? []).map((gbs) =>
                gbs.number === gbsNum ? { ...gbs, memo } : gbs
              ),
            rollbackOnError: true,
            revalidate: false,
          }
        );
        addToast({
          title: "성공",
          description: "GBS 메모가 저장되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류 발생",
          description: "메모 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, mutate, addToast]
  );

  /**
   * GBS 메모 수정 (saveGbsMemo와 동일한 API 사용)
   */
  const updateGbsMemo = useCallback(
    async (gbsNumber: string, memo: string) => {
      await saveGbsMemo(gbsNumber, memo);
    },
    [saveGbsMemo]
  );

  /**
   * GBS 메모 삭제
   */
  const deleteGbsMemo = useCallback(
    async (gbsNumber: string) => {
      const gbsNum = Number(gbsNumber);
      try {
        // Optimistic update
        await mutate(
          async (currentData) => {
            await GbsLineupAPI.deleteGbsMemo(retreatSlug, gbsNum);
            return (currentData ?? []).map((gbs) =>
              gbs.number === gbsNum ? { ...gbs, memo: null } : gbs
            );
          },
          {
            optimisticData: (currentData) =>
              (currentData ?? []).map((gbs) =>
                gbs.number === gbsNum ? { ...gbs, memo: null } : gbs
              ),
            rollbackOnError: true,
            revalidate: false,
          }
        );
        addToast({
          title: "성공",
          description: "GBS 메모가 삭제되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류 발생",
          description: "메모 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, mutate, addToast]
  );

  return {
    gbsList,
    error,
    isLoading,
    mutate,
    // Actions (useCallback으로 안정화됨)
    createGbsGroups,
    deleteGbsGroup,
    assignLeaders,
    unassignLeaders,
    saveGbsMemo,
    updateGbsMemo,
    deleteGbsMemo,
  };
}
