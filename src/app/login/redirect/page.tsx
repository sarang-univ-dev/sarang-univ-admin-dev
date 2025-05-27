"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import UserAPI from "@/lib/api/user";
import ErrorMessage from "@/components/common/ErrorMessage";
import LoadingIndicator from "@/components/common/LoadingIndicator";

export default function Redirect() {
  const router = useRouter();
  const [error, setError] = useState(false);

  const handleLogin = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get("code");
      if (!googleToken) {
        throw new Error("인증 코드가 없습니다.");
      }

      const loginRes = await fetch("/api/auth/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ googleToken }),
      });
      if (!loginRes.ok) {
        const body = await loginRes.json();
        throw new Error(body.error || "구글 로그인 실패");
      }

      await new Promise(r => setTimeout(r, 0));

      const retreatSlug = await UserAPI.getUserRetreatSlug();
      if (!retreatSlug) {
        throw new Error("retreatSlug 조회 실패");
      }

      const userRole = await UserAPI.getUserRole(retreatSlug);
      if (!Array.isArray(userRole) || userRole.length === 0) {
        throw new Error("권한 정보가 없습니다.");
      }

      const registerRes = await fetch("/api/userrole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roles: userRole.map(r => r.role),
        }),
      });
      if (!registerRes.ok) {
        const body = await registerRes.json();
        throw new Error(body.error || "권한 등록 실패");
      }

      router.replace("/");
      router.refresh();
    } catch (e: any) {
      console.error("handleLogin error ▶", e);
      setError(true);
    }
  };

  useEffect(() => {
    handleLogin();
  }, []);

  if (error) {
    return <ErrorMessage message="러그인 중 오류가 발생했습니다." />;
  }
  return <LoadingIndicator />;
}
