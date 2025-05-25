import useSWR from "swr";
import UserAPI from "@/lib/api/user";
import { UserRetreatMapping } from "@/lib/types/common";

interface UseUserRoleResult {
  userRole?: UserRetreatMapping[];
  isLoading: boolean;
  isError: boolean;
}

const useUserRole = (slug?: string): UseUserRoleResult => {
  const { data, error, isValidating } = useSWR<UserRetreatMapping[]>(
    slug ? `/api/v1/retreat/${slug}/user-role` : null,
    () => UserAPI.getUserRole(slug!),
    {
      dedupingInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return {
    userRole: data,
    isLoading: !error && isValidating,
    isError: !!error,
  };
};

export default useUserRole;
