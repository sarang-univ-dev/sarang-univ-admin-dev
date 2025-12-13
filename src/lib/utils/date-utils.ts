/**
 * KST (한국 표준시) 날짜 유틸리티
 *
 * @description
 * UTC 날짜를 KST로 변환하여 한국 시간대에 맞는 요일, 날짜를 반환합니다.
 * new Date()는 UTC 기준으로 파싱되므로 KST로 변환 필요
 */

const KST_OFFSET_HOURS = 9;
const KST_OFFSET_MS = KST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * UTC 날짜를 KST로 변환한 Date 객체 반환
 *
 * @param dateInput - 날짜 문자열 또는 Date 객체
 * @returns KST로 변환된 Date 객체
 *
 * @example
 * // ISO 문자열 (UTC) -> KST Date
 * toKSTDate("2025-01-10T15:00:00.000Z") // 2025-01-11 00:00:00 KST
 */
export function toKSTDate(dateInput: string | Date): Date {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Date(date.getTime() + KST_OFFSET_MS);
}

/**
 * KST 기준 요일 반환 (0: 일요일 ~ 6: 토요일)
 *
 * @param dateInput - 날짜 문자열 또는 Date 객체
 * @returns 요일 (0-6)
 */
export function getKSTDay(dateInput: string | Date): number {
  return toKSTDate(dateInput).getUTCDay();
}

/**
 * KST 기준 날짜(일) 반환
 *
 * @param dateInput - 날짜 문자열 또는 Date 객체
 * @returns 일 (1-31)
 */
export function getKSTDate(dateInput: string | Date): number {
  return toKSTDate(dateInput).getUTCDate();
}

/**
 * KST 기준 월 반환 (0: 1월 ~ 11: 12월)
 *
 * @param dateInput - 날짜 문자열 또는 Date 객체
 * @returns 월 (0-11)
 */
export function getKSTMonth(dateInput: string | Date): number {
  return toKSTDate(dateInput).getUTCMonth();
}

/**
 * KST 기준 연도 반환
 *
 * @param dateInput - 날짜 문자열 또는 Date 객체
 * @returns 연도
 */
export function getKSTFullYear(dateInput: string | Date): number {
  return toKSTDate(dateInput).getUTCFullYear();
}

/**
 * KST 기준 시간 반환 (0-23)
 *
 * @param dateInput - 날짜 문자열 또는 Date 객체
 * @returns 시간 (0-23)
 */
export function getKSTHours(dateInput: string | Date): number {
  return toKSTDate(dateInput).getUTCHours();
}

/**
 * KST 기준 분 반환 (0-59)
 *
 * @param dateInput - 날짜 문자열 또는 Date 객체
 * @returns 분 (0-59)
 */
export function getKSTMinutes(dateInput: string | Date): number {
  return toKSTDate(dateInput).getUTCMinutes();
}
