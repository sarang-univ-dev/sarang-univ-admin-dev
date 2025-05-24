"use client";

import { useSidebarStore } from "@/store/sidebar-store";
import { Menu } from "lucide-react";

const MobileSidebarToggle = () => {
  const { toggle } = useSidebarStore();

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 shadow-sm md:hidden"
    >
      <Menu className="w-5 h-5" />
      <span className="text-sm font-medium">메뉴</span>
    </button>
  );
};

export default MobileSidebarToggle;
