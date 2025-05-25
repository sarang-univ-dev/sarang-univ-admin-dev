"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CreditCard, Calendar, Users, LogOut, History } from "lucide-react";
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
              isActive={isActive("/confirm-retreat-payment")}
              className="pl-6 transition-colors duration-200"
              style={{
                backgroundColor: isActive("/confirm-retreat-payment")
                  ? "rgb(243, 244, 246)"
                  : "",
                borderLeft: isActive("/confirm-retreat-payment")
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                fontWeight: isActive("/confirm-retreat-payment") ? "600" : "400",
              }}
            >
              <Link href="/confirm-retreat-payment">
                <CreditCard
                  className={`h-4 w-4 ${isActive("/confirm-retreat-payment") ? "text-primary" : ""}`}
                />
                <span>입금 정보 조회</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/schedule-change-request")}
              className="pl-6 transition-colors duration-200"
              style={{
                backgroundColor: isActive("/schedule-change-request")
                  ? "rgb(243, 244, 246)"
                  : "",
                borderLeft: isActive("/schedule-change-request")
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                fontWeight: isActive("/schedule-change-request") ? "600" : "400",
              }}
            >
              <Link href="/schedule-change-request">
                <Calendar
                  className={`h-4 w-4 ${isActive("/schedule-change-request") ? "text-primary" : ""}`}
                />
                <span>일정 변동 요청 페이지</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/schedule-change-history")}
              className="pl-6 transition-colors duration-200"
              style={{
                backgroundColor: isActive("/schedule-change-history")
                  ? "rgb(243, 244, 246)"
                  : "",
                borderLeft: isActive("/schedule-change-history")
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                fontWeight: isActive("/schedule-change-history") ? "600" : "400",
              }}
            >
              <Link href="/schedule-change-history">
                <History
                  className={`h-4 w-4 ${isActive("/schedule-change-history") ? "text-primary" : ""}`}
                />
                <span>일정 변동 조회 페이지</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/univ-group-staff-retreat")}
              className="pl-6 transition-colors duration-200"
              style={{
                backgroundColor: isActive("/univ-group-staff-retreat")
                  ? "rgb(243, 244, 246)"
                  : "",
                borderLeft: isActive("/univ-group-staff-retreat")
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                fontWeight: isActive("/univ-group-staff-retreat") ? "600" : "400",
              }}
            >
              <Link href="/univ-group-staff-retreat">
                <Users
                  className={`h-4 w-4 ${isActive("/univ-group-staff-retreat") ? "text-primary" : ""}`}
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
