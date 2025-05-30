// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PagePath,
  USER_ROLE_PAGES,
} from "@/lib/constant/permissions.constants";
import { UserRole } from "@/types";

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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // retreat/[slug]/... 경로라면 roles 쿠키를 확인해서 접근 권한 검증
  if (pathname.startsWith("/retreat/")) {
    const rolesCookie = request.cookies.get("roles")?.value;
    if (!rolesCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const roles = rolesCookie.split(",") as UserRole[];

    const [, , , subpath] = pathname.split("/");
    const targetPath = subpath ? `/${subpath}` : "";

    const allowedPaths = new Set<PagePath>();
    roles.forEach(role => {
      (USER_ROLE_PAGES[role] || []).forEach(p => allowedPaths.add(p));
    });

    if (!allowedPaths.has(targetPath as PagePath)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 4) 통과
  return NextResponse.next();
}
