import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { UnivGroupRetreatRegistrationAPI } from "@/lib/api/univ-group-retreat-registration-api";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { useToastStore } from "@/store/toast-store";
import { IUnivGroupAdminStaffRetreat } from "@/types/univ-group-admin-staff";
import { AxiosError } from "axios";

/**
 * 부서 수양회 신청 데이터 및 액션 통합 훅
 *
 * @description
 * - 데이터 페칭 (SWR)
 * - Mutation 로직 (Optimistic updates)
 * - 액션 함수들 (환불, 새가족, 군지체, 메모 등)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param options - SWR 설정 옵션
 * @returns 데이터, 에러, 로딩 상태 및 액션 함수들
 */
export function useUnivGroupRetreatRegistration(
  retreatSlug: string,
  options?: SWRConfiguration<IUnivGroupAdminStaffRetreat[], Error>
) {
  const confirmDialog = useConfirmDialogStore();
  const addToast = useToastStore((state) => state.add);
  const [isMutating, setIsMutating] = useState(false);

  // SWR 데이터 페칭
  const endpoint = `/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`;

  const { data, error, isLoading, mutate } = useSWR<
    IUnivGroupAdminStaffRetreat[],
    Error
  >(
    retreatSlug ? endpoint : null,
    () => UnivGroupRetreatRegistrationAPI.getRegistrations(retreatSlug),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...options,
    }
  );

  /**
   * 단일 Item 병합 헬퍼 (단순하고 명확한 로직)
   *
   * @param action - 실행할 API 액션 (업데이트된 단일 item 반환)
   * @param successMessage - 성공 메시지
   *
   * 동작 방식:
   * 1. API 호출 (1초)
   * 2. 서버에서 업데이트된 단일 item 반환
   * 3. 배열에서 해당 item만 교체
   * 4. SWR mutate로 캐시 업데이트
   */
  const updateCache = async (
    action: () => Promise<IUnivGroupAdminStaffRetreat | void>,
    successMessage?: string
  ) => {
    setIsMutating(true);
    try {
      // 1. API 호출
      const updated = await action();

      // 2. 단일 item만 교체 (나머지 9,999개는 그대로)
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
   * 환불 처리
   *
   * @param registrationId - 신청 ID
   * @deprecated 서버에 미구현 (API 엔드포인트 없음)
   */
  const refundComplete = async (registrationId: string) => {
    confirmDialog.show({
      title: "환불 처리",
      description: "정말로 환불 처리를 완료하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () =>
            UnivGroupRetreatRegistrationAPI.refundComplete(retreatSlug, registrationId),
          "환불이 성공적으로 처리되었습니다."
        );
      },
    });
  };

  /**
   * 새가족 신청 승인/거절
   *
   * @param registrationId - 신청 ID
   * @param approve - 승인 여부
   */
  const handleNewFamilyRequest = async (
    registrationId: string,
    approve: boolean
  ) => {
    confirmDialog.show({
      title: approve ? "새가족 신청 승인" : "새가족 신청 거절",
      description: approve
        ? "정말로 새가족 신청을 승인하시겠습니까? 새가족으로 입금 안내 문자가 전송됩니다."
        : "정말로 새가족 신청을 거절하시겠습니까? 일반 지체로 입금 안내 문자가 전송됩니다.",
      onConfirm: async () => {
        await updateCache(
          () =>
            UnivGroupRetreatRegistrationAPI.assignUserType(
              retreatSlug,
              registrationId,
              approve ? "NEW_COMER" : null
            ),
          `새가족 신청이 성공적으로 ${approve ? "승인" : "거절"}되었습니다.`
        );
      },
    });
  };

  /**
   * 군지체 신청 승인/거절
   *
   * @param registrationId - 신청 ID
   * @param approve - 승인 여부
   */
  const handleMilitaryRequest = async (
    registrationId: string,
    approve: boolean
  ) => {
    confirmDialog.show({
      title: approve ? "군지체 신청 승인" : "군지체 신청 거절",
      description: approve
        ? "정말로 군지체 신청을 승인하시겠습니까? 군지체로 입금 안내 문자가 전송됩니다."
        : "정말로 군지체 신청을 거절하시겠습니까? 일반 지체로 입금 안내 문자가 전송됩니다.",
      onConfirm: async () => {
        await updateCache(
          () =>
            UnivGroupRetreatRegistrationAPI.assignUserType(
              retreatSlug,
              registrationId,
              approve ? "SOLDIER" : null
            ),
          `군지체 신청이 성공적으로 ${approve ? "승인" : "거절"}되었습니다.`
        );
      },
    });
  };

  /**
   * 입금 요청 메시지 전송
   *
   * @param registrationId - 신청 ID
   */
  const sendPaymentRequest = async (registrationId: string) => {
    await updateCache(
      () => UnivGroupRetreatRegistrationAPI.requestPayment(retreatSlug, registrationId),
      "입금 요청 메시지가 성공적으로 전송되었습니다."
    );
  };

  /**
   * 일정 변경 메모 저장
   *
   * @param registrationId - 신청 ID
   * @param memo - 메모 내용
   */
  const saveScheduleMemo = async (registrationId: string, memo: string) => {
    await updateCache(
      () =>
        UnivGroupRetreatRegistrationAPI.saveScheduleMemo(
          retreatSlug,
          registrationId,
          memo
        ),
      "메모가 성공적으로 저장되었습니다."
    );
  };

  /**
   * 일정 변경 메모 수정
   *
   * @param historyMemoId - history 메모 ID
   * @param memo - 수정할 메모 내용
   */
  const updateScheduleMemo = async (historyMemoId: number, memo: string) => {
    await updateCache(
      () =>
        UnivGroupRetreatRegistrationAPI.updateScheduleMemo(
          retreatSlug,
          historyMemoId,
          memo
        ),
      "메모가 성공적으로 수정되었습니다."
    );
  };

  /**
   * 일정 변경 메모 삭제
   *
   * @param historyMemoId - history 메모 ID
   */
  const deleteScheduleMemo = async (historyMemoId: number) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () =>
            UnivGroupRetreatRegistrationAPI.deleteScheduleMemo(
              retreatSlug,
              historyMemoId
            ),
          "메모가 성공적으로 삭제되었습니다."
        );
      },
    });
  };

  /**
   * 행정간사 메모 저장 (Optimistic Update)
   *
   * @param registrationId - 신청 ID (string으로 전달됨, 내부에서 number로 변환)
   * @param memo - 메모 내용
   */
  const saveAdminMemo = async (registrationId: string, memo: string) => {
    if (!data) return;

    const numericId = Number(registrationId);

    // 1. Optimistic Update: UI 먼저 업데이트
    const optimisticData = data.map((item) =>
      item.id === numericId
        ? { ...item, adminMemo: memo, adminMemoId: -1 } // 임시 ID
        : item
    );

    try {
      // 2. API 호출과 동시에 optimistic data 적용
      const result = await mutate(
        async () => {
          const savedMemo = await UnivGroupRetreatRegistrationAPI.saveAdminMemo(
            retreatSlug,
            registrationId,
            memo
          );
          // 3. 실제 memoId로 업데이트된 데이터 반환
          return data.map((item) =>
            item.id === numericId
              ? { ...item, adminMemo: savedMemo.memo, adminMemoId: savedMemo.id }
              : item
          );
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      addToast({
        title: "성공",
        description: "메모가 성공적으로 저장되었습니다.",
        variant: "success",
      });

      return result;
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || "메모 저장 중 오류가 발생했습니다."
          : "메모 저장 중 오류가 발생했습니다.";

      addToast({
        title: "오류 발생",
        description: message,
        variant: "destructive",
      });

      throw error;
    }
  };

  /**
   * 행정간사 메모 수정 (Optimistic Update)
   *
   * @param memoId - 메모 ID
   * @param memo - 수정할 메모 내용
   */
  const updateAdminMemo = async (memoId: number, memo: string) => {
    if (!data) return;

    // 1. Optimistic Update: UI 먼저 업데이트
    const optimisticData = data.map((item) =>
      item.adminMemoId === memoId ? { ...item, adminMemo: memo } : item
    );

    try {
      // 2. API 호출과 동시에 optimistic data 적용
      await mutate(
        async () => {
          const updatedMemo = await UnivGroupRetreatRegistrationAPI.updateAdminMemo(
            retreatSlug,
            memoId,
            memo
          );
          // 3. 서버 응답으로 최종 데이터 반환
          return data.map((item) =>
            item.adminMemoId === memoId
              ? { ...item, adminMemo: updatedMemo.memo }
              : item
          );
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      );

      addToast({
        title: "성공",
        description: "메모가 성공적으로 수정되었습니다.",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || "메모 수정 중 오류가 발생했습니다."
          : "메모 수정 중 오류가 발생했습니다.";

      addToast({
        title: "오류 발생",
        description: message,
        variant: "destructive",
      });

      throw error;
    }
  };

  /**
   * 행정간사 메모 삭제 (Optimistic Update)
   *
   * @param memoId - 메모 ID
   */
  const deleteAdminMemo = async (memoId: number) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: async () => {
        if (!data) return;

        // 1. Optimistic Update: UI 먼저 업데이트
        const optimisticData = data.map((item) =>
          item.adminMemoId === memoId
            ? { ...item, adminMemo: null, adminMemoId: null }
            : item
        );

        try {
          // 2. API 호출과 동시에 optimistic data 적용
          await mutate(
            async () => {
              await UnivGroupRetreatRegistrationAPI.deleteAdminMemo(retreatSlug, memoId);
              // 3. 삭제 후 데이터 반환
              return data.map((item) =>
                item.adminMemoId === memoId
                  ? { ...item, adminMemo: null, adminMemoId: null }
                  : item
              );
            },
            {
              optimisticData,
              rollbackOnError: true,
              revalidate: false,
            }
          );

          addToast({
            title: "성공",
            description: "메모가 성공적으로 삭제되었습니다.",
            variant: "success",
          });
        } catch (error) {
          const message =
            error instanceof AxiosError
              ? error.response?.data?.message || "메모 삭제 중 오류가 발생했습니다."
              : "메모 삭제 중 오류가 발생했습니다.";

          addToast({
            title: "오류 발생",
            description: message,
            variant: "destructive",
          });

          throw error;
        }
      },
    });
  };

  return {
    // 데이터
    registrations: data ?? [],
    error,
    isLoading,
    isMutating, // Mutation 진행 중 여부 (버튼 비활성화 등에 사용)

    // Mutation
    mutate,

    // 액션
    refundComplete,
    handleNewFamilyRequest,
    handleMilitaryRequest,
    sendPaymentRequest,
    saveScheduleMemo,
    updateScheduleMemo,
    deleteScheduleMemo,
    saveAdminMemo,
    updateAdminMemo,
    deleteAdminMemo,
  };
}
