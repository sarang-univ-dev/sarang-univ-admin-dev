"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import config from "@/lib/constant/config";
import ErrorMessage from "@/components/common/ErrorMessage";
import LoadingIndicator from "@/components/common/LoadingIndicator";

/**
 * useSearchParams()를 사용하는 내부 컴포넌트
 * Next.js 14에서는 Suspense 경계 내에서 사용해야 함
 */
function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  // ✅ OAuth 코드는 1회만 사용 가능 - 중복 실행 방지
  const hasAttemptedLogin = useRef(false);

  useEffect(() => {
    // ✅ 이미 로그인 시도했으면 재실행 방지 (StrictMode 대응)
    if (hasAttemptedLogin.current) return;
    hasAttemptedLogin.current = true;

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

    handleLogin();
  }, [searchParams, router]);

  if (error) {
    return <ErrorMessage message="로그인 중 오류가 발생했습니다." />;
  }
  return <LoadingIndicator />;
}

/**
 * 로그인 리다이렉트 페이지
 * Suspense로 감싸서 useSearchParams() CSR bailout 방지
 */
export default function Redirect() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <RedirectContent />
    </Suspense>
  );
}
