import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { AccountStaffAPI } from "@/lib/api/account-api";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { useToastStore } from "@/store/toast-store";
import { IRetreatRegistration } from "@/types/account";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import { AxiosError } from "axios";

/**
 * 재정 간사 수양회 신청 데이터 및 액션 통합 훅
 *
 * @description
 * - 데이터 페칭 (SWR)
 * - Mutation 로직 (Optimistic updates)
 * - 액션 함수들 (입금 확인, 간사 배정, 환불, 메모 등)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param options - SWR 설정 옵션
 * @returns 데이터, 에러, 로딩 상태 및 액션 함수들
 */
export function useAccountStaffRegistration(
  retreatSlug: string,
  options?: SWRConfiguration<IRetreatRegistration[], Error>
) {
  const confirmDialog = useConfirmDialogStore();
  const addToast = useToastStore((state) => state.add);
  const [isMutating, setIsMutating] = useState(false);

  // SWR 데이터 페칭
  const endpoint = `/api/v1/retreat/${retreatSlug}/account/retreat-registrations`;

  const { data, error, isLoading, mutate } = useSWR<
    IRetreatRegistration[],
    Error
  >(
    retreatSlug ? endpoint : null,
    () => AccountStaffAPI.getRegistrations(retreatSlug),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...options,
    }
  );

  /**
   * Optimistic Update 헬퍼 (Surgical Update 패턴)
   *
   * @description
   * - 낙관적 업데이트 후 전체 refetch 없이 캐시만 업데이트
   * - 서버 API가 void를 반환하므로 낙관적 업데이트 결과를 유지
   * - 에러 발생 시 자동 롤백
   *
   * @param action - 실행할 API 액션
   * @param optimisticUpdate - 낙관적 업데이트 함수 (단일 item 변경)
   * @param successMessage - 성공 메시지
   */
  const updateCache = async (
    action: () => Promise<void>,
    optimisticUpdate?: (
      data: IRetreatRegistration[]
    ) => IRetreatRegistration[],
    successMessage?: string
  ) => {
    setIsMutating(true);
    try {
      // Optimistic update가 있는 경우
      if (optimisticUpdate && data) {
        // ✅ 낙관적 업데이트 적용 (즉시 UI 반영)
        const optimisticData = optimisticUpdate(data);

        await mutate(
          async () => {
            await action();
            // ✅ 전체 refetch 대신 낙관적 업데이트 결과 유지
            return optimisticData;
          },
          {
            optimisticData,
            rollbackOnError: true,
            revalidate: false, // ✅ 추가 API 호출 방지
          }
        );
      } else {
        // Optimistic update 없이 실행 후 revalidate
        await action();
        await mutate();
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
   * 간사 배정
   *
   * @param registrationId - 신청 ID
   */
  const assignStaff = async (registrationId: string) => {
    confirmDialog.show({
      title: "간사 배정",
      description: "정말로 간사 배정 처리를 하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () => AccountStaffAPI.assignStaff(retreatSlug, registrationId),
          undefined,
          "간사 배정이 성공적으로 처리되었습니다."
        );
      },
    });
  };

  /**
   * 입금 확인 완료
   *
   * @param registrationId - 신청 ID
   */
  const confirmPayment = async (registrationId: string) => {
    confirmDialog.show({
      title: "입금 확인 완료",
      description: "정말로 입금 확인 완료 처리를 하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () => AccountStaffAPI.confirmPayment(retreatSlug, registrationId),
          // ✅ Optimistic Update: 입금 상태 변경
          (currentData) =>
            currentData.map((item) =>
              item.id === Number(registrationId)
                ? {
                    ...item,
                    paymentStatus: UserRetreatRegistrationPaymentStatus.PAID,
                    paymentConfirmedAt: new Date().toISOString(),
                  }
                : item
            ),
          "입금 확인이 성공적으로 처리되었습니다."
        );
      },
    });
  };

  /**
   * 환불 처리 완료
   *
   * @param registrationId - 신청 ID
   */
  const refundComplete = async (registrationId: string) => {
    confirmDialog.show({
      title: "환불 처리",
      description: "정말로 환불 처리를 완료하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () => AccountStaffAPI.refundComplete(retreatSlug, registrationId),
          // ✅ Optimistic Update: 환불 상태 변경
          (currentData) =>
            currentData.map((item) =>
              item.id === Number(registrationId)
                ? {
                    ...item,
                    paymentStatus: UserRetreatRegistrationPaymentStatus.REFUNDED,
                  }
                : item
            ),
          "환불이 성공적으로 처리되었습니다."
        );
      },
    });
  };

  /**
   * 회계 메모 저장
   *
   * @param registrationId - 신청 ID
   * @param memo - 메모 내용
   */
  const saveAccountMemo = async (registrationId: string, memo: string) => {
    await updateCache(
      () => AccountStaffAPI.saveAccountMemo(retreatSlug, registrationId, memo),
      // ✅ Optimistic Update: 메모 저장
      (currentData) =>
        currentData.map((item) =>
          item.id === Number(registrationId)
            ? { ...item, accountMemo: memo }
            : item
        ),
      "메모가 성공적으로 저장되었습니다."
    );
  };

  /**
   * 회계 메모 수정
   *
   * @param memoId - 메모 ID
   * @param memo - 수정할 메모 내용
   */
  const updateAccountMemo = async (memoId: number, memo: string) => {
    await updateCache(
      () => AccountStaffAPI.updateAccountMemo(retreatSlug, memoId, memo),
      // ✅ Optimistic Update: 메모 수정
      (currentData) =>
        currentData.map((item) =>
          item.accountMemoId === memoId ? { ...item, accountMemo: memo } : item
        ),
      "메모가 성공적으로 수정되었습니다."
    );
  };

  /**
   * 회계 메모 삭제
   *
   * @param memoId - 메모 ID
   */
  const deleteAccountMemo = async (memoId: number) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: async () => {
        await updateCache(
          () => AccountStaffAPI.deleteAccountMemo(retreatSlug, memoId),
          // ✅ Optimistic Update: 메모 삭제
          (currentData) =>
            currentData.map((item) =>
              item.accountMemoId === memoId
                ? { ...item, accountMemo: null, accountMemoId: null }
                : item
            ),
          "메모가 성공적으로 삭제되었습니다."
        );
      },
    });
  };

  /**
   * 엑셀 다운로드
   */
  const downloadExcel = async () => {
    setIsMutating(true);
    try {
      const blob = await AccountStaffAPI.downloadExcel(retreatSlug);

      // Blob을 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `수양회_신청현황_${new Date().toISOString().split("T")[0]}.xlsx`
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

  return {
    // 데이터
    registrations: data ?? [],
    error,
    isLoading,
    isMutating, // Mutation 진행 중 여부 (버튼 비활성화 등에 사용)

    // Mutation
    mutate,

    // 액션
    assignStaff,
    confirmPayment,
    refundComplete,
    saveAccountMemo,
    updateAccountMemo,
    deleteAccountMemo,
    downloadExcel,
  };
}
