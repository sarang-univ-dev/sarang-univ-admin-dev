import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.retreatShuttleBusRegistrations as IShuttleBusPaymentConfirmationRegistration[];
};

interface UseShuttleBusPaymentConfirmationOptions {
  initialData?: IShuttleBusPaymentConfirmationRegistration[];
  revalidateOnFocus?: boolean;
  dedupingInterval?: number;
}

/**
 * 셔틀버스 재정 팀원용 신청 내역 조회 Hook (SWR)
 *
 * @description
 * - SHUTTLE_BUS_ACCOUNT_MEMBER 권한으로 셔틀버스 신청 내역을 조회합니다.
 * - 입금 확인, 입금 요청, 환불 처리 기능에 사용됩니다.
 * - Server Component에서 전달받은 initialData를 fallbackData로 사용합니다.
 *
 * @param retreatSlug - 수양회 slug
 * @param options - SWR 옵션
 * @returns SWR 응답 (data, error, isLoading, mutate)
 */
export function useShuttleBusPaymentConfirmation(
  retreatSlug: string | null,
  options?: UseShuttleBusPaymentConfirmationOptions
) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`
    : null;

  return useSWR<IShuttleBusPaymentConfirmationRegistration[], Error>(
    endpoint,
    fetcher,
    {
      fallbackData: options?.initialData,
      revalidateOnFocus: options?.revalidateOnFocus ?? true,
      dedupingInterval: options?.dedupingInterval ?? 2000,
    }
  );
}
