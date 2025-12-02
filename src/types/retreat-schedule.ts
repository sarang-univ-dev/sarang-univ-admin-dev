import { LucideIcon } from "lucide-react";
import { TRetreatRegistrationSchedule } from "./index";

/**
 * 이벤트 타입 (식사, 숙박 등)
 */
export enum EventType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SLEEP = "SLEEP",
}

/**
 * 이벤트 타입별 설정 (아이콘, 레이블)
 */
export interface EventTypeConfig {
  icon: LucideIcon;
  label: string;
}

/**
 * 이벤트 타입 맵
 */
export type EventTypeMap = Record<string, EventTypeConfig>;

/**
 * 요일별 스케줄 그룹
 */
export interface DayGroup {
  dayName: string;
  schedules: ScheduleColumn[];
}

/**
 * 스케줄 컬럼 정보
 */
export interface ScheduleColumn {
  key: string;
  id: number;
  label: string;
  fullLabel: string;
  time: string;
  type: string;
}

/**
 * 포맷된 행 데이터 (부서별 통계)
 */
export interface FormattedRow {
  id: string;
  label: string;
  cells: Record<string, JSX.Element>;
  fullParticipation: JSX.Element;
  partialParticipation: JSX.Element;
  total: JSX.Element;
  fullParticipationCount?: number;
  partialParticipationCount?: number;
  totalCount?: number;
}

/**
 * 날짜별 스케줄 맵
 */
export type DateScheduleMap = Map<string, Map<string, ScheduleColumn>>;

/**
 * 부서별 참여 통계
 */
export interface ParticipationStats {
  full: number;
  partial: number;
}

/**
 * 부서별 총 인원수
 */
export type DepartmentTotals = Record<string, number>;

/**
 * 부서별 참여 통계 맵
 */
export type ParticipationStatsMap = Record<string, ParticipationStats>;
