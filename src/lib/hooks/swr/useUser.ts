"use client";

import useSWR from "swr";

import AuthAPI from "../../api/auth";

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
