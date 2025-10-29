"use client";

import AuthAPI from "../../api/auth";
import useSWR from "swr";

const useUser = () => {
  const { data, error, mutate, isLoading } = useSWR(
    "/api/v1/auth/check-auth",
    () => AuthAPI.getUser(),
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  );

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export default useUser;
