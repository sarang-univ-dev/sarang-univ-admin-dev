/**
 * Next.js Middleware - 쿠키 기반 인증
 *
 * Express 서버에서 설정한 accessToken 쿠키를 확인합니다.
 * 쿠키가 없으면 /login으로 리다이렉트합니다.
 *
 * 실제 JWT 검증은 Express 서버의 retreatAdminAuthMiddleware에서 수행됩니다.
 * 이 미들웨어는 쿠키 존재 여부만 확인하여 불필요한 API 호출을 방지합니다.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon.ico"];

// 정적 자산 패턴
const STATIC_ASSET_REGEX = /\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|woff2?)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 자산 / public 경로는 그대로 통과
  if (
    STATIC_ASSET_REGEX.test(pathname) ||
    PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  // Express 서버에서 설정한 accessToken 쿠키 확인
  const accessToken = request.cookies.get("accessToken")?.value;
  const isAuthenticated = !!accessToken;

  // 인증되지 않은 경우 /login으로 리다이렉트
  if (!isAuthenticated) {
    console.log("[Middleware] Redirecting to /login (no accessToken cookie)");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 인증된 상태에서 /login 페이지 접근 시 홈으로 리다이렉트
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

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
