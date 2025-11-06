"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, RotateCcw } from "lucide-react";
import { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { webAxios } from "@/lib/api/axios";
import { mutate } from "swr";
import { AxiosError } from "axios";

interface ShuttleBusPaymentConfirmationTableActionsProps {
  registration: IShuttleBusPaymentConfirmationRegistration;
  retreatSlug: string;
  onOpenDetail?: () => void;
}

/**
 * 셔틀버스 재정 팀원 - 입금 확인 테이블 액션 컴포넌트
 * - 입금 확인 버튼 (PENDING 상태)
 * - 입금 요청 버튼 (PENDING 상태)
 * - 환불 처리 완료 버튼 (REFUND_REQUEST 상태)
 */
export function ShuttleBusPaymentConfirmationTableActions({
  registration,
  retreatSlug,
  onOpenDetail,
}: ShuttleBusPaymentConfirmationTableActionsProps) {
  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirmDialogStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`;

  // 로딩 상태 설정
  const setLoading = (action: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [`${registration.id}_${action}`]: isLoading,
    }));
  };

  // 로딩 상태 확인
  const isLoading = (action: string) => {
    return !!loadingStates[`${registration.id}_${action}`];
  };

  // 입금 확인
  const performConfirmPayment = async () => {
    setLoading("confirm", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${registration.id}/confirm-payment`
      );

      await mutate(registrationsEndpoint);

      addToast({
        title: "성공",
        description: "입금이 성공적으로 확인되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "입금 확인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading("confirm", false);
    }
  };

  const handleConfirmPayment = () => {
    confirmDialog.show({
      title: "입금 확인",
      description:
        "정말로 입금 확인 처리를 하시겠습니까? 입금 확인 문자가 전송됩니다.",
      onConfirm: performConfirmPayment,
    });
  };

  // 입금 요청
  const performSendPaymentRequest = async () => {
    setLoading("payment_request", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/request-payment`,
        {
          userRetreatShuttleBusRegistrationId: registration.id,
        }
      );

      addToast({
        title: "성공",
        description: "입금 요청 메시지가 성공적으로 전송되었습니다.",
        variant: "default",
      });
    } catch (error) {
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "입금 요청 메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading("payment_request", false);
    }
  };

  const handleSendPaymentRequest = () => {
    confirmDialog.show({
      title: "입금 요청",
      description:
        "정말로 입금 요청 처리를 하시겠습니까? 입금 요청 문자가 전송됩니다.",
      onConfirm: performSendPaymentRequest,
    });
  };

  // 환불 처리 완료
  const handleCompleteRefund = async () => {
    setLoading("refund", true);
    try {
      // TODO: API가 구현되면 활성화
      // await webAxios.post(
      //   `/api/v1/retreat/${retreatSlug}/shuttle-bus/${registration.id}/refund-complete`
      // );

      await mutate(registrationsEndpoint);

      addToast({
        title: "성공",
        description: "환불이 성공적으로 처리되었습니다.",
        variant: "default",
      });
    } catch (error) {
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "환불 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading("refund", false);
    }
  };

  // 상태에 따른 액션 버튼 렌더링
  switch (registration.shuttleBusPaymentStatus) {
    case UserRetreatShuttleBusPaymentStatus.PENDING:
      return (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleConfirmPayment}
            disabled={isLoading("confirm")}
            className="flex items-center gap-1.5 text-xs h-7 hover:bg-black hover:text-white transition-colors"
          >
            {isLoading("confirm") ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>입금 확인</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendPaymentRequest}
            disabled={isLoading("payment_request")}
            className="flex items-center gap-1.5 text-xs h-7"
          >
            {isLoading("payment_request") ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>입금 요청</span>
          </Button>
        </div>
      );

    case UserRetreatShuttleBusPaymentStatus.REFUND_REQUEST:
      return (
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCompleteRefund}
            disabled={isLoading("refund")}
            className="flex items-center gap-1.5 text-xs h-7 hover:bg-black hover:text-white transition-colors"
          >
            {isLoading("refund") ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            <span>환불 처리 완료</span>
          </Button>
        </div>
      );

    default:
      return (
        <div className="text-center text-gray-400 text-sm">
          -
        </div>
      );
  }
}
