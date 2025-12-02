import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";
import isEqual from "lodash/isEqual";

export interface IUserRetreatGBSLineup {
  gbsNumber: number | null;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  fullAttendanceCount: number;
  partialAttendanceCount: number;
  id: number;
  userId: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: "MALE" | "FEMALE";
  name: string;
  phoneNumber: string;
  isLeader: boolean;
  gbsMemo: string;
  lineupMemo: string;
  lineupMemoId: number | null;
  lineupMemocolor: string;
  isFullAttendance: boolean;
  currentLeader: string;
  userType: string | null;
  userRetreatRegistrationScheduleIds: number[];
  unresolvedLineupHistoryMemo?: string | null;
  adminMemo?: string | null;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.userRetreatGbsLineups;
};

/**
 * 수양회 GBS 라인업 데이터 및 액션 통합 훅
 *
 * @description
 * - 데이터 페칭 (SWR with 2초 polling)
 * - Mutation 로직 (Cache updates)
 * - 액션 함수들 (GBS 번호 저장, 메모 CRUD)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param options - SWR 설정 옵션
 * @returns 데이터, 에러, 로딩 상태 및 액션 함수들
 */
export function useRetreatGbsLineupData(
  retreatSlug: string,
  options?: SWRConfiguration<IUserRetreatGBSLineup[], Error>
) {
  const confirmDialog = useConfirmDialogStore();
  const addToast = useToastStore((state) => state.add);
  const [isMutating, setIsMutating] = useState(false);

  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    IUserRetreatGBSLineup[],
    Error
  >(endpoint, fetcher, {
    // ✅ 실시간 협업을 위한 2초 polling
    // ✅ UX 개선: input에 focus가 있을 때는 polling 중지
    // ✅ 탭이 백그라운드에 있을 때도 polling 중지 (배터리/성능 절약)
    refreshInterval: () => {
      // 1. 탭이 백그라운드에 있으면 polling 중지
      if (typeof document !== 'undefined' && document.hidden) {
        return 0;
      }

      // 2. input에 focus가 있으면 polling 멈춤 (사용자 입력 중)
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return 0;
      }

      // 3. 그 외의 경우 2초마다 polling
      return 2000;
    },

    // ✅ 탭 포커스 시 갱신
    revalidateOnFocus: true,

    // ✅ 네트워크 재연결 시 갱신
    revalidateOnReconnect: true,

    // ✅ 2초 내 중복 요청 제거
    dedupingInterval: 2000,

    // ✅ 에러 발생 시 재시도
    errorRetryCount: 3,
    errorRetryInterval: 5000,

    // ✅ 데이터 비교: 동일한 데이터는 리렌더링 방지
    // lodash isEqual로 깊은 비교 (배열/객체 구조 전체 비교)
    compare: (a, b) => {
      if (!a || !b) return a === b;
      return isEqual(a, b);
    },

    // ✅ Server Component의 initialData를 fallback으로 사용
    ...options,
  });

  /**
   * 단일 Item 병합 헬퍼
   *
   * @param action - 실행할 API 액션
   * @param successMessage - 성공 메시지
   */
  const updateCache = async (
    action: () => Promise<IUserRetreatGBSLineup | void>,
    successMessage?: string
  ) => {
    setIsMutating(true);
    try {
      // 1. API 호출
      const updated = await action();

      // 2. 즉시 캐시 업데이트 (2초 polling 대기하지 않음)
      if (updated && data) {
        await mutate(
          data.map((item) => (item.id === updated.id ? updated : item)),
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
   * GBS 번호 저장
   *
   * @param id - 라인업 ID
   * @param gbsNumber - GBS 번호
   */
  const saveGbsNumber = async (id: number, gbsNumber: number) => {
    await updateCache(async () => {
      const response = await webAxios.put(`${endpoint}/${id}`, { gbsNumber });
      return response.data?.userRetreatGbsLineup;
    }, "GBS 번호가 저장되었습니다.");
  };

  /**
   * 라인업 메모 저장
   *
   * @param id - 라인업 ID
   * @param memo - 메모 내용
   * @param color - 메모 색상 (선택)
   */
  const saveLineupMemo = async (id: string, memo: string, color?: string) => {
    await updateCache(async () => {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`,
        { memo: memo.trim(), color: color || null }
      );
      return response.data?.userRetreatGbsLineup;
    }, "메모가 저장되었습니다.");
  };

  /**
   * 라인업 메모 수정
   *
   * @param memoId - 메모 ID
   * @param memo - 메모 내용
   * @param color - 메모 색상 (선택)
   */
  const updateLineupMemo = async (memoId: string, memo: string, color?: string) => {
    await updateCache(async () => {
      const response = await webAxios.put(
        `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`,
        { memo: memo.trim(), color: color || null }
      );
      return response.data?.userRetreatGbsLineup;
    }, "메모가 수정되었습니다.");
  };

  /**
   * 라인업 메모 삭제
   *
   * @param memoId - 메모 ID
   */
  const deleteLineupMemo = async (memoId: string) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: async () => {
        await updateCache(async () => {
          const response = await webAxios.delete(
            `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`
          );
          return response.data?.userRetreatGbsLineup;
        }, "메모가 삭제되었습니다.");
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
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,
  };
}
