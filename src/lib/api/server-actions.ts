import "server-only";
import { cookies } from "next/headers";

import config from "@/lib/constant/config";

const API_BASE_URL = config.API_HOST;

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

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
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
      method: "GET",
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
      method: "GET",
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
      method: "GET",
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

  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/line-up/user-lineups`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store", // 실시간 데이터를 위해 캐싱 비활성화
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch GBS line-up data: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.userRetreatGbsLineups;
}

/**
 * 부서 셔틀버스 등록 데이터 조회 (Server Action)
 *
 * @description
 * 부서별 셔틀버스 신청자 목록을 서버에서 가져옵니다.
 * - 입금 현황, 일정 변경 메모 등 포함
 * - Client Component의 SWR fallbackData로 사용
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns 부서 셔틀버스 등록 데이터 배열
 */
export async function fetchUnivGroupBusRegistrations(retreatSlug: string) {
  const token = await getServerToken();

  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/shuttle-bus/univ-group-registration`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store", // 실시간 데이터를 위해 캐싱 비활성화
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch univ group bus registrations: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.univGroupShuttleBusRegistrations;
}

/**
 * 셔틀버스 재정 팀원용 신청 내역 조회 (Server Action)
 *
 * @description
 * SHUTTLE_BUS_ACCOUNT_MEMBER 권한으로 셔틀버스 신청 내역을 조회합니다.
 * - 입금 확인, 입금 요청, 일정 변동 승인 기능에 사용
 * - 부서 번호, 성별, 학년, 이름, 전화번호, 입금 현황 등 포함
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns 셔틀버스 신청 내역 배열
 */
export async function fetchShuttleBusPaymentConfirmationRegistrations(
  retreatSlug: string
) {
  const token = await getServerToken();

  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store", // 실시간 데이터를 위해 캐싱 비활성화
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch shuttle bus payment confirmation registrations: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.retreatShuttleBusRegistrations;
}

/**
 * 셔틀버스 스케줄 정보 조회 (Server Action)
 *
 * @description
 * 수양회 셔틀버스 일정 목록을 서버에서 가져옵니다.
 * - 출발 시간, 장소, 정원 등 정보 포함
 * - 동적 컬럼 생성에 사용
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns 셔틀버스 스케줄 배열
 */
export async function fetchShuttleBusSchedules(retreatSlug: string) {
  const token = await getServerToken();

  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/shuttle-bus/info`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store", // 실시간 데이터를 위해 캐싱 비활성화
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch shuttle bus schedules: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.shuttleBusInfo.shuttleBuses;
}

/**
 * 부서 재정 팀원용 수양회 신청 내역 조회 (Server Action)
 *
 * @description
 * UNIV_GROUP_ACCOUNT_MEMBER 권한으로 수양회 신청 내역을 조회합니다.
 * - 입금 확인, 입금 요청, 환불 처리 기능에 사용
 * - 부서 번호, 성별, 학년, 이름, 입금 현황 등 포함
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns 수양회 신청 내역 배열
 */
export async function fetchAccountPaymentConfirmationRegistrations(
  retreatSlug: string
) {
  const token = await getServerToken();

  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/account/user-retreat-registrations`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store", // 실시간 데이터를 위해 캐싱 비활성화
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch account payment confirmation registrations: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.userRetreatRegistrations;
}

/**
 * 리더 일정 변경 요청 조회 (Server Action, DORMITORY 권한)
 *
 * @description
 * 리더가 제출한 일정 변경 요청 목록을 서버에서 가져옵니다.
 * - 인원관리(DORMITORY) 간사가 승인/거절 처리
 * - Client Component의 SWR fallbackData로 사용
 *
 * @param retreatSlug - 수양회 슬러그
 * @param status - 요청 상태 필터 (기본값: PENDING)
 * @returns 리더 일정 변경 요청 배열
 */
export async function fetchLeaderScheduleChangeRequests(
  retreatSlug: string,
  status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING"
) {
  const token = await getServerToken();

  const query = new URLSearchParams({ status });
  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/admin/schedule-change-requests?${query.toString()}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch leader schedule change requests: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data.requests;
}

export async function fetchDepartmentLeaderScheduleChangeRequests(
  retreatSlug: string,
  status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING"
) {
  const token = await getServerToken();

  const query = new URLSearchParams({ status });
  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/department-admin/schedule-change-requests?${query.toString()}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch department leader schedule change requests: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data.requests;
}

/**
 * 리더 리포트(은혜나눔/기도제목) 조회 (Server Action, EDUCATION_STAFF 권한)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param date - 조회 일자 (YYYY-MM-DD, optional)
 * @returns 리더 리포트 배열
 */
export async function fetchLeaderReports(retreatSlug: string, date?: string) {
  const token = await getServerToken();

  const query = date ? `?date=${date}` : "";
  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/department-admin/reports${query}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch leader reports: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data.reports;
}

/**
 * 리더 리포트 제출 현황 조회 (Server Action, EDUCATION_STAFF 권한)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param date - 조회 일자 (YYYY-MM-DD, optional, 기본값은 서버의 "오늘")
 * @returns { submissionStatus, date }
 */
export async function fetchLeaderReportSubmissionStatus(
  retreatSlug: string,
  date?: string
) {
  const token = await getServerToken();

  const query = date ? `?date=${date}` : "";
  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/admin/report-submission-status${query}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch leader report submission status: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}

export async function fetchDepartmentLeaderReportSubmissionStatus(
  retreatSlug: string,
  date?: string
) {
  const token = await getServerToken();

  const query = date ? `?date=${date}` : "";
  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/department-admin/report-submission-status${query}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch department leader report submission status: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}

/**
 * 리더 출석 현황 조회 (Server Action, EDUCATION_STAFF 권한)
 *
 * @param retreatSlug - 수양회 슬러그
 * @param date - 조회 일자 (YYYY-MM-DD, optional, 기본값은 서버의 "오늘")
 * @returns { attendance, date }
 */
export async function fetchLeaderAttendance(
  retreatSlug: string,
  date?: string
) {
  const token = await getServerToken();

  const query = date ? `?date=${date}` : "";
  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/admin/attendance${query}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch leader attendance: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}

export async function fetchDepartmentLeaderAttendance(
  retreatSlug: string,
  date?: string
) {
  const token = await getServerToken();

  const query = date ? `?date=${date}` : "";
  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/department-admin/attendance${query}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch department leader attendance: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}

/**
 * 리더 리포트 - 오늘(일자) 정보 조회 (Server Action, EDUCATION_STAFF 권한)
 *
 * @param retreatSlug - 수양회 슬러그
 * @returns { today, days, lastDay, isLastDay }
 */
export async function fetchLeaderToday(retreatSlug: string) {
  const token = await getServerToken();

  const url = `${API_BASE_URL}/api/v1/retreat/${retreatSlug}/leader/admin/today`;

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch leader today info: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}
