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

  const response = await fetch(
    `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // 60초 캐싱
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch univ group admin staff data");
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
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 }, // 5분 캐싱 (스케줄은 자주 변경되지 않음)
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
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // 60초 캐싱
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
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 }, // 60초 캐싱
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
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 }, // 5분 캐싱 (결제 스케줄은 자주 변경되지 않음)
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch retreat payments");
  }

  const data = await response.json();
  return data.retreatInfo.payment;
}

