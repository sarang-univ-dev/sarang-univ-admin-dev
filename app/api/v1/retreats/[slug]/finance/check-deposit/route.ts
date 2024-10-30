import axios from "axios";
import { NextResponse } from "next/server";
import { handleError } from "../../../../../../../utils/errorHandler";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = await params;
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!SERVER_URL) {
    return NextResponse.json(
      { error: "서버 URL이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const response = await axios.get(
      `${SERVER_URL}/api/v1/retreats/${slug}/finance/check-deposit`
    );

    if (response.status !== 200) {
      console.error("서버 오류:", response.data);
      return NextResponse.json(
        {
          error: response.data.error || "서버에서 데이터를 불러오지 못했습니다."
        },
        { status: response.status }
      );
    }

    const depositData = response.data;

    return NextResponse.json(depositData);
  } catch (error) {
    return handleError(error);
  }
}
