import { NextRequest, NextResponse } from "next/server";
import AuthAPI from "@/lib/api/auth";
import { webAxios } from "@/lib/api/axios";
import { TIME } from "@/lib/constant";

export async function POST(req: NextRequest) {
  try {
    const { googleToken } = await req.json();

    if (!googleToken) {
      return NextResponse.json(
        { error: "Google Token이 필요합니다." },
        { status: 401 }
      );
    }

    const data = await AuthAPI.googleLogin(googleToken);

    if (!data) {
      return NextResponse.json({ error: "토큰 발급 실패" }, { status: 500 });
    }

    const { accessToken, refreshToken } = data;

    const response = NextResponse.json({ message: "로그인 성공" });

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
