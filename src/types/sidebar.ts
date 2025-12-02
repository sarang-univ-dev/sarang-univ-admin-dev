/**
 * Sidebar 관련 타입 정의
 * 서버(sarang-univ-server/src/types/index.ts)의 타입과 동일하게 유지
 */

export interface MenuItem {
  path: string
  label: string
  href: string
  icon?: string
}

export interface RetreatWithMenus {
  id: number
  slug: string
  name: string
  menuItems: MenuItem[]
}

export interface RetreatsResponse {
  retreats: RetreatWithMenus[]
}
