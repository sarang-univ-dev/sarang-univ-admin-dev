// src/components/common/layout/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_MENU } from "@/lib/constant/sidebar.constants";
import { useSidebarStore } from "@/store/sidebar-store";

const Sidebar = () => {
  const pathname = usePathname();
  const { isOpen } = useSidebarStore();

  return (
    <aside
      className={`${
        isOpen ? "block" : "hidden"
      } w-64 bg-gray-100 p-4 border-r min-h-screen md:block`}
    >
      <ul className="space-y-2">
        {SIDEBAR_MENU.map(menu => (
          <li key={menu.label}>
            <Link
              href={menu.href}
              className={`block px-3 py-2 rounded hover:bg-gray-200 ${
                pathname === menu.href ? "bg-gray-300 font-bold" : ""
              }`}
            >
              {menu.text}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
