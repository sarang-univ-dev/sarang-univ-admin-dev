import AuthAPI from "@/lib/api/auth";
import { NextResponse } from "next/server";
import { TIME } from "@/lib/constant";
import { webAxios } from "@/lib/api/axios";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map(c => c.split("="))
    );

    const oldRefreshToken = cookies["refreshToken"];
    if (!oldRefreshToken) {
      return NextResponse.json({ error: "인증 토큰 없음" }, { status: 401 });
    }

    const data = await AuthAPI.refresh(oldRefreshToken);

    if (!data) {
      return NextResponse.json({ error: "토큰 재발급 실패" }, { status: 500 });
    }

    const { accessToken, refreshToken } = data;

    const response = NextResponse.json({ message: "재발급 성공" });

    response.headers.append(
      "Set-Cookie",
      `accessToken=${accessToken}; Path=/; Secure; SameSite=None; Max-Age=${TIME.HOUR}`
    );

    response.headers.append(
      "Set-Cookie",
      `refreshToken=${refreshToken}; Path=/; Secure; SameSite=None; Max-Age=${TIME.DAY}`
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.response?.data?.message || "로그인 실패",
        url: webAxios.defaults.baseURL,
        status: error.response?.status || 401,
      },
      { status: error.response?.status || 401 }
    );
  }
}
