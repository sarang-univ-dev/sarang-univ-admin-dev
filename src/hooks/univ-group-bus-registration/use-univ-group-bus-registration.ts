import { useState } from "react";
import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { IUnivGroupBusRegistration } from "@/types/bus-registration";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";
import { ShuttleBusAPI } from "@/lib/api/shuttle-bus-api";

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.univGroupShuttleBusRegistrations as IUnivGroupBusRegistration[];
};

interface UseUnivGroupBusRegistrationOptions {
  initialData?: IUnivGroupBusRegistration[];
  revalidateOnFocus?: boolean;
  dedupingInterval?: number;
}

/**
 * 부서 셔틀버스 등록 데이터 및 액션 통합 훅
 *
 * @description
 * - 데이터 페칭 (SWR)
 * - Mutation 로직 (Cache updates)
 * - 액션 함수들 (메모 CRUD)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param options - SWR 옵션 (initialData, revalidateOnFocus 등)
 * @returns 데이터, 에러, 로딩 상태 및 액션 함수들
 */
export function useUnivGroupBusRegistration(
  retreatSlug: string | null,
  options?: UseUnivGroupBusRegistrationOptions
) {
  const confirmDialog = useConfirmDialogStore();
  const addToast = useToastStore((state) => state.add);
  const [isMutating, setIsMutating] = useState(false);

  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/univ-group-registration`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    IUnivGroupBusRegistration[],
    Error
  >(endpoint, fetcher, {
    fallbackData: options?.initialData,
    revalidateOnFocus: options?.revalidateOnFocus ?? true,
    dedupingInterval: options?.dedupingInterval ?? 2000,
  });

  /**
   * 단일 Item 병합 헬퍼
   *
   * @param action - 실행할 API 액션
   * @param successMessage - 성공 메시지
   */
  const updateCache = async (
    action: () => Promise<IUnivGroupBusRegistration | void>,
    successMessage?: string
  ) => {
    setIsMutating(true);
    try {
      // 1. API 호출
      const updated = await action();

      // 2. 단일 item만 병합 (기존 데이터 유지 + 업데이트된 필드 적용)
      if (updated && data) {
        await mutate(
          data.map((item) =>
            item.id === updated.id ? { ...item, ...updated } : item
          ),
          { revalidate: false }
        );
      } else {
        // fallback: 전체 revalidate
        await mutate();
      }

      // 3. 성공 메시지
      if (successMessage) {
        addToast({
          title: "성공",
          description: successMessage,
          variant: "success",
        });
      }
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || "작업 중 오류가 발생했습니다."
          : "작업 중 오류가 발생했습니다.";

      addToast({
        title: "오류 발생",
        description: message,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * 일정 변경 메모 저장
   *
   * @param id - 신청 ID
   * @param memo - 메모 내용
   */
  const saveMemo = async (id: string, memo: string) => {
    if (!retreatSlug) return;

    await updateCache(async () => {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/schedule-change-memo`,
        { memo }
      );
      return response.data?.univGroupShuttleBusRegistration;
    }, "메모가 저장되었습니다.");
  };

  /**
   * 일정 변경 메모 수정
   *
   * @param id - 신청 ID
   * @param memo - 메모 내용
   */
  const updateMemo = async (id: string, memo: string) => {
    if (!retreatSlug) return;

    await updateCache(async () => {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/schedule-change-memo`,
        { memo }
      );
      return response.data?.univGroupShuttleBusRegistration;
    }, "메모가 수정되었습니다.");
  };

  /**
   * 일정 변경 메모 삭제
   *
   * @param id - 신청 ID
   */
  const deleteMemo = async (id: string) => {
    if (!retreatSlug) return;

    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: async () => {
        await updateCache(async () => {
          const response = await webAxios.delete(
            `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/schedule-change-memo`
          );
          return response.data?.univGroupShuttleBusRegistration;
        }, "메모가 삭제되었습니다.");
      },
    });
  };

  /**
   * 부서 셔틀버스 신청 현황 엑셀 다운로드
   */
  const downloadExcel = async () => {
    if (!retreatSlug) return;

    setIsMutating(true);
    try {
      const blob = await ShuttleBusAPI.downloadUnivGroupExcel(retreatSlug);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `부서_셔틀버스_신청현황_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "엑셀 파일이 다운로드되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류 발생",
        description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * 셔틀버스 신청 삭제
   *
   * @param id - 신청 ID
   */
  const deleteRegistration = async (id: string) => {
    if (!retreatSlug) return;

    const numericId = Number(id);

    confirmDialog.show({
      title: "신청 삭제",
      description:
        "정말로 셔틀버스 신청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      onConfirm: async () => {
        setIsMutating(true);
        try {
          // 1. Optimistic update: 즉시 UI에서 제거
          const optimisticData = data?.filter((item) => item.id !== numericId);

          if (optimisticData) {
            await mutate(optimisticData, { revalidate: false });
          }

          // 2. API 호출
          await webAxios.delete(
            `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}`
          );

          addToast({
            title: "성공",
            description: "셔틀버스 신청이 성공적으로 삭제되었습니다.",
            variant: "success",
          });
        } catch (error) {
          // 에러 시 서버 데이터로 롤백
          await mutate();

          const message =
            error instanceof AxiosError
              ? error.response?.data?.message || "삭제 중 오류가 발생했습니다."
              : "삭제 중 오류가 발생했습니다.";

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
  };

  return {
    // 데이터
    data: data ?? [],
    error,
    isLoading,
    isMutating,

    // Mutation
    mutate,

    // 액션
    saveMemo,
    updateMemo,
    deleteMemo,
    downloadExcel,
    deleteRegistration,
  };
}
