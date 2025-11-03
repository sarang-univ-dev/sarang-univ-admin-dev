import { useState, useMemo, useCallback } from "react";

export interface UsePaginationReturn<T> {
  /** 현재 페이지 (0-based index) */
  currentPage: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 현재 페이지의 데이터 */
  paginatedData: T[];
  /** 다음 페이지로 이동 */
  goToNextPage: () => void;
  /** 이전 페이지로 이동 */
  goToPrevPage: () => void;
  /** 특정 페이지로 이동 */
  goToPage: (page: number) => void;
  /** 페이지 초기화 (첫 페이지로) */
  resetPage: () => void;
  /** 다음 페이지 존재 여부 */
  hasNextPage: boolean;
  /** 이전 페이지 존재 여부 */
  hasPrevPage: boolean;
}

/**
 * 클라이언트 사이드 페이지네이션 훅
 *
 * @description
 * - 배열 데이터를 페이지 단위로 분할
 * - useCallback으로 함수 메모이제이션하여 성능 최적화
 * - useMemo로 계산된 값 캐싱
 *
 * @param data - 전체 데이터 배열
 * @param pageSize - 페이지당 아이템 수 (기본: 10)
 * @returns 페이지네이션 상태 및 제어 함수
 *
 * @example
 * ```tsx
 * function DataTable({ data }: { data: User[] }) {
 *   const {
 *     paginatedData,
 *     currentPage,
 *     totalPages,
 *     goToNextPage,
 *     goToPrevPage,
 *     hasNextPage,
 *     hasPrevPage,
 *   } = usePagination(data, 10);
 *
 *   return (
 *     <>
 *       <Table data={paginatedData} />
 *       <Pagination
 *         currentPage={currentPage}
 *         totalPages={totalPages}
 *         onNext={goToNextPage}
 *         onPrev={goToPrevPage}
 *         hasNext={hasNextPage}
 *         hasPrev={hasPrevPage}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function usePagination<T>(
  data: T[],
  pageSize: number = 10
): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(0);

  // 전체 페이지 수 계산
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  // 현재 페이지 데이터 추출
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  // 다음 페이지 존재 여부
  const hasNextPage = useMemo(() => {
    return currentPage < totalPages - 1;
  }, [currentPage, totalPages]);

  // 이전 페이지 존재 여부
  const hasPrevPage = useMemo(() => {
    return currentPage > 0;
  }, [currentPage]);

  // ✅ useCallback으로 함수 메모이제이션
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(0, Math.min(totalPages - 1, page));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const resetPage = useCallback(() => {
    setCurrentPage(0);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToNextPage,
    goToPrevPage,
    goToPage,
    resetPage,
    hasNextPage,
    hasPrevPage,
  };
}
