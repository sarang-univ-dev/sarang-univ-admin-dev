"use client";

import { AxiosError } from "axios";
import { CheckCircle2, Send, RotateCcw, TicketCheck } from "lucide-react";
import { useState } from "react";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { webAxios } from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";
import { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";
import {
  generateShuttleBusScheduleColumns,
  getShuttleBusScheduleLabel,
} from "@/utils/bus-utils";

interface ShuttleBusPaymentConfirmationTableActionsProps {
  registration: IShuttleBusPaymentConfirmationRegistration;
  retreatSlug: string;
  scheduleColumnsWithColor: ReturnType<typeof generateShuttleBusScheduleColumns>;
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
  scheduleColumnsWithColor,
  onOpenDetail,
}: ShuttleBusPaymentConfirmationTableActionsProps) {
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirm();
  const [
    pendingTicketReceiptShuttleBusId,
    setPendingTicketReceiptShuttleBusId,
  ] = useState<number | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`;

  // 로딩 상태 설정
  const setLoading = (action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${registration.id}_${action}`]: isLoading,
    }));
  };

  // 로딩 상태 확인
  const isLoading = (action: string) => {
    return !!loadingStates[`${registration.id}_${action}`];
  };

  const getTicketButtonColorClass = (color?: string) => {
    const colorMap: Record<string, string> = {
      rose: "border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:border-rose-500 disabled:bg-rose-50 disabled:text-rose-700",
      amber:
        "border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:border-amber-500 disabled:bg-amber-50 disabled:text-amber-700",
      teal: "border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:border-teal-500 disabled:bg-teal-50 disabled:text-teal-700",
      indigo:
        "border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:border-indigo-500 disabled:bg-indigo-50 disabled:text-indigo-700",
    };
    return (
      colorMap[color ?? ""] ||
      "border-gray-500 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:border-gray-500 disabled:bg-gray-50 disabled:text-gray-700"
    );
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
    void confirmDialog.open({
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
    void confirmDialog.open({
      title: "입금 요청",
      description:
        "정말로 입금 요청 처리를 하시겠습니까? 입금 요청 문자가 전송됩니다.",
      onConfirm: performSendPaymentRequest,
    });
  };

  const performConfirmTicketReceipt = async (shuttleBusId: number) => {
    setPendingTicketReceiptShuttleBusId(shuttleBusId);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${registration.id}/confirm-ticket-receipt`,
        { shuttleBusId }
      );

      await mutate(registrationsEndpoint);

      addToast({
        title: "성공",
        description: "버스 티켓 수령 확인이 완료되었습니다.",
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
              : "버스 티켓 수령 확인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setPendingTicketReceiptShuttleBusId(null);
    }
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
        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
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
        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
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

    case UserRetreatShuttleBusPaymentStatus.PAID:
      return (
        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
          {registration.ticketReceipts?.map((ticketReceipt) => {
            const isReceived = !!ticketReceipt?.ticketReceivedAt;
            const isTicketReceiptPending =
              pendingTicketReceiptShuttleBusId === ticketReceipt.shuttleBusId;
            const ticketLabel = getShuttleBusScheduleLabel(
              ticketReceipt.departureTime,
              ticketReceipt.shuttleBusName
            ).replace("\n", " ");
            const ticketSchedule = scheduleColumnsWithColor.find(
              (schedule) => schedule.id === ticketReceipt.shuttleBusId
            );

            return (
              <Button
                key={ticketReceipt.shuttleBusId}
                size="sm"
                variant={isReceived ? "secondary" : "outline"}
                onClick={() =>
                  performConfirmTicketReceipt(ticketReceipt.shuttleBusId)
                }
                disabled={isReceived || isTicketReceiptPending}
                title={`${ticketLabel} ${isReceived ? "수령 완료" : "티켓 수령"}`}
                className={cn(
                  "flex h-7 w-full items-center justify-center gap-1.5 px-3 text-center text-xs whitespace-nowrap disabled:cursor-default disabled:opacity-100",
                  getTicketButtonColorClass(ticketSchedule?.color)
                )}
              >
                {isTicketReceiptPending ? (
                  <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <TicketCheck className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{ticketLabel}</span>
                <span className="shrink-0">
                  {isReceived ? "수령 완료" : "티켓 수령"}
                </span>
              </Button>
            );
          })}
        </div>
      );

    default:
      return <div className="text-center text-gray-400 text-sm">-</div>;
  }
}
