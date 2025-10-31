// TODO: 삭제 예정 - shadcn SidebarProvider로 대체됨
// 새 시스템에서는 @/components/ui/sidebar의 SidebarProvider와 useSidebar 훅을 사용합니다.
// 사이드바 상태는 자동으로 쿠키에 저장되며, 키보드 단축키(Cmd+B)도 지원됩니다.
import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(state => ({ isOpen: !state.isOpen })),
}));
