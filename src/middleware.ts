// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/api"];
const STATIC_ASSET_REGEX = /\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|woff2?)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 자산 / public 경로는 그대로 통과
  if (
    STATIC_ASSET_REGEX.test(pathname) ||
    PUBLIC_PATHS.some(path => pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  // 로그인 토큰 없으면 /login 으로 리다이렉트
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    console.log("[Redirect] /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
