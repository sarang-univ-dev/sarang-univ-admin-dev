import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/utils/errorHandler";
import {
  TRetreatRegisterSchedule,
  TRetreatUserRegistration,
} from "@/app/types";

export async function GET(request: NextRequest) {
  const pathSegments = request.nextUrl.pathname.split("/");
  const slug = pathSegments[pathSegments.length - 3];

  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!SERVER_URL) {
    return NextResponse.json(
      { error: "서버 URL이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const retreatUserRegistrationsResponse = await axios.get(
      `${SERVER_URL}/api/v1/retreat-registrations/${slug}`
    );

    if (retreatUserRegistrationsResponse.status !== 200) {
      console.error("서버 오류:", retreatUserRegistrationsResponse.data);
      return NextResponse.json(
        {
          error:
            retreatUserRegistrationsResponse.data.error ||
            "서버에서 데이터를 불러오지 못했습니다.",
        },
        { status: retreatUserRegistrationsResponse.status }
      );
    }

    const retreatRegisterSchedulesResponse = await axios.get(
      `${SERVER_URL}/api/v1/retreats/${slug}/schedules`
    );

    if (retreatRegisterSchedulesResponse.status !== 200) {
      console.error("서버 오류:", retreatRegisterSchedulesResponse.data);
      return NextResponse.json(
        {
          error:
            retreatRegisterSchedulesResponse.data.error ||
            "서버에서 데이터를 불러오지 못했습니다.",
        },
        { status: retreatRegisterSchedulesResponse.status }
      );
    }

    const retreatUserRegistrations = retreatUserRegistrationsResponse.data
      .retreatUserRegistrations as TRetreatUserRegistration[];

    const retreatRegisterSchedules = retreatRegisterSchedulesResponse.data
      .schedules as TRetreatRegisterSchedule[];
    return NextResponse.json({
      retreatUserRegistrations,
      retreatRegisterSchedules: retreatRegisterSchedules,
    });
  } catch (error) {
    return handleError(error);
  }
}
