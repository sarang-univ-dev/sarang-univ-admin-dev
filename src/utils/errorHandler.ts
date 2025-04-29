import { NextResponse } from "next/server";
import axios from "axios";

/**
 * 공통 에러 핸들링 함수
 * @param error - 발생한 에러
 * @returns NextResponse - 적절한 에러 응답
 */
export function handleError(error: unknown) {
  // Axios 에러 처리
  if (axios.isAxiosError(error)) {
    console.error("Axios error:", error.message);
    return NextResponse.json(
      { error: error.response?.data?.error || "데이터를 불러오는 데 실패했습니다." },
      { status: error.response?.status || 500 }
    );
  } 
  // 일반적인 에러 처리
  else if (error instanceof Error) {
    console.error("Unexpected error:", error.message);
    return NextResponse.json(
      { error: "예상치 못한 오류가 발생했습니다." },
      { status: 500 }
    );
  } 
  // 기타 타입의 에러 처리
  else {
    console.error("Unknown error:", error);
    return NextResponse.json(
      { error: "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
