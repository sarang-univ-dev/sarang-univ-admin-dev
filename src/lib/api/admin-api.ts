/**
 * Admin API 클라이언트
 * 서버의 /api/v1/admin/* 엔드포인트와 통신
 */

import { webAxios } from './axios'
import type { RetreatWithMenus, RetreatsResponse } from '@/types/sidebar'

/**
 * 사용자가 접근 가능한 모든 retreat + 메뉴 목록 조회 (sidebar용)
 *
 * @returns RetreatWithMenus[] - 서버에서 권한 계산된 retreat 목록
 *
 * @example
 * const retreats = await getRetreatsWithMenus();
 * // [{ id: 1, slug: '2025-winter', name: '2025 겨울수양회', menuItems: [...] }]
 */
export async function getRetreatsWithMenus(): Promise<RetreatWithMenus[]> {
  const response = await webAxios.get<RetreatsResponse>('/api/v1/admin/retreats')
  return response.data.retreats
}

/**
 * 사용자가 특정 retreat의 특정 페이지에 접근 가능한지 확인
 *
 * @param retreatId - Retreat ID
 * @param pagePath - 페이지 경로 (예: '/confirm-retreat-payment')
 * @returns boolean - 접근 가능 여부
 *
 * @example
 * const canAccess = await checkPageAccess(1, '/gbs-line-up');
 * // true or false
 */
export async function checkPageAccess(
  retreatId: number,
  pagePath: string
): Promise<boolean> {
  const response = await webAxios.get<{ canAccess: boolean }>(
    `/api/v1/admin/retreats/${retreatId}/permissions`,
    { params: { pagePath } }
  )
  return response.data.canAccess
}
