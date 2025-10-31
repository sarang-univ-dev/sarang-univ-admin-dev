// TODO: 삭제 예정 - shadcn SidebarTrigger로 대체됨
// 새 시스템에서는 @/components/ui/sidebar의 SidebarTrigger를 사용합니다.
"use client";

import { useSidebarStore } from "@/store/sidebar-store";
import { Menu } from "lucide-react";

const SidebarToggleButton = () => {
  const { toggle } = useSidebarStore();

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 shadow-sm"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
};

export default SidebarToggleButton;
