/**
 * Server-side Admin API 클라이언트
 * Server Component에서 사용하기 위한 fetch 기반 API
 */

import { cookies } from "next/headers"
import type { RetreatWithMenus, RetreatsResponse } from "@/types/sidebar"
import config from "@/lib/constant/config"

/**
 * 사용자가 접근 가능한 모든 retreat + 메뉴 목록 조회 (Server Component용)
 *
 * @returns RetreatWithMenus[] - 서버에서 권한 계산된 retreat 목록
 * @throws Error - API 호출 실패 시
 *
 * @example
 * // app/layout.tsx (Server Component)
 * const retreats = await getRetreatsWithMenusServer();
 */
export async function getRetreatsWithMenusServer(): Promise<RetreatWithMenus[]> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")?.value

  if (!accessToken) {
    console.error("No access token found in cookies")
    return []
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
    })

    if (!response.ok) {
      console.error(`Failed to fetch retreats: ${response.status} ${response.statusText}`)
      return []
    }

    const data: RetreatsResponse = await response.json()
    return data.retreats
  } catch (error) {
    console.error("Error fetching retreats:", error)
    return []
  }
}
