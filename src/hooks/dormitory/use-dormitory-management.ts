"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirm } from "@/hooks/use-confirm";
import { TDormitoryManagementRow } from "@/types";

function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return typeof message === "string" ? message : fallback;
}

export type DormitoryUpdateFields = {
  optimalCapacity?: number;
  maxCapacity?: number | null;
  memo?: string | null;
  isDisabled?: boolean;
};

export function useDormitoryManagement(retreatSlug: string) {
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirm();

  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/dormitories`
    : null;

  const { data, error, isLoading, mutate } = useSWR<TDormitoryManagementRow[]>(
    endpoint,
    async () => {
      const res = await webAxios.get(endpoint as string);
      return res.data.dormitories as TDormitoryManagementRow[];
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const dormitories = data ?? [];

  // 정원/메모/비활성 부분 수정 (optimistic). 메모/토글/정원 셀이 공용으로 사용.
  const updateDormitory = useCallback(
    async (id: number, fields: DormitoryUpdateFields) => {
      try {
        await mutate(
          async currentData => {
            await webAxios.patch(
              `/api/v1/retreat/${retreatSlug}/dormitory/dormitories/${id}`,
              fields
            );
            return (currentData ?? []).map(d =>
              d.id === id ? { ...d, ...fields } : d
            );
          },
          {
            optimisticData: currentData =>
              (currentData ?? []).map(d =>
                d.id === id ? { ...d, ...fields } : d
              ),
            rollbackOnError: true,
            revalidate: false,
          }
        );
      } catch (err) {
        addToast({
          title: "오류 발생",
          description: getErrorMessage(err, "숙소 수정 중 오류가 발생했습니다."),
          variant: "destructive",
        });
        throw err;
      }
    },
    [retreatSlug, mutate, addToast]
  );

  const toggleDisabled = useCallback(
    async (id: number, isDisabled: boolean) => {
      await updateDormitory(id, { isDisabled });
    },
    [updateDormitory]
  );

  const deleteDormitory = useCallback(
    async (id: number, name: string, assignedCount: number) => {
      if (assignedCount > 0) {
        addToast({
          title: "삭제할 수 없습니다",
          description:
            "배정된 인원이 있어 삭제할 수 없습니다. 먼저 배정을 해제해주세요.",
          variant: "destructive",
        });
        return;
      }

      const confirmed = await confirmDialog.open({
        title: "숙소 삭제",
        description: `'${name}' 숙소를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
        confirmText: "삭제",
        confirmVariant: "destructive",
      });

      if (!confirmed) return;

      try {
        await mutate(
          async currentData => {
            await webAxios.delete(
              `/api/v1/retreat/${retreatSlug}/dormitory/dormitories/${id}`
            );
            return (currentData ?? []).filter(d => d.id !== id);
          },
          {
            optimisticData: currentData =>
              (currentData ?? []).filter(d => d.id !== id),
            rollbackOnError: true,
            revalidate: false,
          }
        );
        addToast({
          title: "성공",
          description: `'${name}' 숙소가 삭제되었습니다.`,
          variant: "success",
        });
      } catch (err) {
        addToast({
          title: "오류 발생",
          description: getErrorMessage(err, "숙소 삭제 중 오류가 발생했습니다."),
          variant: "destructive",
        });
      }
    },
    [retreatSlug, mutate, addToast, confirmDialog]
  );

  return {
    dormitories,
    error,
    isLoading,
    mutate,
    updateDormitory,
    toggleDisabled,
    deleteDormitory,
  };
}
