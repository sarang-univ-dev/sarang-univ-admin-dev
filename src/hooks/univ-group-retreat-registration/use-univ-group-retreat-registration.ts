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
   * Optimistic Update 헬퍼
   *
   * @param action - 실행할 API 액션
   * @param optimisticUpdate - 낙관적 업데이트 함수 (옵션)
   * @param successMessage - 성공 메시지
   */
  const updateCache = async (
    action: () => Promise<void>,
    optimisticUpdate?: (
      data: IUnivGroupAdminStaffRetreat[]
    ) => IUnivGroupAdminStaffRetreat[],
    successMessage?: string
  ) => {
    setIsMutating(true);
    try {
      // Optimistic update가 있는 경우
      if (optimisticUpdate && data) {
        await mutate(
          async () => {
            await action();
            // 서버에서 최신 데이터를 다시 가져옴
            return UnivGroupRetreatRegistrationAPI.getRegistrations(retreatSlug);
          },
          {
            optimisticData: optimisticUpdate(data),
            rollbackOnError: true,
            revalidate: false,
          }
        );
      } else {
        // Optimistic update 없이 그냥 실행
        await action();
        await mutate(); // 서버 데이터로 revalidate
      }

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
   */
  const refundComplete = async (registrationId: string) => {
    confirmDialog.show({
      title: "환불 처리",
      description: "정말로 환불 처리를 완료하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () =>
            UnivGroupRetreatRegistrationAPI.refundComplete(retreatSlug, registrationId),
          undefined, // 복잡한 업데이트이므로 서버 응답을 기다림
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
          undefined, // 복잡한 업데이트이므로 서버 응답을 기다림
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
          undefined, // 복잡한 업데이트이므로 서버 응답을 기다림
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
      undefined,
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
      undefined, // 메모는 서버 응답을 기다려야 정확함
      "메모가 성공적으로 저장되었습니다."
    );
  };

  /**
   * 행정간사 메모 저장
   *
   * @param registrationId - 신청 ID
   * @param memo - 메모 내용
   */
  const saveAdminMemo = async (registrationId: string, memo: string) => {
    await updateCache(
      () =>
        UnivGroupRetreatRegistrationAPI.saveAdminMemo(retreatSlug, registrationId, memo),
      undefined,
      "메모가 성공적으로 저장되었습니다."
    );
  };

  /**
   * 행정간사 메모 수정
   *
   * @param memoId - 메모 ID
   * @param memo - 수정할 메모 내용
   */
  const updateAdminMemo = async (memoId: number, memo: string) => {
    await updateCache(
      () => UnivGroupRetreatRegistrationAPI.updateAdminMemo(retreatSlug, memoId, memo),
      undefined,
      "메모가 성공적으로 수정되었습니다."
    );
  };

  /**
   * 행정간사 메모 삭제
   *
   * @param memoId - 메모 ID
   */
  const deleteAdminMemo = async (memoId: number) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () => UnivGroupRetreatRegistrationAPI.deleteAdminMemo(retreatSlug, memoId),
          undefined,
          "메모가 성공적으로 삭제되었습니다."
        );
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
    saveAdminMemo,
    updateAdminMemo,
    deleteAdminMemo,
  };
}
