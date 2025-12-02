"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import config from "@/lib/constant/config";
import ErrorMessage from "@/components/common/ErrorMessage";
import LoadingIndicator from "@/components/common/LoadingIndicator";

export default function Redirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  const handleLogin = async () => {
    try {
      const code = searchParams.get("code");

      if (!code) {
        throw new Error("인증 코드가 없습니다.");
      }

      // ✅ Express 서버로 직접 요청
      const response = await fetch(
        `${config.API_HOST}/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`,
        {
          method: "GET",
          credentials: "include", // ✅ 쿠키 수신
        }
      );

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "구글 로그인 실패");
      }

      const data = await response.json();

      // ✅ 쿠키는 자동으로 설정됨 (httpOnly)
      console.log("로그인 성공:", data.user);

      // 대시보드로 리디렉션
      router.replace("/");
      router.refresh();
    } catch (e: any) {
      console.error("handleLogin error ▶", e);
      setError(true);
    }
  };

  useEffect(() => {
    handleLogin();
  }, [searchParams]);

  if (error) {
    return <ErrorMessage message="로그인 중 오류가 발생했습니다." />;
  }
  return <LoadingIndicator />;
}
