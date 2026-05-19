/**
 * 신청 현황 통계 계산 유틸리티
 *
 * 신청 시각 기준으로 일별/주별 통계를 계산합니다.
 * - 리더/조원 구분: name === currentLeaderName이면 리더
 * - 시간대: KST (한국 표준시) 기준
 * - 주별 범위: 일요일 시작, 토요일 종료 기준
 */

/**
 * 신청 데이터 타입 (통계 계산용 최소 필드)
 */
export interface RegistrationForStats {
  name: string;
  currentLeaderName?: string | null;
  createdAt: string;
  univGroupNumber?: number;
}

/**
 * 통계 데이터 타입
 */
export interface RegistrationStats {
  /** YYYY-MM-DD 형식. 주별 통계에서는 주일 날짜를 사용 */
  date: string;
  /** 표시용 라벨 (1/15, 1/14~1/20 등) */
  label: string;
  /** 리더 수 */
  leaders: number;
  /** 조원 수 */
  members: number;
  /** 합계 */
  total: number;
  /** 누적 리더 수 */
  cumulativeLeaders: number;
  /** 누적 조원 수 */
  cumulativeMembers: number;
  /** 누적 합계 */
  cumulativeTotal: number;
}

/**
 * 리더 여부 확인
 */
export function isLeader(
  name: string,
  currentLeaderName?: string | null
): boolean {
  if (!currentLeaderName) return false;
  return name === currentLeaderName;
}

/**
 * KST 기준 날짜 키 생성 (YYYY-MM-DD)
 */
export function getDateKey(createdAt: string): string {
  const date = new Date(createdAt);
  // KST 오프셋 적용 (UTC+9)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().split("T")[0];
}

/**
 * KST 기준 주 키 생성 (YYYY-MM-DD)
 * 해당 주의 주일 날짜를 키로 사용합니다.
 */
export function getWeekKey(createdAt: string): string {
  const dateKey = getDateKey(createdAt);
  const kstDay = new Date(`${dateKey}T00:00:00.000Z`);
  const day = kstDay.getUTCDay();
  kstDay.setUTCDate(kstDay.getUTCDate() - day);
  return kstDay.toISOString().split("T")[0];
}

/**
 * 날짜 범위 내 모든 날짜 생성 (빈 날짜 채우기용)
 */
function getAllDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 주 범위 내 모든 주 생성 (빈 주 채우기용)
 */
function getAllWeeksInRange(startWeek: string, endWeek: string): string[] {
  const weeks: string[] = [];
  const current = new Date(`${startWeek}T00:00:00.000Z`);
  const end = new Date(`${endWeek}T00:00:00.000Z`);

  while (current <= end) {
    weeks.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 7);
  }

  return weeks;
}

/**
 * 날짜 키를 표시용 라벨로 변환 (1/15 형식)
 */
function formatDateLabel(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * 주 키를 표시용 라벨로 변환 (주일~토요일 날짜 범위)
 */
export function formatWeekLabel(weekKey: string): string {
  const weekEndKey = addDays(weekKey, 6);
  return `${formatDateLabel(weekKey)}~${formatDateLabel(weekEndKey)}`;
}

/**
 * 일별 통계 계산
 */
export function calculateDailyStats(
  registrations: RegistrationForStats[],
  departmentFilter?: number | "all"
): RegistrationStats[] {
  // 부서 필터링
  const filtered =
    departmentFilter && departmentFilter !== "all"
      ? registrations.filter((r) => r.univGroupNumber === departmentFilter)
      : registrations;

  if (filtered.length === 0) {
    return [];
  }

  // 날짜별 그룹핑
  const dailyMap = new Map<string, { leaders: number; members: number }>();

  filtered.forEach((reg) => {
    const dateKey = getDateKey(reg.createdAt);
    const current = dailyMap.get(dateKey) || { leaders: 0, members: 0 };

    if (isLeader(reg.name, reg.currentLeaderName)) {
      current.leaders++;
    } else {
      current.members++;
    }

    dailyMap.set(dateKey, current);
  });

  // 날짜 범위 확인 및 빈 날짜 채우기
  const sortedDates = Array.from(dailyMap.keys()).sort();
  if (sortedDates.length === 0) return [];

  const allDates = getAllDatesInRange(
    sortedDates[0],
    sortedDates[sortedDates.length - 1]
  );

  // 누적 계산과 함께 결과 생성
  let cumulativeLeaders = 0;
  let cumulativeMembers = 0;

  return allDates.map((dateKey) => {
    const dayData = dailyMap.get(dateKey) || { leaders: 0, members: 0 };
    cumulativeLeaders += dayData.leaders;
    cumulativeMembers += dayData.members;

    return {
      date: dateKey,
      label: formatDateLabel(dateKey),
      leaders: dayData.leaders,
      members: dayData.members,
      total: dayData.leaders + dayData.members,
      cumulativeLeaders,
      cumulativeMembers,
      cumulativeTotal: cumulativeLeaders + cumulativeMembers,
    };
  });
}

/**
 * 주별 통계 계산
 */
export function calculateWeeklyStats(
  registrations: RegistrationForStats[],
  departmentFilter?: number | "all"
): RegistrationStats[] {
  // 부서 필터링
  const filtered =
    departmentFilter && departmentFilter !== "all"
      ? registrations.filter((r) => r.univGroupNumber === departmentFilter)
      : registrations;

  if (filtered.length === 0) {
    return [];
  }

  // 주별 그룹핑
  const weeklyMap = new Map<string, { leaders: number; members: number }>();

  filtered.forEach((reg) => {
    const weekKey = getWeekKey(reg.createdAt);
    const current = weeklyMap.get(weekKey) || { leaders: 0, members: 0 };

    if (isLeader(reg.name, reg.currentLeaderName)) {
      current.leaders++;
    } else {
      current.members++;
    }

    weeklyMap.set(weekKey, current);
  });

  // 주 범위 확인 및 빈 주 채우기
  const sortedWeeks = Array.from(weeklyMap.keys()).sort();
  if (sortedWeeks.length === 0) return [];

  const allWeeks = getAllWeeksInRange(
    sortedWeeks[0],
    sortedWeeks[sortedWeeks.length - 1]
  );

  // 누적 계산과 함께 결과 생성
  let cumulativeLeaders = 0;
  let cumulativeMembers = 0;

  return allWeeks.map((weekKey) => {
    const weekData = weeklyMap.get(weekKey) || { leaders: 0, members: 0 };
    cumulativeLeaders += weekData.leaders;
    cumulativeMembers += weekData.members;

    return {
      date: weekKey,
      label: formatWeekLabel(weekKey),
      leaders: weekData.leaders,
      members: weekData.members,
      total: weekData.leaders + weekData.members,
      cumulativeLeaders,
      cumulativeMembers,
      cumulativeTotal: cumulativeLeaders + cumulativeMembers,
    };
  });
}

/**
 * 부서 목록 추출 (드롭다운용)
 */
export function getUniqueDepartments(
  registrations: RegistrationForStats[]
): number[] {
  const departments = new Set<number>();
  registrations.forEach((reg) => {
    if (reg.univGroupNumber) {
      departments.add(reg.univGroupNumber);
    }
  });
  return Array.from(departments).sort((a, b) => a - b);
}
