"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import IconGoogleLogo from "@/components/icons/IconGoogleLogo";
import config from "@/lib/constant/config";

/**
 * 로그인 페이지
 *
 * Express 서버의 BFF 패턴을 사용한 Google OAuth 로그인
 * - Express 서버의 /api/v1/auth/google로 리다이렉트
 * - 관리자 검증은 서버에서 처리
 * - 로그인 성공 시 httpOnly 쿠키가 설정되고 / 로 리다이렉트됨
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Express 서버의 Google OAuth 엔드포인트로 리다이렉트
    window.location.href = `${config.API_HOST}/api/v1/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative h-40 bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('/abstract-geometric-flow.png')] opacity-10 bg-cover bg-center"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm">
                <img
                  src="/sarangchurch_logo2.png"
                  alt="사랑의교회 로고"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain brightness-0 invert"
                />
              </div>
            </div>
          </div>

          <div className="px-8 py-10">
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
              사랑의교회 대학부
              <br />
              <span className="text-lg font-medium text-gray-600">
                수양회 관리자 시스템
              </span>
            </h1>

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-6 flex items-center justify-center gap-3 rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-base font-medium">로그인 중...</span>
                </>
              ) : (
                <>
                  <IconGoogleLogo />
                  <span className="text-base font-medium">Google로 로그인</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
