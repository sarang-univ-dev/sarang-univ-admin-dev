/**
 * Tailwind CSS Breakpoints
 * @see https://tailwindcss.com/docs/responsive-design
 */

export const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type TailwindBreakpoint = keyof typeof TAILWIND_BREAKPOINTS;

/**
 * Media Query Strings (Tailwind 기준)
 */
export const MEDIA_QUERIES = {
  // Max-width queries (모바일 우선)
  mobile: `(max-width: ${TAILWIND_BREAKPOINTS.md - 1}px)`, // < 768px
  tablet: `(min-width: ${TAILWIND_BREAKPOINTS.md}px) and (max-width: ${TAILWIND_BREAKPOINTS.lg - 1}px)`, // 768px - 1023px
  desktop: `(min-width: ${TAILWIND_BREAKPOINTS.lg}px)`, // >= 1024px

  // Min-width queries (Tailwind 스타일)
  sm: `(min-width: ${TAILWIND_BREAKPOINTS.sm}px)`,
  md: `(min-width: ${TAILWIND_BREAKPOINTS.md}px)`,
  lg: `(min-width: ${TAILWIND_BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${TAILWIND_BREAKPOINTS.xl}px)`,
  "2xl": `(min-width: ${TAILWIND_BREAKPOINTS["2xl"]}px)`,
} as const;

export type MediaQueryKey = keyof typeof MEDIA_QUERIES;
