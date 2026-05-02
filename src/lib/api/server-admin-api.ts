/**
 * Server-side Admin API 클라이언트
 * Server Component에서 사용하기 위한 fetch 기반 API
 */

import { cookies } from "next/headers";

import config from "@/lib/constant/config";
import type {
  AdminUnivGroupWithGrades,
  ManagedRetreat,
} from "@/types/retreat-create";
import type { AdminNavigationResponse } from "@/types/sidebar";

/**
 * 사용자가 접근 가능한 retreat 메뉴와 전역 admin 메뉴 목록 조회 (Server Component용)
 *
 * @returns RetreatWithMenus[] - 서버에서 권한 계산된 retreat 목록
 * @throws Error - API 호출 실패 시
 *
 * @example
 * // app/layout.tsx (Server Component)
 * const retreats = await getRetreatsWithMenusServer();
 */
export async function getAdminNavigationServer(): Promise<AdminNavigationResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    console.error("No access token found in cookies");
    return { globalMenuItems: [], retreats: [] };
  }

  try {
    // 표준 fetch 사용 (HTTP localhost)
    const response = await fetch(`${config.API_HOST}/api/v1/admin/retreats`, {
      method: "GET",
      headers: {
        Cookie: `accessToken=${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch retreats: ${response.status} ${response.statusText}`
      );
      return { globalMenuItems: [], retreats: [] };
    }

    const data: AdminNavigationResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching retreats:", error);
    return { globalMenuItems: [], retreats: [] };
  }
}

export async function getRetreatsWithMenusServer() {
  const navigation = await getAdminNavigationServer();

  return navigation.retreats;
}

async function fetchAdminServer<T>(path: string, fallback: T): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return fallback;
  }

  try {
    const response = await fetch(`${config.API_HOST}${path}`, {
      method: "GET",
      headers: {
        Cookie: `accessToken=${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error fetching admin path ${path}:`, error);
    return fallback;
  }
}

export async function getManagedRetreatsServer(): Promise<ManagedRetreat[]> {
  const data = await fetchAdminServer<{ retreats: ManagedRetreat[] }>(
    "/api/v1/admin/retreats/manage",
    { retreats: [] }
  );

  return data.retreats;
}

export async function getManagedRetreatServer(
  retreatId: number
): Promise<ManagedRetreat | null> {
  const data = await fetchAdminServer<{ retreat: ManagedRetreat | null }>(
    `/api/v1/admin/retreats/${retreatId}/manage`,
    { retreat: null }
  );

  return data.retreat;
}

export async function getUnivGroupsWithGradesServer(): Promise<
  AdminUnivGroupWithGrades[]
> {
  const data = await fetchAdminServer<{
    univGroups: AdminUnivGroupWithGrades[];
  }>("/api/v1/admin/univ-groups/grades", { univGroups: [] });

  return data.univGroups;
}
