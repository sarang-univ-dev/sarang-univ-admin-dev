import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { webAxios } from "@/lib/api/axios";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.userRetreatRegistrations as IUserRetreatRegistration[];
};

/**
 * 부서 재정 팀원용 수양회 신청 데이터 및 액션 통합 훅
 *
 * @description
 * - 데이터 페칭 (SWR)
 * - Mutation 로직 (Cache updates)
 * - 액션 함수들 (입금 확인, 입금 요청, 환불 처리)
 *
 * @param retreatSlug - 수양회 slug
 * @param options - SWR 옵션 (fallbackData 등)
 * @returns 데이터, 에러, 로딩 상태 및 액션 함수들
 */
export function useRetreatPaymentConfirmation(
  retreatSlug: string | null,
  options?: SWRConfiguration<IUserRetreatRegistration[], Error>
) {
  const confirmDialog = useConfirmDialogStore();
  const addToast = useToastStore((state) => state.add);
  const [isMutating, setIsMutating] = useState(false);

  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/account/user-retreat-registrations`
    : null;

  const { data, error, isLoading, mutate } = useSWR<
    IUserRetreatRegistration[],
    Error
  >(endpoint, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    ...options,
  });

  /**
   * 단일 Item 병합 헬퍼 (단순하고 명확한 로직)
   *
   * @param action - 실행할 API 액션 (업데이트된 단일 item 반환)
   * @param successMessage - 성공 메시지
   *
   * 동작 방식:
   * 1. API 호출
   * 2. 서버에서 업데이트된 단일 item 반환 (또는 void)
   * 3. 배열에서 해당 item만 교체 (또는 전체 revalidate)
   * 4. SWR mutate로 캐시 업데이트
   */
  const updateCache = async (
    action: () => Promise<IUserRetreatRegistration | void>,
    successMessage?: string
  ) => {
    setIsMutating(true);
    try {
      // 1. API 호출
      const updated = await action();

      // 2. 단일 item만 교체 (또는 전체 revalidate)
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
   * 입금 확인
   *
   * @param registrationId - 신청 ID
   */
  const confirmPayment = async (registrationId: number) => {
    if (!retreatSlug) return;

    confirmDialog.show({
      title: "입금 확인",
      description:
        "정말로 입금 확인 처리를 하시겠습니까? 입금 확인 문자가 전송됩니다.",
      onConfirm: async () => {
        await updateCache(async () => {
          const response = await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/account/confirm-payment`,
            { userRetreatRegistrationId: registrationId }
          );
          return response.data?.userRetreatRegistration;
        }, "입금이 성공적으로 확인되었습니다.");
      },
    });
  };

  /**
   * 입금 요청 메시지 전송
   *
   * @param registrationId - 신청 ID
   */
  const sendPaymentRequest = async (registrationId: number) => {
    if (!retreatSlug) return;

    confirmDialog.show({
      title: "입금 요청",
      description:
        "정말로 입금 요청 처리를 하시겠습니까? 입금 요청 문자가 전송됩니다.",
      onConfirm: async () => {
        await updateCache(async () => {
          await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/account/request-payment`,
            { userRetreatRegistrationId: registrationId }
          );
        }, "입금 요청 메시지가 성공적으로 전송되었습니다.");
      },
    });
  };

  /**
   * 환불 처리 완료
   *
   * @param registrationId - 신청 ID
   */
  const refundComplete = async (registrationId: number) => {
    if (!retreatSlug) return;

    confirmDialog.show({
      title: "환불 처리",
      description: "정말로 환불 처리를 완료하시겠습니까?",
      onConfirm: async () => {
        await updateCache(async () => {
          const response = await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/account/refund-complete`,
            { userRetreatRegistrationId: registrationId }
          );
          return response.data?.userRetreatRegistration;
        }, "환불이 성공적으로 처리되었습니다.");
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
    confirmPayment,
    sendPaymentRequest,
    refundComplete,
  };
}
