import {
  Gender,
  UserRetreatRegistrationType,
  RetreatRegistrationScheduleType,
  UserRetreatRegistrationPaymentStatus,
  TRetreatRegistrationSchedule,
} from "@/types";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
// 날짜와 타입에 따라 식수 이름을 결정하는 함수
export function getScheduleLabel(
  time: Date,
  type: RetreatRegistrationScheduleType
): string {
  const date = time;
  const day = date.getDay();

  // 요일 접두사
  const dayPrefix = getDayPrefix(day);

  // 타입 접미사
  const typeSuffix = getTypeSuffix(type);

  return `${dayPrefix}${typeSuffix}`;
}

// 요일에 따른 접두사 반환
function getDayPrefix(day: number): string {
  switch (day) {
    case 0:
      return "주";
    case 1:
      return "월";
    case 2:
      return "화";
    case 3:
      return "수";
    case 4:
      return "목";
    case 5:
      return "금";
    case 6:
      return "토";
    default:
      return "";
  }
}

// 타입에 따른 접미사 반환
function getTypeSuffix(type: RetreatRegistrationScheduleType): string {
  switch (type) {
    case RetreatRegistrationScheduleType.BREAKFAST:
      return "아";
    case RetreatRegistrationScheduleType.LUNCH:
      return "점";
    case RetreatRegistrationScheduleType.DINNER:
      return "저";
    case RetreatRegistrationScheduleType.SLEEP:
      return "숙";
    default:
      return "";
  }
}

// 스케줄 ID를 기반으로 사용자의 스케줄 참여 여부를 확인하는 함수
export function hasSchedule(
  userSchedules: number[],
  scheduleId: number
): boolean {
  return userSchedules.includes(scheduleId);
}

// 부서별 통계 데이터 생성
export function generateDepartmentStats(registrations: any[]) {
  // 부서 목록 추출 (중복 제거)
  const departments = registrations
    .map(reg => reg.univGroupNumber)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a - b)
    .map(num => `${num}부`);

  // 상태별 카운트 초기화
  const stats = departments.map(dept => ({
    id: dept.replace("부", ""),
    label: dept,
    cells: {
      waiting: 0,
      confirmed: 0,
      new_family_request: 0,
      military_request: 0,
      refund_requested: 0,
      refund_completed: 0,
    },
  }));

  // 각 등록에 대해 상태별로 카운트
  registrations.forEach(reg => {
    const deptIndex = stats.findIndex(
      s => s.label === `${reg.univGroupNumber}부`
    );
    if (deptIndex === -1) return;

    switch (reg.paymentStatus) {
      case UserRetreatRegistrationPaymentStatus.PENDING:
        stats[deptIndex].cells.waiting++;
        break;
      case UserRetreatRegistrationPaymentStatus.PAID:
        stats[deptIndex].cells.confirmed++;
        break;
      case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
        stats[deptIndex].cells.new_family_request++;
        break;
      case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
        stats[deptIndex].cells.military_request++;
        break;
      case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
        stats[deptIndex].cells.refund_requested++;
        break;
      case UserRetreatRegistrationPaymentStatus.REFUNDED:
        stats[deptIndex].cells.refund_completed++;
        break;
    }
  });

  // 합계 계산
  const totals = {
    id: "total",
    label: "합계",
    cells: {
      waiting: stats.reduce((sum, dept) => sum + dept.cells.waiting, 0),
      confirmed: stats.reduce((sum, dept) => sum + dept.cells.confirmed, 0),
      new_family_request: stats.reduce(
        (sum, dept) => sum + dept.cells.new_family_request,
        0
      ),
      military_request: stats.reduce(
        (sum, dept) => sum + dept.cells.military_request,
        0
      ),
      refund_requested: stats.reduce(
        (sum, dept) => sum + dept.cells.refund_requested,
        0
      ),
      refund_completed: stats.reduce(
        (sum, dept) => sum + dept.cells.refund_completed,
        0
      ),
    },
  };

  return [...stats, totals];
}

// 부서별 계좌 현황 계산
export function calculateAccountStatus(
  registrations: any[],
  departmentNumber: number
) {
  const deptRegistrations = departmentNumber
    ? registrations.filter(reg => reg.univGroupNumber === departmentNumber)
    : registrations;

  // 예상 입금 금액 (입금 완료된 금액)
  const expectedIncome = deptRegistrations
    .filter(
      reg => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
    )
    .reduce((sum, reg) => sum + reg.price, 0);

  // 예상 출금 금액 (환불 완료된 금액)
  const expectedExpense = deptRegistrations
    .filter(
      reg => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.REFUNDED
    )
    .reduce((sum, reg) => sum + reg.price, 0);

  // 예상 잔액
  const expectedBalance = expectedIncome - expectedExpense;

  return {
    expectedIncome,
    expectedExpense,
    expectedBalance,
  };
}

// 스케줄 데이터를 기반으로 컬럼 생성
export function generateScheduleColumns(
  schedules: TRetreatRegistrationSchedule[]
) {
  if (!schedules || schedules.length === 0) return [];

  // 날짜별로 정렬
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  // 날짜별로 그룹화하여 색상 할당
  let currentDate = "";
  let colorIndex = -1;
  const colors = [
    {
      color: "rose",
      simpleColorClass: "bg-rose-500",
      bgClass:
        "data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500",
    },
    {
      color: "amber",
      simpleColorClass: "bg-amber-500",
      bgClass:
        "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500",
    },
    {
      color: "teal",
      simpleColorClass: "bg-teal-500",
      bgClass:
        "data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500",
    },
    {
      color: "indigo",
      simpleColorClass: "bg-indigo-500",
      bgClass:
        "data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500",
    },
  ];

  return sortedSchedules.map(schedule => {
    const scheduleDate = new Date(schedule.time).toDateString();
    const label = getScheduleLabel(
      new Date(schedule.time),
      schedule.type as RetreatRegistrationScheduleType
    );

    // 날짜가 바뀌면 색상 인덱스 증가
    if (scheduleDate !== currentDate) {
      currentDate = scheduleDate;
      colorIndex = (colorIndex + 1) % colors.length;
    }

    return {
      key: `schedule_${schedule.id}`,
      id: schedule.id,
      label,
      color: colors[colorIndex].color,
      simpleColorClass: colors[colorIndex].simpleColorClass,
      bgColorClass: colors[colorIndex].bgClass,
      time: schedule.time,
      type: schedule.type,
    };
  });
}

// 등록 데이터를 테이블 형식으로 변환
export function transformRegistrationsForTable(
  registrations: IUserRetreatRegistration[],
  schedules: TRetreatRegistrationSchedule[]
) {
  // 배열이 아닌 경우 빈 배열 반환
  if (!Array.isArray(registrations) || !Array.isArray(schedules)) {
    return [];
  }

  return registrations
    .map(reg => {
      if (!reg) return null;

      // 스케줄 변환
      const scheduleMap: Record<string, boolean> = {};

      if (Array.isArray(reg.userRetreatRegistrationScheduleIds)) {
        schedules.forEach(schedule => {
          scheduleMap[`schedule_${schedule.id}`] = hasSchedule(
            reg.userRetreatRegistrationScheduleIds,
            schedule.id
          );
        });
      }

      return {
        id: reg.id?.toString() || "",
        department:
          reg.univGroupNumber !== undefined
            ? `${reg.univGroupNumber}부`
            : "미지정",
        gender: reg.gender,
        grade: reg.gradeNumber?.toString() || "0",
        name: reg.name || "",
        schedule: scheduleMap,
        type: reg.userType || null,
        amount: reg.price || 0,
        createdAt: reg.createdAt || null,
        status: reg.paymentStatus,
        paymentConfirmedAt: reg.paymentConfirmedAt || null,
        confirmedBy: reg.paymentConfirmUserName || null,
      };
    })
    .filter(Boolean); // null 항목 제거
}

// 부서별 식수 일정 집계 데이터 생성
export function generateScheduleStats(
  registrations: any[],
  schedules: TRetreatRegistrationSchedule[]
) {
  if (!Array.isArray(registrations) || !Array.isArray(schedules)) {
    return [];
  }

  // 입금 완료된 등록만 집계 (PAID 상태)
  const paidRegistrations = registrations.filter(
    reg => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
  );

  // 부서 목록 추출 (입금완료자 기준, 중복 제거)
  const departments = paidRegistrations
    .map(reg => reg.univGroupNumber)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a - b)
    .map(num => `${num}부`);

  // 각 부서별 스케줄 카운트 초기화
  const stats = departments.map(dept => {
    const scheduleCount: Record<string, number> = {};

    // 각 스케줄에 대해 카운트 초기화
    schedules.forEach(schedule => {
      scheduleCount[`schedule_${schedule.id}`] = 0;
    });

    return {
      id: dept.replace("부", ""),
      label: dept,
      cells: scheduleCount,
    };
  });

  // 각 등록에 대해 스케줄별로 카운트
  paidRegistrations.forEach(reg => {
    const deptIndex = stats.findIndex(
      s => s.label === `${reg.univGroupNumber}부`
    );
    if (deptIndex === -1) return;

    // 사용자가 선택한 스케줄들에 대해 카운트 증가
    if (Array.isArray(reg.userRetreatRegistrationScheduleIds)) {
      reg.userRetreatRegistrationScheduleIds.forEach((scheduleId: number) => {
        const scheduleKey = `schedule_${scheduleId}`;
        if (stats[deptIndex].cells[scheduleKey] !== undefined) {
          stats[deptIndex].cells[scheduleKey]++;
        }
      });
    }
  });

  // 합계 계산
  const totals = {
    id: "total",
    label: "합계",
    cells: {} as Record<string, number>,
  };

  schedules.forEach(schedule => {
    const scheduleKey = `schedule_${schedule.id}`;
    totals.cells[scheduleKey] = stats.reduce(
      (sum, dept) => sum + dept.cells[scheduleKey],
      0
    );
  });

  return [...stats, totals];
}

// 스케줄 컬럼을 요일별로 그룹화
export function groupScheduleColumnsByDay(
  schedules: TRetreatRegistrationSchedule[]
) {
  if (!schedules || schedules.length === 0) return [];

  // 날짜별로 정렬
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  // 요일별로 그룹화
  const groupedByDay: Record<string, any[]> = {};

  sortedSchedules.forEach(schedule => {
    const date = new Date(schedule.time);
    const dayKey = getDayPrefix(date.getDay());
    const dayName = getDayName(date.getDay());

    if (!groupedByDay[dayName]) {
      groupedByDay[dayName] = [];
    }

    const label = getScheduleLabel(
      date,
      schedule.type as RetreatRegistrationScheduleType
    );

    groupedByDay[dayName].push({
      key: `schedule_${schedule.id}`,
      id: schedule.id,
      label: getTypeSuffix(schedule.type as RetreatRegistrationScheduleType),
      fullLabel: label,
      time: schedule.time,
      type: schedule.type,
    });
  });

  return Object.entries(groupedByDay).map(([dayName, schedules]) => ({
    dayName,
    schedules,
  }));
}

// 요일 이름 반환
function getDayName(day: number): string {
  switch (day) {
    case 0:
      return "주일";
    case 1:
      return "월요일";
    case 2:
      return "화요일";
    case 3:
      return "수요일";
    case 4:
      return "목요일";
    case 5:
      return "금요일";
    case 6:
      return "토요일";
    default:
      return "";
  }
}
