import { getKSTDateString, getKSTWeekday } from "@/lib/utils/date-utils";
import {
  RetreatRegistrationScheduleType,
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";

/**
 * 시간대별 인원 통계용 신청 데이터 최소 형태.
 * 행정/부서 교역자 페이지의 registration 객체 모두 이 두 필드를 포함한다.
 */
interface RegistrationLike {
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  userRetreatRegistrationScheduleIds?: number[] | null;
}

/**
 * 하루(요일) 단위 시간대별 인원.
 * - 식사: breakfast(아) / lunch(점) / dinner(저)
 * - 숙박: sleep(숙)
 * - 집회(식사·숙박에서 파생, 표는 "저녁 / 저녁 U 숙박 / 숙박" 3행):
 *   - dinner        = 저녁      = 그 날 저녁 일정 있는 사람 수
 *   - dinnerOrSleep = 저녁 U 숙박 = 그 날 저녁 ∪ 숙박 일정 있는 사람 수 (중복 제외)
 *   - sleep         = 숙박      = 그 날 숙박 일정 있는 사람 수
 *   (저녁·숙박을 둘 다 신청한 사람은 dinner·sleep 양쪽에 집계됨 — dinnerOrSleep 만 중복 제외)
 *
 * 해당 날짜에 그 일정 자체가 없으면 값은 null (표에서 "-"로 표시).
 */
export interface DaySlotCounts {
  dateKey: string;
  dayLabel: string;
  breakfast: number | null;
  lunch: number | null;
  dinner: number | null;
  sleep: number | null;
  /** 저녁 ∪ 숙박 일정 있는 사람 수 (중복 제외). 집회 표 전용 파생값. */
  dinnerOrSleep: number | null;
}

export interface TimeSlotStats {
  days: DaySlotCounts[];
  /** 수양회 전체에 각 일정 타입이 하나라도 존재하는지 (표의 열 표시 여부 판단) */
  has: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    sleep: boolean;
  };
}

interface DayBucket {
  dateKey: string;
  time: string | Date;
  breakfastIds: number[];
  lunchIds: number[];
  dinnerIds: number[];
  sleepIds: number[];
}

/** KST 요일 → 단일 글자 라벨 (일요일은 "주") */
function dayLabelFromTime(time: string | Date): string {
  const weekday = getKSTWeekday(time); // "일" | "월" | ... | "토"
  return weekday === "일" ? "주" : weekday;
}

const anyIn = (regSet: Set<number>, ids: number[]): boolean =>
  ids.some(id => regSet.has(id));

/**
 * 시간대별(식사/숙박/집회) 인원 통계를 계산한다.
 * 집계 기준은 입금 완료(PAID) 신청자만 (기존 "식사 숙박 인원 집계 표"와 동일).
 */
export function computeTimeSlotStats(
  registrations: RegistrationLike[],
  schedules: TRetreatRegistrationSchedule[]
): TimeSlotStats {
  const emptyHas = {
    breakfast: false,
    lunch: false,
    dinner: false,
    sleep: false,
  };

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return { days: [], has: emptyHas };
  }

  // 입금 완료(PAID)만 집계
  const paid = (Array.isArray(registrations) ? registrations : []).filter(
    reg => reg?.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
  );

  // PAID 신청자별 신청 스케줄 ID Set
  const regScheduleSets = paid.map(
    reg => new Set(reg.userRetreatRegistrationScheduleIds ?? [])
  );

  // KST 날짜별 · 타입별 스케줄 ID 버킷 구성
  const buckets = new Map<string, DayBucket>();
  for (const schedule of schedules) {
    const dateKey = getKSTDateString(schedule.time);
    let bucket = buckets.get(dateKey);
    if (!bucket) {
      bucket = {
        dateKey,
        time: schedule.time,
        breakfastIds: [],
        lunchIds: [],
        dinnerIds: [],
        sleepIds: [],
      };
      buckets.set(dateKey, bucket);
    }
    switch (schedule.type) {
      case RetreatRegistrationScheduleType.BREAKFAST:
        bucket.breakfastIds.push(schedule.id);
        break;
      case RetreatRegistrationScheduleType.LUNCH:
        bucket.lunchIds.push(schedule.id);
        break;
      case RetreatRegistrationScheduleType.DINNER:
        bucket.dinnerIds.push(schedule.id);
        break;
      case RetreatRegistrationScheduleType.SLEEP:
        bucket.sleepIds.push(schedule.id);
        break;
    }
  }

  const sortedBuckets = [...buckets.values()].sort((a, b) =>
    a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0
  );

  const has = {
    breakfast: sortedBuckets.some(b => b.breakfastIds.length > 0),
    lunch: sortedBuckets.some(b => b.lunchIds.length > 0),
    dinner: sortedBuckets.some(b => b.dinnerIds.length > 0),
    sleep: sortedBuckets.some(b => b.sleepIds.length > 0),
  };

  const days: DaySlotCounts[] = sortedBuckets.map(bucket => {
    const hasBreakfast = bucket.breakfastIds.length > 0;
    const hasLunch = bucket.lunchIds.length > 0;
    const hasDinner = bucket.dinnerIds.length > 0;
    const hasSleep = bucket.sleepIds.length > 0;

    let breakfast = 0;
    let lunch = 0;
    let dinner = 0;
    let sleep = 0;
    let dinnerOrSleep = 0; // 저녁 ∪ 숙박 (중복 제외)

    for (const regSet of regScheduleSets) {
      const inDinner = hasDinner && anyIn(regSet, bucket.dinnerIds);
      const inSleep = hasSleep && anyIn(regSet, bucket.sleepIds);

      if (hasBreakfast && anyIn(regSet, bucket.breakfastIds)) breakfast++;
      if (hasLunch && anyIn(regSet, bucket.lunchIds)) lunch++;
      if (inDinner) dinner++;
      if (inSleep) sleep++;
      if (inDinner || inSleep) dinnerOrSleep++;
    }

    return {
      dateKey: bucket.dateKey,
      dayLabel: dayLabelFromTime(bucket.time),
      breakfast: hasBreakfast ? breakfast : null,
      lunch: hasLunch ? lunch : null,
      dinner: hasDinner ? dinner : null,
      sleep: hasSleep ? sleep : null,
      dinnerOrSleep: hasDinner || hasSleep ? dinnerOrSleep : null,
    };
  });

  return { days, has };
}
