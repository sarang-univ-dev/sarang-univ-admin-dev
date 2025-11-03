import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";
import { MediaQueryKey } from "@/lib/constants/breakpoints";

/**
 * SSR-safe 미디어 쿼리 훅
 *
 * @description
 * - Zustand store와 연동하여 전역 상태로 관리
 * - SSR 시 hydration mismatch 방지 (초기값 false → useEffect에서 실제 값으로 업데이트)
 * - 모든 컴포넌트가 동일한 미디어 쿼리 상태를 공유
 *
 * @param query - 미디어 쿼리 문자열 (예: "(max-width: 768px)")
 * @param key - 전역 상태 키 (선택). 제공하지 않으면 query 문자열 자체를 키로 사용
 * @returns 미디어 쿼리 매칭 여부
 *
 * @example
 * ```tsx
 * import { MEDIA_QUERIES } from "@/lib/constants/breakpoints";
 *
 * function Component() {
 *   const isMobile = useMediaQuery(MEDIA_QUERIES.mobile, "mobile");
 *   return isMobile ? <MobileView /> : <DesktopView />;
 * }
 * ```
 */
export function useMediaQuery(
  query: string,
  key?: MediaQueryKey | string
): boolean {
  const storeKey = key ?? query;
  const matches = useUIStore((state) => state.mediaQueries[storeKey] ?? false);
  const setMediaQuery = useUIStore((state) => state.setMediaQuery);

  useEffect(() => {
    // SSR 환경 체크
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);

    // 초기값 설정 (클라이언트에서만)
    setMediaQuery(storeKey, media.matches);

    // 변경 감지 리스너
    const listener = (e: MediaQueryListEvent) => {
      setMediaQuery(storeKey, e.matches);
    };

    // Modern API
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    // Legacy API (Safari < 14)
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query, storeKey, setMediaQuery]);

  return matches;
}

/**
 * 편의 훅: 모바일 여부 체크
 *
 * @description
 * - MEDIA_QUERIES.mobile을 사용하여 모바일 여부 확인
 * - md breakpoint (768px) 미만을 모바일로 간주
 *
 * @example
 * ```tsx
 * function Component() {
 *   const isMobile = useIsMobile();
 *   return isMobile ? <MobileView /> : <DesktopView />;
 * }
 * ```
 */
export function useIsMobile(): boolean {
  // MEDIA_QUERIES를 여기서 직접 import하면 순환 참조 방지
  const MOBILE_QUERY = "(max-width: 767px)";
  return useMediaQuery(MOBILE_QUERY, "mobile");
}
