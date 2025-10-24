import { useState, useCallback } from "react";

/**
 * 모달 상태 관리를 위한 공통 훅
 *
 * @example
 * const modal = useModal<number>();
 *
 * // 열기
 * modal.open(123);
 *
 * // 닫기
 * modal.close();
 *
 * // 모달 내부에서 데이터 접근
 * if (modal.isOpen && modal.data) {
 *   console.log(modal.data); // 123
 * }
 */
export function useModal<T = unknown>(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, data, open, close, toggle };
}
