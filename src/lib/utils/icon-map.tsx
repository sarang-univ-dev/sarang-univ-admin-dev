import {
  FileText,
  Receipt,
  CalendarClock,
  Users,
  MapPin,
  History,
  BusFront,
  CreditCard,
  BadgeCheck,
  ListChecks,
  Home,
  UserRound,
  UsersRound,
  ListTree,
  Utensils,
  Calendar,
  CalendarDays,
  Bus,
  type LucideIcon,
} from "lucide-react"

/**
 * lucide-react 아이콘 이름과 컴포넌트 매핑
 * 데이터베이스에 저장된 아이콘 이름(문자열)을 실제 React 컴포넌트로 변환
 */
export const iconMap: Record<string, LucideIcon> = {
  FileText,
  Receipt,
  CalendarClock,
  Users,
  MapPin,
  History,
  BusFront,
  CreditCard,
  BadgeCheck,
  ListChecks,
  Home,
  UserRound,
  UsersRound,
  ListTree,
  Utensils,
  Calendar,
  CalendarDays,
  Bus,
  BusIcon: Bus, // BusIcon은 Bus와 동일하게 처리
}

/**
 * 아이콘 이름(문자열)을 받아 해당하는 lucide-react 아이콘 컴포넌트를 반환
 * @param iconName - 데이터베이스에 저장된 아이콘 이름
 * @returns LucideIcon 컴포넌트 또는 undefined
 *
 * @example
 * const Icon = getIconComponent('FileText')
 * if (Icon) return <Icon className="h-4 w-4" />
 */
export function getIconComponent(iconName?: string): LucideIcon | undefined {
  if (!iconName) return undefined
  return iconMap[iconName]
}
