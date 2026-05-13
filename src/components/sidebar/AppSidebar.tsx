"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getIconComponent } from "@/lib/utils/icon-map";
import type { AdminNavigationResponse } from "@/types/sidebar";

import RetreatGroup from "./RetreatGroup";

interface AppSidebarProps {
  /**
   * 서버에서 권한 계산이 완료된 retreat 목록
   * 각 retreat는 사용자가 접근 가능한 메뉴만 포함
   */
  navigation: AdminNavigationResponse;
}

export function AppSidebar({ navigation }: AppSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const { globalMenuItems, retreats } = navigation;

  // URL에서 현재 retreat slug 파악
  const currentRetreatSlug = params.retreatSlug as string | undefined;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-2">
        <h2 className="text-lg font-semibold">수양회 관리</h2>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {globalMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 py-2 font-semibold">
              수양회
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {globalMenuItems.map(item => {
                  const Icon = getIconComponent(item.icon);
                  const isCurrentPage = pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isCurrentPage}>
                        <Link href={item.href}>
                          {Icon && <Icon className="h-4 w-4" />}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {retreats.length === 0 ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            접근 가능한 수양회가 없습니다.
          </div>
        ) : (
          retreats.map(retreat => {
            // 현재 URL의 retreat slug와 비교하여 활성 상태 판단
            const isActive = retreat.slug === currentRetreatSlug;

            return (
              <SidebarGroup key={retreat.slug}>
                <RetreatGroup
                  retreat={retreat}
                  isActive={isActive}
                  currentPath={pathname}
                />
              </SidebarGroup>
            );
          })
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-2">
        <div className="text-xs text-muted-foreground">사랑의교회 대학부</div>
      </SidebarFooter>
    </Sidebar>
  );
}
