import { create } from "zustand";
import { MediaQueryKey } from "@/lib/constants/breakpoints";

interface UIStore {
  /**
   * 반응형 상태 맵
   * - key: MediaQueryKey (e.g., "mobile", "md", "lg")
   * - value: 해당 미디어 쿼리 매칭 여부
   */
  mediaQueries: Record<string, boolean>;

  /**
   * 미디어 쿼리 상태 업데이트
   */
  setMediaQuery: (key: string, matches: boolean) => void;

  /**
   * 여러 미디어 쿼리 상태를 한 번에 업데이트
   */
  setMediaQueries: (queries: Record<string, boolean>) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // 초기값: 모든 쿼리를 false (SSR 시 desktop 기본)
  mediaQueries: {},

  setMediaQuery: (key, matches) =>
    set((state) => ({
      mediaQueries: {
        ...state.mediaQueries,
        [key]: matches,
      },
    })),

  setMediaQueries: (queries) =>
    set((state) => ({
      mediaQueries: {
        ...state.mediaQueries,
        ...queries,
      },
    })),
}));

/**
 * 특정 미디어 쿼리 상태를 가져오는 헬퍼 훅
 */
export function useMediaQueryStore(key: MediaQueryKey | string): boolean {
  return useUIStore((state) => state.mediaQueries[key] ?? false);
}

/**
 * 모바일 여부를 가져오는 편의 훅
 */
export function useIsMobile(): boolean {
  return useMediaQueryStore("mobile");
}
