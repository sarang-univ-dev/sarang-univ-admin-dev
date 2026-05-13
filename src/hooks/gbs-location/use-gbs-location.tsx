"use client";

import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { GbsLocationItem } from "@/types/gbs-location";

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data;
};

// SWR 기본 설정
const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
};

/**
 * GBS 장소 배정 통합 관리 Hook
 *
 * Features:
 * - GBS 목록 및 사용 가능한 장소 데이터 페칭
 * - Optimistic update로 즉시 UI 업데이트
 * - 에러 시 자동 롤백
 * - 통합 로딩/에러 상태 관리
 */
export function useGbsLocationManagement(
  retreatSlug: string,
  options?: SWRConfiguration
) {
  const addToast = useToastStore((state) => state.add);
  const [isMutating, setIsMutating] = useState(false);

  // GBS 목록 페칭
  const gbsEndpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/gbslist`
    : null;

  const {
    data: gbsData,
    error: gbsError,
    isLoading: isGbsLoading,
    mutate: mutateGbs,
  } = useSWR<{ gbsList: GbsLocationItem[] }, Error>(
    gbsEndpoint,
    fetcher,
    { ...defaultSWRConfig, ...options }
  );

  // 사용 가능한 장소 목록 페칭
  const availableEndpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/available-locations`
    : null;

  const {
    data: availableData,
    error: availableError,
    isLoading: isAvailableLoading,
    mutate: mutateAvailable,
  } = useSWR<{ availableLocations: string[] }, Error>(
    availableEndpoint,
    fetcher,
    { ...defaultSWRConfig, ...options }
  );

  /**
   * Optimistic Update를 포함한 캐시 업데이트 헬퍼
   */
  const updateCache = async (
    action: () => Promise<void>,
    optimisticUpdate?: (data: GbsLocationItem[]) => GbsLocationItem[],
    successMessage?: string
  ) => {
    setIsMutating(true);
    try {
      if (optimisticUpdate && gbsData?.gbsList) {
        const optimisticData = optimisticUpdate(gbsData.gbsList);

        await mutateGbs(
          async () => {
            await action();
            return { gbsList: optimisticData };
          },
          {
            optimisticData: { gbsList: optimisticData },
            rollbackOnError: true,
            revalidate: false,
          }
        );
      } else {
        await action();
        await mutateGbs();
      }

      // 사용 가능한 장소 목록도 갱신
      await mutateAvailable();

      if (successMessage) {
        addToast({
          title: "성공",
          description: successMessage,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("GBS 장소 배정 오류:", error);
      addToast({
        title: "오류 발생",
        description: "GBS 장소 배정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * GBS 장소 배정
   * - Optimistic update로 즉시 UI 업데이트
   * - 에러 시 자동 롤백
   */
  const assignLocation = async (gbsId: number, location: string) => {
    await updateCache(
      async () => {
        await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/dormitory/${gbsId}/assign-gbs-location`,
          { location }
        );
      },
      (currentData) =>
        currentData.map((item) =>
          item.id === gbsId ? { ...item, location } : item
        ),
      "GBS 장소가 배정되었습니다."
    );
  };

  return {
    // 데이터
    gbsList: gbsData?.gbsList || [],
    availableLocations: availableData?.availableLocations || [],

    // 상태
    isLoading: isGbsLoading || isAvailableLoading,
    isMutating,
    error: gbsError || availableError,

    // 액션
    assignLocation,

    // SWR mutate (직접 사용 필요 시)
    mutateGbs,
    mutateAvailable,
  };
}

// 기존 개별 hooks도 유지 (하위 호환성)
export function useGbsList(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/gbslist`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    { gbsList: GbsLocationItem[] },
    Error
  >(endpoint, fetcher, defaultSWRConfig);

  return {
    data: data?.gbsList || [],
    error,
    isLoading,
    mutate,
  };
}

export function useAvailableLocations(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/available-locations`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    { availableLocations: string[] },
    Error
  >(endpoint, fetcher, defaultSWRConfig);

  return {
    data: data?.availableLocations || [],
    error,
    isLoading,
    mutate,
  };
}

export function useAssignGbsLocation(retreatSlug?: string) {
  const assignLocation = async (gbsId: number, location: string) => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/dormitory/${gbsId}/assign-gbs-location`,
      { location }
    );
    return response.data;
  };

  return { assignLocation };
}
