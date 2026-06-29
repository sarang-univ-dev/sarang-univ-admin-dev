import {
  Gender,
  RetreatShuttleBusDirection,
  TRetreatShuttleBus,
  UserRetreatShuttleBusPaymentStatus,
} from "@/types";
import type { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";
import { getShuttleBusImportColumnLabel } from "@/utils/shuttle-bus-excel/labels";
import { parseShuttleBusRegistrationSheet } from "@/utils/shuttle-bus-excel/parse";
import type { ShuttleBusExcelUnivGroup } from "@/utils/shuttle-bus-excel/types";

const SCHEDULES: TRetreatShuttleBus[] = [
  {
    id: 11,
    retreatId: 7,
    name: "출발 1호차",
    direction: RetreatShuttleBusDirection.FROM_CHURCH_TO_RETREAT,
    price: 10000,
    departureTime: new Date("2026-08-05T03:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    id: 12,
    retreatId: 7,
    name: "복귀 1호차",
    direction: RetreatShuttleBusDirection.FROM_RETREAT_TO_CHURCH,
    price: 10000,
    departureTime: new Date("2026-08-08T03:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
  },
];

const UNIV_GROUP_AND_GRADE: ShuttleBusExcelUnivGroup[] = [
  {
    univGroupId: 2,
    univGroupName: "2부",
    univGroupNumber: 2,
    grades: [
      { gradeId: 21, gradeName: "1학년", gradeNumber: 1 },
      { gradeId: 22, gradeName: "2학년", gradeNumber: 2 },
    ],
  },
];

const BASE_MATRIX = [
  [
    "부서",
    "성별",
    "학년",
    "이름",
    "전화번호",
    getShuttleBusImportColumnLabel(SCHEDULES[0]),
    getShuttleBusImportColumnLabel(SCHEDULES[1]),
  ],
];

const LEGACY_ID_HEADER_MATRIX = [
  [
    "이름",
    "전화번호",
    "성별",
    "부서",
    "학년",
    "버스 11: 출발",
    "버스 12: 복귀",
  ],
];

function existingRegistration(
  name: string,
  userPhoneNumber: string
): IShuttleBusPaymentConfirmationRegistration {
  return {
    id: 1,
    univGroupNumber: 2,
    gender: Gender.MALE,
    gradeNumber: 1,
    name,
    userPhoneNumber,
    price: 10000,
    userRetreatShuttleBusRegistrationScheduleIds: [11],
    isAdminContact: false,
    shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus.PENDING,
    createdAt: "",
  };
}

describe("parseShuttleBusRegistrationSheet", () => {
  it("validates and normalizes rows from the shuttle bus template", () => {
    const result = parseShuttleBusRegistrationSheet({
      matrix: [
        ...BASE_MATRIX,
        ["2부", "남", "1학년", "김바울", "01010000001", "1", "Y"],
      ],
      schedules: SCHEDULES,
      univGroupAndGrade: UNIV_GROUP_AND_GRADE,
      existingRegistrations: [],
    });

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      excelRow: 2,
      name: "김바울",
      phoneNumber: "010-1000-0001",
      gender: Gender.MALE,
      univGroupNumber: 2,
      gradeNumber: 1,
      gradeId: 21,
      shuttleBusIds: [11, 12],
    });
  });

  it("still accepts legacy bus-id headers", () => {
    const result = parseShuttleBusRegistrationSheet({
      matrix: [
        ...LEGACY_ID_HEADER_MATRIX,
        ["김바울", "01010000001", "남", "2부", "1학년", "1", "Y"],
      ],
      schedules: SCHEDULES,
      univGroupAndGrade: UNIV_GROUP_AND_GRADE,
      existingRegistrations: [],
    });

    expect(result.errors).toEqual([]);
    expect(result.rows[0].shuttleBusIds).toEqual([11, 12]);
  });

  it("blocks duplicate people inside the sheet", () => {
    const result = parseShuttleBusRegistrationSheet({
      matrix: [
        ...BASE_MATRIX,
        ["2부", "남", "1", "김바울", "010-1000-0001", "1", ""],
        ["2부", "남", "1", "김바울", "010-1000-0001", "", "1"],
      ],
      schedules: SCHEDULES,
      univGroupAndGrade: UNIV_GROUP_AND_GRADE,
      existingRegistrations: [],
    });

    expect(result.errors.join(" ")).toContain("같은 이름/전화번호");
    expect(result.rows).toHaveLength(1);
  });

  it("excludes rows that already exist in current shuttle bus registrations", () => {
    const result = parseShuttleBusRegistrationSheet({
      matrix: [
        ...BASE_MATRIX,
        ["2부", "남", "1", "김바울", "010-1000-0001", "1", ""],
      ],
      schedules: SCHEDULES,
      univGroupAndGrade: UNIV_GROUP_AND_GRADE,
      existingRegistrations: [existingRegistration("김바울", "01010000001")],
    });

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(0);
    expect(result.excludedRows).toHaveLength(1);
    expect(result.excludedRows[0]).toMatchObject({
      excelRow: 2,
      name: "김바울",
      phoneNumber: "010-1000-0001",
      reason: "EXISTING_REGISTRATION",
      reasonText: "이미 셔틀버스 신청이 있어 제외됩니다.",
    });
  });

  it("requires at least one shuttle bus selection per row", () => {
    const result = parseShuttleBusRegistrationSheet({
      matrix: [
        ...BASE_MATRIX,
        ["2부", "남", "1", "김바울", "010-1000-0001", "", ""],
      ],
      schedules: SCHEDULES,
      univGroupAndGrade: UNIV_GROUP_AND_GRADE,
      existingRegistrations: [],
    });

    expect(result.errors.join(" ")).toContain("셔틀버스");
    expect(result.rows).toHaveLength(0);
  });
});
