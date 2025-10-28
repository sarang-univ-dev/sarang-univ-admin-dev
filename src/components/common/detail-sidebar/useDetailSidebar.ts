"use client";

import { useState, useCallback } from "react";

export function useDetailSidebar<T>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  return {
    selectedItem,
    isOpen,
    open,
    close,
    setIsOpen: handleOpenChange,
  };
}
