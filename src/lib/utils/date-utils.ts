/**
 * KST (한국 표준시) 날짜 유틸리티
 *
 * toLocaleDateString/toLocaleTimeString과 timeZone: "Asia/Seoul"을 사용하여
 * 정확한 KST 날짜/시간을 반환합니다.
 */

const KST_TIMEZONE = "Asia/Seoul";
const KST_LOCALE = "ko-KR";

/**
 * 입력을 Date 객체로 변환
 */
function toDate(dateInput: string | Date): Date {
  return typeof dateInput === "string" ? new Date(dateInput) : dateInput;
}

/**
 * KST 기준 요일 반환 (0: 일요일 ~ 6: 토요일)
 */
export function getKSTDay(dateInput: string | Date): number {
  const date = toDate(dateInput);
  const weekdayStr = date.toLocaleDateString(KST_LOCALE, {
    timeZone: KST_TIMEZONE,
    weekday: "short",
  });
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return weekdays.indexOf(weekdayStr);
}

/**
 * KST 기준 날짜(일) 반환
 */
export function getKSTDate(dateInput: string | Date): number {
  const date = toDate(dateInput);
  return parseInt(
    date.toLocaleDateString(KST_LOCALE, {
      timeZone: KST_TIMEZONE,
      day: "numeric",
    }),
    10
  );
}

/**
 * KST 기준 월 반환 (0: 1월 ~ 11: 12월)
 */
export function getKSTMonth(dateInput: string | Date): number {
  const date = toDate(dateInput);
  return (
    parseInt(
      date.toLocaleDateString(KST_LOCALE, {
        timeZone: KST_TIMEZONE,
        month: "numeric",
      }),
      10
    ) - 1
  );
}

/**
 * KST 기준 연도 반환
 */
export function getKSTFullYear(dateInput: string | Date): number {
  const date = toDate(dateInput);
  return parseInt(
    date.toLocaleDateString(KST_LOCALE, {
      timeZone: KST_TIMEZONE,
      year: "numeric",
    }),
    10
  );
}

/**
 * KST 기준 시간 반환 (0-23)
 */
export function getKSTHours(dateInput: string | Date): number {
  const date = toDate(dateInput);
  return parseInt(
    date.toLocaleTimeString(KST_LOCALE, {
      timeZone: KST_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }),
    10
  );
}

/**
 * KST 기준 분 반환 (0-59)
 */
export function getKSTMinutes(dateInput: string | Date): number {
  const date = toDate(dateInput);
  return parseInt(
    date.toLocaleTimeString(KST_LOCALE, {
      timeZone: KST_TIMEZONE,
      minute: "numeric",
    }),
    10
  );
}

/**
 * KST 기준 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getKSTDateString(dateInput: string | Date): string {
  const date = toDate(dateInput);
  const year = getKSTFullYear(date);
  const month = String(getKSTMonth(date) + 1).padStart(2, "0");
  const day = String(getKSTDate(date)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * KST 기준 요일 문자열 반환 ("일", "월", "화", "수", "목", "금", "토")
 */
export function getKSTWeekday(dateInput: string | Date): string {
  const date = toDate(dateInput);
  return date.toLocaleDateString(KST_LOCALE, {
    timeZone: KST_TIMEZONE,
    weekday: "short",
  });
}

/**
 * KST 기준 요일 문자열 반환 (주일 포함: "주일", "월", "화", "수", "목", "금", "토")
 */
export function getKSTWeekdayWithSunday(dateInput: string | Date): string {
  const weekday = getKSTWeekday(dateInput);
  return weekday === "일" ? "주일" : weekday;
}
