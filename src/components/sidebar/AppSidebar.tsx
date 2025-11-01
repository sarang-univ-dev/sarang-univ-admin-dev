"use client"

import { useParams, usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import RetreatGroup from "./RetreatGroup"
import type { RetreatWithMenus } from "@/types/sidebar"

interface AppSidebarProps {
  /**
   * 서버에서 권한 계산이 완료된 retreat 목록
   * 각 retreat는 사용자가 접근 가능한 메뉴만 포함
   */
  retreats: RetreatWithMenus[]
}

export function AppSidebar({ retreats }: AppSidebarProps) {
  const params = useParams()
  const pathname = usePathname()

  // URL에서 현재 retreat slug 파악
  const currentRetreatSlug = params.retreatSlug as string | undefined

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-2">
        <h2 className="text-lg font-semibold">수양회 관리</h2>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {retreats.length === 0 ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            접근 가능한 수양회가 없습니다.
          </div>
        ) : (
          retreats.map((retreat) => {
            // 현재 URL의 retreat slug와 비교하여 활성 상태 판단
            const isActive = retreat.slug === currentRetreatSlug

            return (
              <SidebarGroup key={retreat.slug}>
                <RetreatGroup
                  retreat={retreat}
                  isActive={isActive}
                  currentPath={pathname}
                />
              </SidebarGroup>
            )
          })
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-2">
        <div className="text-xs text-muted-foreground">
          사랑의교회 대학부
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
