/**
 * GBS 엑셀 가져오기 — 파싱/검증 순수 함수 단위 테스트.
 *
 * detectLayout(레이아웃·파일형식) → parseSheetRows(행 파싱) → runValidation(검증)
 * 의 핵심 분기를 DB·React 없이 검증한다. (서버 test/.../bulk-gbs.test.ts 와 동일 스타일)
 */
import {
  RetreatRegistrationScheduleType,
  TRetreatRegistrationSchedule,
} from "@/types";
import type { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import {
  buildScheduleLabels,
  detectLayout,
  orderSchedules,
  parseSheetRows,
  SheetMatrix,
} from "@/utils/gbs-excel/parse";
import { runValidation } from "@/utils/gbs-excel/validate";
import { ColumnLayout } from "@/utils/gbs-excel/types";

const { BREAKFAST, LUNCH, DINNER, SLEEP } = RetreatRegistrationScheduleType;

// ── 스케줄 픽스처 (수점/수저/수숙/목아 4개) ──
const SCHEDULES: TRetreatRegistrationSchedule[] = [
  { id: 31, retreatId: 7, time: new Date("2026-08-05T03:00:00Z"), type: LUNCH, createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: 32, retreatId: 7, time: new Date("2026-08-05T09:00:00Z"), type: DINNER, createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: 33, retreatId: 7, time: new Date("2026-08-05T13:00:00Z"), type: SLEEP, createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: 34, retreatId: 7, time: new Date("2026-08-06T00:00:00Z"), type: BREAKFAST, createdAt: new Date("2026-01-01T00:00:00Z") },
];

const { labels: SCHED_LABELS } = buildScheduleLabels(SCHEDULES);
const SCHED_IDS = orderSchedules(SCHEDULES).map((s) => s.id);
const ALL_SCHED = [...SCHED_IDS];

const FIXED_HEADERS = [
  "리더",
  "ID",
  "조번호",
  "부서",
  "학년",
  "성별",
  "이름",
  "연락처",
  "전참여부",
  "현리더",
  "새돌/군인/새가족",
];

// ── DB(명단) 픽스처 — 입금확인 라인업. 초기 gbsNumber 는 null ──
function lineup(
  p: Partial<IUserRetreatGBSLineup> &
    Pick<
      IUserRetreatGBSLineup,
      "id" | "univGroupNumber" | "gradeNumber" | "name" | "phoneNumber"
    >
): IUserRetreatGBSLineup {
  return {
    gbsNumber: null,
    totalCount: 0,
    maleCount: 0,
    femaleCount: 0,
    fullAttendanceCount: 0,
    partialAttendanceCount: 0,
    userId: p.id * 10,
    univGroupId: 0,
    gradeId: 0,
    gender: "MALE",
    isLeader: false,
    gbsMemo: "",
    lineupMemo: "",
    lineupMemoId: null,
    lineupMemocolor: "",
    isFullAttendance: true,
    currentLeader: "",
    userType: null,
    userRetreatRegistrationScheduleIds: ALL_SCHED,
    createdAt: "",
    ...p,
  } as IUserRetreatGBSLineup;
}

const LINEUPS: IUserRetreatGBSLineup[] = [
  lineup({ id: 1, univGroupNumber: 2, gradeNumber: 4, name: "김바울", phoneNumber: "010-1000-0001", gender: "MALE" }),
  lineup({ id: 2, univGroupNumber: 2, gradeNumber: 1, name: "이디모데", phoneNumber: "010-1000-0002", gender: "MALE" }),
  lineup({ id: 3, univGroupNumber: 5, gradeNumber: 2, name: "박마리아", phoneNumber: "010-1000-0003", gender: "FEMALE" }),
  lineup({ id: 4, univGroupNumber: 6, gradeNumber: 3, name: "최누가", phoneNumber: "010-1000-0004", gender: "MALE", userRetreatRegistrationScheduleIds: [31, 32] }),
];

// ── 시트 행/매트릭스 빌더 ──
interface SheetPerson {
  leader?: boolean;
  gbs?: number | null;
  dep: number;
  grade: number;
  gender?: string;
  name: string;
  phone: string;
  curLeader?: string;
  scheduleIds?: number[];
}

function schedCells(ids: number[]): string[] {
  return SCHED_IDS.map((id) => (ids.includes(id) ? "1" : "0"));
}

function rowCells(p: SheetPerson): (string | null)[] {
  return [
    p.leader ? "1" : "0",
    p.phone, // ID 컬럼(미사용)
    p.gbs == null ? "" : String(p.gbs),
    String(p.dep),
    String(p.grade),
    p.gender ?? "남",
    p.name,
    p.phone,
    "전참",
    p.curLeader ?? "",
    "",
    ...schedCells(p.scheduleIds ?? ALL_SCHED),
  ];
}

/** 기준 시트와 동일하게 A열 비우고(B열부터) row0 빈 행 + row1 헤더로 매트릭스 구성 */
function sheetMatrix(
  rows: (string | null)[][],
  mutateHeader?: (h: string[]) => string[]
): SheetMatrix {
  let header = [...FIXED_HEADERS, ...SCHED_LABELS];
  if (mutateHeader) header = mutateHeader(header);
  const m: SheetMatrix = [];
  m.push([]); // row0 빈 행
  m.push([null, ...header]); // row1 헤더 (B열부터)
  for (const r of rows) m.push([null, ...r]);
  return m;
}

/** detectLayout 성공 가정하고 layout 만 꺼내는 헬퍼 */
function layoutOf(matrix: SheetMatrix): ColumnLayout {
  const { layout, errors } = detectLayout(matrix, SCHEDULES);
  if (!layout) throw new Error(`layout 감지 실패: ${errors.join("; ")}`);
  return layout;
}

// GBS 101 에 4명 모두 배정하는 "정상" 시트
const VALID_PEOPLE: SheetPerson[] = [
  { leader: true, gbs: 101, dep: 2, grade: 4, name: "김바울", phone: "010-1000-0001", curLeader: "김바울" },
  { leader: false, gbs: 101, dep: 2, grade: 1, name: "이디모데", phone: "010-1000-0002", curLeader: "김바울" },
  { leader: false, gbs: 101, dep: 5, grade: 2, name: "박마리아", phone: "010-1000-0003", curLeader: "김바울" },
  { leader: false, gbs: 101, dep: 6, grade: 3, name: "최누가", phone: "010-1000-0004", curLeader: "김바울", scheduleIds: [31, 32] },
];

function validate(people: SheetPerson[]) {
  const matrix = sheetMatrix(people.map(rowCells));
  const { layout, errors } = detectLayout(matrix, SCHEDULES);
  const parsedRows = layout ? parseSheetRows(matrix, layout, SCHEDULES) : [];
  return runValidation({
    parsedRows,
    fileFormatErrors: errors,
    lineups: LINEUPS,
    schedules: SCHEDULES,
    hasLineupColumn: layout?.noColIndex != null,
  });
}

describe("detectLayout", () => {
  it("정상 시트는 layout 을 반환하고 스케줄 라벨 순서가 일치한다", () => {
    const { layout, errors } = detectLayout(
      sheetMatrix(VALID_PEOPLE.map(rowCells)),
      SCHEDULES
    );
    expect(errors).toEqual([]);
    expect(layout).not.toBeNull();
    expect(layout!.colOffset).toBe(1);
    expect(layout!.scheduleLabelsInOrder).toEqual(SCHED_LABELS);
  });

  it("고정 헤더가 어긋나면 파일 형식 오류를 낸다", () => {
    const { layout, errors } = detectLayout(
      sheetMatrix(VALID_PEOPLE.map(rowCells), (h) => {
        h[3] = "부써"; // '부서' 오타
        return h;
      }),
      SCHEDULES
    );
    expect(layout).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it("스케줄 컬럼 개수가 다르면 오류를 낸다", () => {
    const { layout, errors } = detectLayout(
      sheetMatrix(VALID_PEOPLE.map(rowCells), (h) => h.slice(0, h.length - 1)),
      SCHEDULES
    );
    expect(layout).toBeNull();
    expect(errors.join(" ")).toContain("스케줄 컬럼");
  });
});

describe("parseSheetRows", () => {
  it("데이터 행을 파싱하고 이름 빈칸(패딩)은 건너뛴다", () => {
    const rows = [...VALID_PEOPLE.map(rowCells)];
    // 이름 빈칸 패딩 행 추가
    rows.push(rowCells({ dep: 2, grade: 1, name: "", phone: "010-0000-0000" }));
    const matrix = sheetMatrix(rows);
    const parsed = parseSheetRows(matrix, layoutOf(matrix), SCHEDULES);
    expect(parsed).toHaveLength(VALID_PEOPLE.length);
  });

  it("조번호 빈칸은 null, 부분참 행은 선택 일정만 집합에 담는다", () => {
    const matrix = sheetMatrix([
      rowCells({ gbs: null, dep: 2, grade: 1, name: "이디모데", phone: "010-1000-0002" }),
      rowCells({ gbs: 101, dep: 6, grade: 3, name: "최누가", phone: "010-1000-0004", scheduleIds: [31, 32] }),
    ]);
    const parsed = parseSheetRows(matrix, layoutOf(matrix), SCHEDULES);
    expect(parsed[0].gbsNumber).toBeNull();
    expect(parsed[1].gbsNumber).toBe(101);
    expect([...parsed[1].selectedScheduleIds].sort()).toEqual([31, 32]);
  });

  it("리더 플래그는 0보다 큰 숫자만 true 로 파싱한다", () => {
    const leaderOne = rowCells({ gbs: 101, dep: 2, grade: 4, name: "김바울", phone: "010-1000-0001" });
    const leaderTwo = rowCells({ gbs: 101, dep: 2, grade: 1, name: "이디모데", phone: "010-1000-0002" });
    const notLeaderZero = rowCells({ gbs: 101, dep: 5, grade: 2, name: "박마리아", phone: "010-1000-0003" });
    const notLeaderBlank = rowCells({ gbs: 101, dep: 6, grade: 3, name: "최누가", phone: "010-1000-0004" });

    leaderOne[0] = "1";
    leaderTwo[0] = "2";
    notLeaderZero[0] = "0";
    notLeaderBlank[0] = "";

    const matrix = sheetMatrix([
      leaderOne,
      leaderTwo,
      notLeaderZero,
      notLeaderBlank,
    ]);
    const parsed = parseSheetRows(matrix, layoutOf(matrix), SCHEDULES);

    expect(parsed.map((row) => row.isLeaderFlag)).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});

describe("runValidation", () => {
  it("정상 시트: 차단 없음, 4명 적용, 경고 없음", () => {
    const r = validate(VALID_PEOPLE);
    expect(r.blockingCategory).toBeNull();
    expect(r.assignments).toHaveLength(4);
    expect(r.hasWarnings).toBe(false);
    // 리더 플래그/현리더가 payload 에 그대로 반영
    const leader = r.assignments.find((a) => a.userRetreatRegistrationId === 1);
    expect(leader).toMatchObject({ gbsNumber: 101, isLeader: true, currentLeaderName: "김바울" });
  });

  it("카테고리2(시트 내 중복): 같은 사람 2행 → blockingCategory 2", () => {
    const r = validate([...VALID_PEOPLE, VALID_PEOPLE[1]]);
    expect(r.blockingCategory).toBe(2);
    expect(r.sheetDuplicates).toHaveLength(2);
  });

  it("카테고리3(미매칭): 명단에 없는 인원 → blockingCategory 3", () => {
    const r = validate([
      ...VALID_PEOPLE,
      { leader: false, gbs: 101, dep: 7, grade: 1, name: "황솔로몬", phone: "010-9999-7777", curLeader: "김바울" },
    ]);
    expect(r.blockingCategory).toBe(3);
    expect(r.unmatchedSheetPeople).toHaveLength(1);
    expect(r.unmatchedSheetPeople[0].name).toBe("황솔로몬");
  });

  it("카테고리6(일정 불일치): 시트 선택 일정 ≠ 명단 → blockingCategory 6", () => {
    const people = VALID_PEOPLE.map((p) =>
      p.name === "박마리아" ? { ...p, scheduleIds: [31] } : p
    );
    const r = validate(people);
    expect(r.blockingCategory).toBe(6);
    expect(r.scheduleMismatches).toHaveLength(1);
    expect(r.scheduleMismatches[0].name).toBe("박마리아");
  });

  it("카테고리4(시트 누락): 명단에 있으나 시트에 없는 인원 → 경고, 적용 제외", () => {
    const r = validate(VALID_PEOPLE.filter((p) => p.name !== "최누가"));
    expect(r.blockingCategory).toBeNull();
    expect(r.hasWarnings).toBe(true);
    expect(r.missingDbRegistrants.map((p) => p.name)).toEqual(["최누가"]);
    expect(r.assignments).toHaveLength(3);
  });

  it("카테고리5(조번호 빈칸): 매칭됐으나 조번호 없음 → 경고, 적용 제외", () => {
    const people = VALID_PEOPLE.map((p) =>
      p.name === "최누가" ? { ...p, gbs: null } : p
    );
    const r = validate(people);
    expect(r.blockingCategory).toBeNull();
    expect(r.hasWarnings).toBe(true);
    expect(r.matchedButNoGbs.map((p) => p.name)).toEqual(["최누가"]);
    expect(r.assignments).toHaveLength(3);
  });

  it("변경 내역(경고): GBS 번호 변경이 changeWarnings 에 기록된다", () => {
    const r = validate(VALID_PEOPLE);
    // DB gbsNumber=null → 시트 101 이므로 전원 GBS 변경 기록
    expect(r.changeWarnings.length).toBeGreaterThan(0);
    const kim = r.changeWarnings.find((w) => w.name === "김바울");
    expect(kim?.changes.join(" ")).toContain("GBS");
  });

  it("새로 생성될 GBS 번호를 newGbsNumbers 로 안내한다", () => {
    const r = validate(VALID_PEOPLE);
    expect(r.newGbsNumbers).toEqual([101]);
  });
});
