// src/app/api/userrole/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TIME } from "@/lib/constant";

export async function POST(req: NextRequest) {
  try {
    const { roles } = await req.json();
    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: "Role 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const serialized = encodeURIComponent(roles.join(","));

    const response = NextResponse.json({ message: "Roles 설정 완료" });
    response.headers.append(
      "Set-Cookie",
      `roles=${serialized}; Path=/; Secure; SameSite=None; Max-Age=${TIME.DAY}`
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Roles 설정 중 오류 발생" },
      { status: 500 }
    );
  }
}
