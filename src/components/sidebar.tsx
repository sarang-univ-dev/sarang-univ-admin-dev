"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CreditCard, Calendar, Users, LogOut } from "lucide-react";
import { useAuth } from "./auth-provider";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <Sidebar>
      <SidebarHeader className="pb-4 border-b">
        <div className="px-4 py-3">
          <h2 className="text-xl font-bold tracking-tight text-primary">
            수양회 전산화
          </h2>
          <p className="text-xs text-muted-foreground">재정 관리 시스템</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/payment")}
              className="pl-6 transition-colors duration-200"
              style={{
                backgroundColor: isActive("/payment")
                  ? "rgb(243, 244, 246)"
                  : "",
                borderLeft: isActive("/payment")
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                fontWeight: isActive("/payment") ? "600" : "400",
              }}
            >
              <Link href="/payment">
                <CreditCard
                  className={`h-4 w-4 ${isActive("/payment") ? "text-primary" : ""}`}
                />
                <span>입금 조회</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/schedule")}
              className="pl-6 transition-colors duration-200"
              style={{
                backgroundColor: isActive("/schedule")
                  ? "rgb(243, 244, 246)"
                  : "",
                borderLeft: isActive("/schedule")
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                fontWeight: isActive("/schedule") ? "600" : "400",
              }}
            >
              <Link href="/schedule">
                <Calendar
                  className={`h-4 w-4 ${isActive("/schedule") ? "text-primary" : ""}`}
                />
                <span>일정 변동</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/department")}
              className="pl-6 transition-colors duration-200"
              style={{
                backgroundColor: isActive("/department")
                  ? "rgb(243, 244, 246)"
                  : "",
                borderLeft: isActive("/department")
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                fontWeight: isActive("/department") ? "600" : "400",
              }}
            >
              <Link href="/department">
                <Users
                  className={`h-4 w-4 ${isActive("/department") ? "text-primary" : ""}`}
                />
                <span>부서 신청 내역</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>로그아웃</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
