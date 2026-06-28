/**
 * GBS 엑셀 가져오기 — 시트 파싱 & 컬럼/헤더 감지 (순수 함수, React·I/O 없음).
 *
 * 기준 시트 `(꼬리표) 수양회GBS` 레이아웃:
 *   row0 빈 행, 헤더 = 어딘가의 한 행, 데이터는 그 다음부터, 컬럼은 보통 엑셀 B열부터.
 *   고정 헤더(좌→우): 리더, ID, 조번호, 부서, 학년, 성별, 이름, 연락처, 전참여부, 현리더, 새돌/군인/새가족
 *   그 뒤로 동적 스케줄 컬럼: 수점,수저,... (retreat 스케줄 순서와 동일)
 */
import {
  RetreatRegistrationScheduleType,
  TRetreatRegistrationSchedule,
} from "@/types";
import { getScheduleLabel } from "@/utils/retreat-utils";
import { ColumnLayout, ParsedSheetRow } from "./types";

/** ID(1)·새돌(10) 제외 모든 고정 헤더의 기대 위치 */
export const FIXED_HEADERS = [
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
const SKIP_HEADER_IDX = new Set([1, 10]); // ID, 새돌/군인/새가족 — 미사용
const SCHEDULE_START = 11;
const IDX_LEADER = 0;
const IDX_GBS = 2;
const IDX_UNIV = 3;
const IDX_GRADE = 4;
const IDX_NAME = 6;
const IDX_PHONE = 7;
const IDX_CUR_LEADER = 9;

const TYPE_ORDER: Record<string, number> = {
  [RetreatRegistrationScheduleType.BREAKFAST]: 0,
  [RetreatRegistrationScheduleType.LUNCH]: 1,
  [RetreatRegistrationScheduleType.DINNER]: 2,
  [RetreatRegistrationScheduleType.SLEEP]: 3,
};

export type SheetMatrix = (string | null)[][];

/** 서버 orderSchedules 미러: 시간 오름차순, 동시간이면 아침<점심<저녁<숙박 */
export function orderSchedules(
  schedules: TRetreatRegistrationSchedule[]
): TRetreatRegistrationSchedule[] {
  return [...schedules].sort((a, b) => {
    const ta = new Date(a.time).getTime();
    const tb = new Date(b.time).getTime();
    if (ta !== tb) return ta - tb;
    return (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
  });
}

export function buildScheduleLabels(
  schedules: TRetreatRegistrationSchedule[]
): { labels: string[]; labelToId: Map<string, number>; idToLabel: Map<number, string> } {
  const ordered = orderSchedules(schedules);
  const labels: string[] = [];
  const labelToId = new Map<string, number>();
  const idToLabel = new Map<number, string>();
  for (const s of ordered) {
    const label = getScheduleLabel(s.time, s.type);
    labels.push(label);
    labelToId.set(label, s.id);
    idToLabel.set(s.id, label);
  }
  return { labels, labelToId, idToLabel };
}

const cell = (matrix: SheetMatrix, r: number, c: number): string =>
  (matrix[r]?.[c] ?? "").toString().trim();

/**
 * 부서 셀 파싱. "2부" / "2" 모두 허용 → 숫자(2)만 추출.
 * 숫자가 없으면 NaN (이후 매칭에서 미발견 처리).
 */
const parseUnivGroupNumber = (raw: string): number => {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits === "" ? NaN : Number(digits);
};

const parseLeaderFlag = (raw: string): boolean => {
  if (raw === "") return false;
  const value = Number(raw);
  return !Number.isNaN(value) && value > 0;
};

/**
 * 컬럼/헤더 감지 + 파일 형식(카테고리1) 검증.
 * 반환: layout(성공 시) 또는 errors(파일 형식 오류).
 */
export function detectLayout(
  matrix: SheetMatrix,
  schedules: TRetreatRegistrationSchedule[]
): { layout: ColumnLayout | null; errors: string[] } {
  const errors: string[] = [];

  // 1) 헤더 행 찾기 (앞 8행 중 "조번호" && "이름" && "연락처" 포함)
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(matrix.length, 8); r++) {
    const rowVals = (matrix[r] ?? []).map((v) => (v ?? "").toString().trim());
    if (
      rowVals.includes("조번호") &&
      rowVals.includes("이름") &&
      rowVals.includes("연락처")
    ) {
      headerRowIndex = r;
      break;
    }
  }
  if (headerRowIndex < 0) {
    errors.push(
      "헤더 행을 찾을 수 없습니다. '조번호','이름','연락처' 헤더가 있는 시트인지 확인하세요."
    );
    return { layout: null, errors };
  }

  // 2) colOffset = "리더" 위치
  const headerRow = (matrix[headerRowIndex] ?? []).map((v) =>
    (v ?? "").toString().trim()
  );
  const colOffset = headerRow.indexOf("리더");
  if (colOffset < 0) {
    errors.push("'리더' 헤더 컬럼을 찾을 수 없습니다.");
    return { layout: null, errors };
  }

  // 고정 헤더 위치 검증 (ID, 새돌 제외)
  for (let k = 0; k < FIXED_HEADERS.length; k++) {
    if (SKIP_HEADER_IDX.has(k)) continue;
    const found = cell(matrix, headerRowIndex, colOffset + k);
    if (found !== FIXED_HEADERS[k]) {
      errors.push(
        `컬럼 위치 오류: ${k + 1}번째 열은 '${FIXED_HEADERS[k]}' 여야 하는데 '${
          found || "(빈칸)"
        }' 입니다.`
      );
    }
  }

  // 3) 스케줄 컬럼 라벨 추출 (colOffset+11 부터 연속 비어있지 않은 끝까지)
  const sheetScheduleLabels: string[] = [];
  for (let c = colOffset + SCHEDULE_START; c < headerRow.length; c++) {
    const label = cell(matrix, headerRowIndex, c);
    if (!label) break;
    sheetScheduleLabels.push(label);
  }

  const expected = buildScheduleLabels(schedules).labels;
  if (sheetScheduleLabels.length !== expected.length) {
    errors.push(
      `스케줄 컬럼 개수가 다릅니다. 기대: ${expected.length}개(${expected.join(
        ","
      )}), 시트: ${sheetScheduleLabels.length}개(${sheetScheduleLabels.join(
        ","
      )}).`
    );
  } else {
    for (let i = 0; i < expected.length; i++) {
      if (sheetScheduleLabels[i] !== expected[i]) {
        errors.push(
          `스케줄 컬럼 순서/이름 오류: ${i + 1}번째 일정 열은 '${
            expected[i]
          }' 여야 하는데 '${sheetScheduleLabels[i]}' 입니다.`
        );
      }
    }
  }

  if (errors.length > 0) {
    return { layout: null, errors };
  }

  const noColIndex = headerRow.indexOf("No.");

  return {
    layout: {
      headerRowIndex,
      colOffset,
      scheduleLabelsInOrder: sheetScheduleLabels,
      noColIndex: noColIndex >= 0 ? noColIndex : null,
    },
    errors: [],
  };
}

export function normalizePhone(phone: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function buildMatchKey(
  univGroupNumber: number | string,
  gradeNumber: number | string,
  name: string,
  phoneNorm: string
): string {
  return `${univGroupNumber}|${gradeNumber}|${(name ?? "").trim()}|${phoneNorm}`;
}

/**
 * 헤더 감지 후 데이터 행 파싱. 이름 빈칸 행은 패딩으로 skip.
 */
export function parseSheetRows(
  matrix: SheetMatrix,
  layout: ColumnLayout,
  schedules: TRetreatRegistrationSchedule[]
): ParsedSheetRow[] {
  const { labelToId } = buildScheduleLabels(schedules);
  const { headerRowIndex, colOffset, scheduleLabelsInOrder } = layout;
  const rows: ParsedSheetRow[] = [];

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const name = cell(matrix, r, colOffset + IDX_NAME);
    if (!name) continue; // 패딩/빈 행

    const gbsRaw = cell(matrix, r, colOffset + IDX_GBS);
    const gbsNumber = gbsRaw === "" ? null : Number(gbsRaw);

    const univGroupNumber = parseUnivGroupNumber(
      cell(matrix, r, colOffset + IDX_UNIV)
    );
    const gradeNumber = Number(cell(matrix, r, colOffset + IDX_GRADE));
    const phoneRaw = cell(matrix, r, colOffset + IDX_PHONE);
    const phoneNorm = normalizePhone(phoneRaw);
    const isLeaderFlag = parseLeaderFlag(
      cell(matrix, r, colOffset + IDX_LEADER)
    );
    const currentLeaderName = cell(matrix, r, colOffset + IDX_CUR_LEADER);

    let lineupNumber: number | null = null;
    if (layout.noColIndex != null) {
      const raw = cell(matrix, r, layout.noColIndex);
      const n = raw === "" ? null : Number(raw);
      lineupNumber = n != null && !Number.isNaN(n) ? n : null;
    }

    const selectedScheduleIds = new Set<number>();
    for (let i = 0; i < scheduleLabelsInOrder.length; i++) {
      const v = cell(matrix, r, colOffset + SCHEDULE_START + i);
      if (v === "1") {
        const id = labelToId.get(scheduleLabelsInOrder[i]);
        if (id != null) selectedScheduleIds.add(id);
      }
    }

    rows.push({
      excelRow: r + 1,
      isLeaderFlag,
      gbsNumber: gbsNumber != null && Number.isNaN(gbsNumber) ? null : gbsNumber,
      univGroupNumber,
      gradeNumber,
      name,
      phoneRaw,
      phoneNorm,
      currentLeaderName,
      lineupNumber,
      selectedScheduleIds,
      matchKey: buildMatchKey(univGroupNumber, gradeNumber, name, phoneNorm),
    });
  }

  return rows;
}
