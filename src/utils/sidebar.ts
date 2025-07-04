import { PagePath, USER_ROLE_PAGES } from '@/lib/constant/permissions.constants'
import { UserRetreatMapping } from '@/lib/types/common'

export interface SidebarMenuItem {
  href: string
  label: string
}

const PAGE_LABELS: Record<PagePath, string> = {
  [PagePath.UNIV_GROUP_RETREAT]:  '수양회 부서 정보 조회',
  [PagePath.SCHEDULE_HISTORY]: '수양회 일정 변동 내역',
  [PagePath.COMFIRM_PAYMENT]: '수양회 입금 조회',
  [PagePath.SCHEDULE_CHANGE]: '수양회 일정 변동 요청',
  [PagePath.CONFIRM_BUS_PAYMENT]: '셔틀버스 입금 조회',
  [PagePath.UNIV_GROUP_BUS] : '셔틀버스 부서 정보 조회',
  [PagePath.BUS_SCHEDULE_HISTORY] : '셔틀버스 일정 변동 내역',
  [PagePath.BUS_SCHEDULE_CHANGE] : '셔틀버스 일정 변동 요청',
  [PagePath.ACCOUNT_STAFF] : '재정 간사 조회',
  [PagePath.GBS_LINE_UP] : '수양회 GBS 라인업',
  [PagePath.LINEUP_VIEW_CHANGES] : '라인업 간사 일정 변동 조회',
  [PagePath.DORM_VIEW_CHANGES] : '인원관리 간사 일정 변동 조회',
  [PagePath.GBS_LINE_UP_MANAGEMENT] : '수양회 GBS 리더 관리',
  [PagePath.DORMITORY_TEAM_MEMBER] : '인원관리 팀원 페이지',
  [PagePath.ASSIGN_GBS_LOCATION] : 'GBS 장소 배정',
  [PagePath.MEAL_CHECK] : '식사 체크',
  [PagePath.DORMITORY_ASSIGNMENT] : '숙소 배정',
  [PagePath.SHUTTLE_CHECK] : '셔틀버스 체크',
}

export function getSidebarMenu(
  userRole: UserRetreatMapping[],
  slug: string
): SidebarMenuItem[] {
  // 사용자의 모든 역할에서 접근 가능한 페이지들을 수집
  const allAccessiblePaths = new Set<PagePath>();
  
  userRole.forEach(roleMapping => {
    const paths = USER_ROLE_PAGES[roleMapping.role] || [];
    paths.forEach(path => allAccessiblePaths.add(path));
  });

  // Set을 배열로 변환하고 메뉴 아이템으로 매핑
  return Array.from(allAccessiblePaths).map(path => ({
    href: `/retreat/${slug}${path}`,
    label: PAGE_LABELS[path] ?? path
  }));
}
