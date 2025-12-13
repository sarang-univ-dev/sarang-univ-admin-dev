import { getKSTDay } from "@/lib/utils/date-utils";

export function getRegisterScheduleAlias(date: string, type: string): string {
  // 요일 축약어 설정 (KST 기준 요일 인덱스 → 한글 축약어)
  const dayAliasMap: { [key: number]: string } = {
    0: "일",
    1: "월",
    2: "화",
    3: "수",
    4: "목",
    5: "금",
    6: "토",
  };

  // 식사 및 숙박 타입 축약어 설정
  const typeAliasMap: { [key: string]: string } = {
    BREAKFAST: "아",
    LUNCH: "점",
    DINNER: "저",
    SLEEP: "숙",
  };

  // KST 기준 요일 인덱스로 변환
  const dayIndex = getKSTDay(date);
  const dayAlias = dayAliasMap[dayIndex] || "";
  const typeAlias = typeAliasMap[type] || "";

  // 최종적으로 "요일+타입" 형식의 축약 문자열 반환
  return `${dayAlias}${typeAlias}`;
}
