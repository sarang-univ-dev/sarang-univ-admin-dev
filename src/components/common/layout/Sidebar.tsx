"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSidebarMenu } from "@/utils/sidebar";
import { useSidebarStore } from "@/store/sidebar-store";

const Sidebar = () => {
  const pathname = usePathname();
  const { isOpen } = useSidebarStore();

  const match = pathname.match(/^\/retreat\/([^/]+)/);
  const retreatSlug = match?.[1];

  const menuItems = retreatSlug ? getSidebarMenu(retreatSlug) : [];

  return (
    <aside
      className={`${
        isOpen ? "block" : "hidden"
      } w-64 bg-gray-100 p-4 border-r min-h-screen md:block`}
    >
      <ul className="space-y-2">
        {menuItems.map(menu => (
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
