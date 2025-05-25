"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import useUser from "@/lib/hooks/swr/useUser";
import ErrorMessage from "@/components/common/ErrorMessage";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import { useRetreatSlug } from "@/lib/hooks/swr/useRetreatSlug";

const Redirect = () => {
  const { user, mutate:userMutate } = useUser();
  const { mutate:retreatSlugMutate } = useRetreatSlug();
  const router = useRouter();
  const [error, setError] = useState(false);

  const handleLogin = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get("code");

      if (!googleToken) {
        //NOTE - 로그인 토큰없음
        return;
      }

      const response = await fetch(`/api/auth/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleToken }),
        credentials: "include",
      });
      //   console.log(response);
      if (!response.ok) {
        //NOTE - 사용자 정보 없음 or 오류
        setError(true);
        return;
      }

      await Promise.all([
        userMutate(),          
        retreatSlugMutate(),   
      ]);

      router.replace("/");
      router.refresh();
    } catch (error) {
      //NOTE - 오류
      setError(true);
    }
  };

  useEffect(() => {
    if (!user) {
      handleLogin();
    } else {
      router.replace("/");
      router.refresh();
    }
  }, [user, router]);

  if (error) return <ErrorMessage message="로그인 중 오류가 발생했습니다."/>;
  return <LoadingIndicator />;
};

export default Redirect;
