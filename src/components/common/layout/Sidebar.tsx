// components/common/layout/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/store/sidebar-store";
import { useRetreatSlug } from "@/lib/hooks/swr/useRetreatSlug";
import useUserRole from "@/lib/hooks/swr/useUserRole";
import { getSidebarMenu } from "@/utils/sidebar";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import ErrorMessage from "@/components/common/ErrorMessage";
import SidebarToggleButton from "./SidebarToggle";

const Sidebar = () => {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { retreatSlug } = useRetreatSlug();
  const { userRole, isLoading, isError } = useUserRole(retreatSlug!);

  if (!retreatSlug) return null;
  if (isLoading) return <LoadingIndicator />;
  if (isError || !userRole)
    return <ErrorMessage message="롤을 불러올 수 없습니다." />;

  const menuItems = getSidebarMenu(userRole, retreatSlug);

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-60 h-full w-64 bg-white border-r shadow-md
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* 토글 버튼을 오른쪽 위에 absolute로 배치 */}
        <div className="absolute top-4 right-4 z-60">
          <SidebarToggleButton />
        </div>

        {/* pt-16으로 윗부분 여유를 주어 버튼과 겹치지 않도록 */}
        <ul className="space-y-2 p-4 pt-16">
          {menuItems.map(menu => (
            <li key={menu.href}>
              <Link
                href={menu.href}
                className={`
                  block px-3 py-2 rounded hover:bg-gray-200
                  ${pathname === menu.href ? "bg-gray-300 font-bold" : ""}
                `}
                onClick={close}
              >
                {menu.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
