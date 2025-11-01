import "server-only";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_URL || "http://localhost:3001";

/**
 * 서버에서 액세스 토큰 가져오기
 */
async function getServerToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

/**
 * 부서 행정 간사 수양회 신청 데이터 가져오기 (서버 사이드)
 */
export async function fetchUnivGroupAdminStaffData(retreatSlug: string) {
  const token = await getServerToken();

  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`;

  console.log('[fetchUnivGroupAdminStaffData] Fetching:', url);
  console.log('[fetchUnivGroupAdminStaffData] Token:', token ? 'exists' : 'missing');

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store", // 캐싱 비활성화 (실시간 데이터)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[fetchUnivGroupAdminStaffData] Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      url,
    });
    throw new Error(
      `Failed to fetch univ group admin staff data: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data.userRetreatRegistrations;
}

/**
 * 수양회 스케줄 데이터 가져오기 (서버 사이드)
 */
export async function fetchRetreatSchedules(retreatSlug: string) {
  const token = await getServerToken();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/info`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch retreat schedules");
  }

  const data = await response.json();
  return data.retreatInfo.schedule;
}

/**
 * 재정 간사 수양회 신청 데이터 가져오기 (서버 사이드)
 */
export async function fetchAccountStaffRegistrations(retreatSlug: string) {
  const token = await getServerToken();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/account/retreat-registrations`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch account staff registrations");
  }

  const data = await response.json();
  return data.retreatRegistrations;
}

/**
 * 일정 변경 요청 데이터 가져오기 (서버 사이드)
 */
export async function fetchScheduleChangeRequests(retreatSlug: string) {
  const token = await getServerToken();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/account/schedule-change-request`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch schedule change requests");
  }

  const data = await response.json();
  return data.scheduleChangeRequests;
}

/**
 * 수양회 결제 스케줄 데이터 가져오기 (서버 사이드)
 */
export async function fetchRetreatPayments(retreatSlug: string) {
  const token = await getServerToken();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/info`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch retreat payments");
  }

  const data = await response.json();
  return data.retreatInfo.payment;
}

/**
 * GBS Line-Up 데이터 조회 (Server Action)
 *
 * @description
 * 수양회 GBS 라인업 데이터를 서버에서 가져옵니다.
 * - 실시간 협업을 위한 데이터 제공
 * - Client Component의 SWR fallbackData로 사용
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns GBS 라인업 데이터 배열
 */
export async function fetchGbsLineUpData(retreatSlug: string) {
  const token = await getServerToken();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/line-up/user-lineups`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: "no-store", // 실시간 데이터를 위해 캐싱 비활성화
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch GBS line-up data");
  }

  const data = await response.json();
  return data.userRetreatGbsLineups;
}

