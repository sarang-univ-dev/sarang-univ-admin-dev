import { DayGroup, DateScheduleMap, EventTypeMap } from "@/types/retreat-schedule";
import { Sunrise, Sun, Sunset, Bed } from "lucide-react";
import { getKSTDateString, getKSTMonth, getKSTDate, getKSTDay } from "./date-utils";

/**
 * 이벤트 타입별 아이콘 및 레이블 매핑
 */
export const EVENT_TYPE_MAP: EventTypeMap = {
  BREAKFAST: { icon: Sunrise, label: "아침" },
  LUNCH: { icon: Sun, label: "점심" },
  DINNER: { icon: Sunset, label: "저녁" },
  SLEEP: { icon: Bed, label: "숙박" },
};

/**
 * 날짜별로 스케줄을 정리하는 함수
 *
 * @param dayGroups - 요일별 스케줄 그룹
 * @returns 날짜별 스케줄 맵 (날짜 → 이벤트 타입 → 스케줄)
 */
export function createDateScheduleMap(dayGroups: DayGroup[]): DateScheduleMap {
  const dateScheduleMap: DateScheduleMap = new Map();

  dayGroups.forEach((group) => {
    group.schedules.forEach((schedule) => {
      // KST 기준으로 날짜 키 생성
      const dateKey = getKSTDateString(schedule.time); // YYYY-MM-DD (KST 기준)
      const eventType = schedule.type;

      if (!dateScheduleMap.has(dateKey)) {
        dateScheduleMap.set(dateKey, new Map());
      }
      dateScheduleMap.get(dateKey)!.set(eventType, schedule);
    });
  });

  return dateScheduleMap;
}

/**
 * 날짜 맵에서 모든 날짜를 추출하여 정렬
 *
 * @param dateScheduleMap - 날짜별 스케줄 맵
 * @returns 정렬된 날짜 배열 (YYYY-MM-DD 형식)
 */
export function extractSortedDates(dateScheduleMap: DateScheduleMap): string[] {
  return Array.from(dateScheduleMap.keys()).sort();
}

/**
 * 날짜 포맷 함수 (YYYY-MM-DD → M/D(요일))
 *
 * @param dateStr - YYYY-MM-DD 형식의 날짜 문자열
 * @returns M/D(요일) 형식 (예: "1/15(월)")
 */
export function formatDate(dateStr: string): string {
  // KST 기준으로 포맷
  const month = getKSTMonth(dateStr) + 1;
  const day = getKSTDate(dateStr);
  const weekday = ["주일", "월", "화", "수", "목", "금", "토"][getKSTDay(dateStr)];
  return `${month}/${day}(${weekday})`;
}
