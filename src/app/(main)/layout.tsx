import type React from "react"
import { cookies } from "next/headers"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar"
import ClientProviders from "@/components/providers/ClientProviders"
import Footer from "@/components/common/layout/Footer"
import { getRetreatsWithMenusServer } from "@/lib/api/server-admin-api"

/**
 * Main Layout - Server Component
 * 서버에서 사용자의 retreat 목록과 메뉴를 fetch하여 사이드바에 전달
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 서버에서 데이터 fetch (권한 계산 완료된 데이터)
  const retreats = await getRetreatsWithMenusServer()

  // 서버에서 사이드바 상태 cookie 읽기
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")
  const defaultOpen = sidebarState?.value === "true" ? true : sidebarState?.value === "false" ? false : true

  return (
    <ClientProviders>
      <SidebarProvider defaultOpen={defaultOpen}>
        <div className="flex min-h-screen w-full">
          {/* 새로운 사이드바 (shadcn UI) */}
          <AppSidebar retreats={retreats} />

          <div className="flex flex-1 flex-col min-w-0">
            <SidebarInset>
              <div className="sticky top-0 z-40 flex items-center gap-2 border-b px-4 py-2 bg-white">
                <SidebarTrigger />
                <div className="flex-1" />
              </div>

              <main className="flex-1 p-2 md:p-6">
                {children}
              </main>
            </SidebarInset>

            <Footer />
          </div>
        </div>
      </SidebarProvider>
    </ClientProviders>
  )
}
