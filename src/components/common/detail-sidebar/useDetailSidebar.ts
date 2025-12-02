"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function useDetailSidebar<T>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  const open = useCallback((item: T) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // 애니메이션 후 데이터 클리어
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      close();
    } else {
      setIsOpen(true);
    }
  }, [close]);

  // 페이지 이동 시 사이드바 자동 닫기 (모바일 최적화)
  useEffect(() => {
    // pathname이 실제로 변경되었는지 확인
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;

      // 사이드바가 열려있으면 닫기
      if (isOpen) {
        setIsOpen(false);
        setTimeout(() => setSelectedItem(null), 300);
      }
    }
  }, [pathname, isOpen]);

  return {
    selectedItem,
    isOpen,
    open,
    close,
    setIsOpen: handleOpenChange,
  };
}
