import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 이미지 및 폰트, CSS 등의 확장자 패턴을 미들웨어 제외 대상에 추가
  const isStaticAsset = pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|woff2?)$/);

  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  const token = request.cookies.get("accessToken")?.value;

  if (!token && !isPublic && !isStaticAsset) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
