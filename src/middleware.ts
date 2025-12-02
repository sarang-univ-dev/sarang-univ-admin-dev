/**
 * Next.js Middleware - 인증 처리
 *
 * NextAuth.js v5의 auth() 함수를 사용하여 세션을 확인합니다.
 * 인증되지 않은 사용자는 /login으로 리다이렉트됩니다.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  "/login",
  "/api/auth", // NextAuth API routes
  "/_next",
  "/favicon.ico",
];

// 정적 자산 패턴
const STATIC_ASSET_REGEX = /\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|woff2?)$/;

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 정적 자산 / public 경로는 그대로 통과
  if (
    STATIC_ASSET_REGEX.test(pathname) ||
    PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  // NextAuth 세션 확인
  const isAuthenticated = !!req.auth;

  // 인증되지 않은 경우 /login으로 리다이렉트
  if (!isAuthenticated) {
    if (pathname === "/login") {
      return NextResponse.next();
    }

    console.log("[Middleware] Redirecting to /login (not authenticated)");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 인증된 상태에서 /login 페이지 접근 시 홈으로 리다이렉트
  if (isAuthenticated && pathname === "/login") {
    console.log("[Middleware] Redirecting to / (already authenticated)");
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // 미들웨어가 실행될 경로 패턴
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
