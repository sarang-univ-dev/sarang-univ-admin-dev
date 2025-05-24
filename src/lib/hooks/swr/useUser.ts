"use client";

import AuthAPI from "../../api/auth";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const useUser = () => {
  const accessToken = Cookies.get("accessToken");
  const refreshToken = Cookies.get("refreshToken");

  const router = useRouter();

  const { data, error, mutate, isLoading } = useSWR(
    `/users/me`,
    () => AuthAPI.getUser(),
    {
      dedupingInterval: 0,
    }
  );

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          mutate();
          router.refresh();
        } else {
          const errorData = await response.json();
          console.error("토큰 재발급 실패:", errorData.error);
        }
      } catch (err) {
        console.error("토큰 재발급 중 오류 발생:", err);
      }
    };

    if (!accessToken && refreshToken) {
      tryRefresh();
    } else if (!accessToken && !refreshToken) {
      mutate();
      router.refresh();
    }
  }, [accessToken, refreshToken, mutate]);

  return {
    user: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export default useUser;
