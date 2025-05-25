
import { PagePath, USER_ROLE_PAGES } from '@/lib/constant/permissions.constants'
import { UserRetreatMapping } from '@/lib/types/common'

export interface SidebarMenuItem {
  href: string
  label: string
}


const PAGE_LABELS: Record<PagePath, string> = {
  [PagePath.STAFF_LIST]:  '부서 정보 조회',
  [PagePath.SCHEDULE_HISTORY]: '일정 변동 내역',
  [PagePath.COMFIRM_PAYMENT]: '입금 조회',
  [PagePath.SCHEDULRE_CHANGE]: '일정 변동 요청'
}

export function getSidebarMenu(
  userRole: UserRetreatMapping[],
  slug: string
): SidebarMenuItem[] {
  const retreatRole = userRole[0].role;
  const paths = USER_ROLE_PAGES[retreatRole] || []
  return paths.map(path => ({
    href: `/retreat/${slug}${path}`,
    label: PAGE_LABELS[path] ?? path
  }))
}
