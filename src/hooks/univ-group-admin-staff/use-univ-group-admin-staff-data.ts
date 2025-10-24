import useSWR, { SWRConfiguration } from "swr";
import { webAxios } from "@/lib/api/axios";
import { IUnivGroupAdminStaffRetreat } from "@/types/univ-group-admin-staff";

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  return response.data.userRetreatRegistrations;
};

/**
 * 부서 행정 간사 수양회 신청 데이터를 가져오는 SWR 훅
 *
 * @param retreatSlug - 수양회 슬러그
 * @param options - SWR 설정 옵션
 * @returns SWR 응답 (data, error, isLoading, mutate)
 */
export function useUnivGroupAdminStaffData(
  retreatSlug?: string,
  options?: SWRConfiguration<IUnivGroupAdminStaffRetreat[], Error>
) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`
    : null;

  return useSWR<IUnivGroupAdminStaffRetreat[], Error>(endpoint, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    ...options,
  });
}
