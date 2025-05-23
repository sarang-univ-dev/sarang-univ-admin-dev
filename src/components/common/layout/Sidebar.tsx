"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSidebarMenu } from "@/utils/sidebar";
import { useSidebarStore } from "@/store/sidebar-store";

const Sidebar = () => {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  const match = pathname.match(/^\/retreat\/([^/]+)/);
  const retreatSlug = match?.[1];

  const menuItems = retreatSlug ? getSidebarMenu(retreatSlug) : [];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={close}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r shadow-md
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:block md:h-screen
        `}
      >
        <ul className="space-y-2 p-4">
          {menuItems.map(menu => (
            <li key={menu.label}>
              <Link
                href={menu.href}
                className={`block px-3 py-2 rounded hover:bg-gray-200 ${
                  pathname === menu.href ? "bg-gray-300 font-bold" : ""
                }`}
                onClick={close}
              >
                {menu.text}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
