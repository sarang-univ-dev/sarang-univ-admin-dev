import useSWR, { SWRConfiguration } from "swr";
import { webAxios } from "@/lib/api/axios";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.userRetreatRegistrations as IUserRetreatRegistration[];
};

/**
 * 부서 재정 팀원용 수양회 신청 내역 조회 Hook (SWR)
 *
 * @param retreatSlug - 수양회 slug
 * @param options - SWR 옵션 (initialData 등)
 * @returns SWR 응답 (data, error, isLoading, mutate)
 */
export function useRetreatPaymentConfirmation(
  retreatSlug: string | null,
  options?: SWRConfiguration<IUserRetreatRegistration[], Error>
) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/account/user-retreat-registrations`
    : null;

  return useSWR<IUserRetreatRegistration[], Error>(endpoint, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    ...options,
  });
}
