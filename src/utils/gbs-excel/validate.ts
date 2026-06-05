/**
 * GBS 엑셀 가져오기 검증 (순수 함수).
 *
 * 차단(제출 불가): 1.파일형식 · 2.시트내 중복 · 3.시트에 있으나 명단(DB) 없음 · 6.일정 불일치
 * 경고(확인 체크 시 제출 가능): 4.명단(DB)에 있으나 시트 없음 · 5.조번호 빈칸
 * 정보: GBS/리더 변경 내역
 */
import type { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import { TRetreatRegistrationSchedule } from "@/types";
import { buildMatchKey, normalizePhone } from "./parse";
import {
  AssignmentPayloadItem,
  ChangeWarning,
  ParsedSheetRow,
  PersonRef,
  ScheduleMismatchRow,
  ValidationResult,
} from "./types";

function sameScheduleSet(sheet: Set<number>, db: number[]): boolean {
  if (sheet.size !== db.length) return false;
  for (const id of db) if (!sheet.has(id)) return false;
  return true;
}

function emptyResult(): ValidationResult {
  return {
    fileFormatErrors: [],
    sheetDuplicates: [],
    unmatchedSheetPeople: [],
    missingDbRegistrants: [],
    matchedButNoGbs: [],
    scheduleMismatches: [],
    changeWarnings: [],
    blockingCategory: null,
    hasWarnings: false,
    assignments: [],
    newGbsNumbers: [],
  };
}

export function runValidation(input: {
  parsedRows: ParsedSheetRow[];
  fileFormatErrors: string[];
  lineups: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
}): ValidationResult {
  const { parsedRows, fileFormatErrors, lineups, schedules } = input;
  const result = emptyResult();

  // ── 카테고리1: 파일 형식 (🔒 비우회) ──
  if (fileFormatErrors.length > 0) {
    result.fileFormatErrors = fileFormatErrors;
    result.blockingCategory = 1;
    return result;
  }

  // ── 카테고리2: 시트 내 중복 레코드 (🔒 비우회) ──
  const byKey = new Map<string, ParsedSheetRow[]>();
  for (const row of parsedRows) {
    if (!byKey.has(row.matchKey)) byKey.set(row.matchKey, []);
    byKey.get(row.matchKey)!.push(row);
  }
  const duplicates: PersonRef[] = [];
  for (const group of byKey.values()) {
    if (group.length > 1) {
      for (const row of group) {
        duplicates.push({
          univGroupNumber: row.univGroupNumber,
          gradeNumber: row.gradeNumber,
          name: row.name,
          phone: row.phoneRaw,
          excelRow: row.excelRow,
        });
      }
    }
  }
  if (duplicates.length > 0) {
    result.sheetDuplicates = duplicates;
    result.blockingCategory = 2;
    return result;
  }

  // ── 매칭 인덱스 구성 ──
  const lineupByKey = new Map<string, IUserRetreatGBSLineup[]>();
  for (const lu of lineups) {
    const key = buildMatchKey(
      lu.univGroupNumber,
      lu.gradeNumber,
      lu.name,
      normalizePhone(lu.phoneNumber)
    );
    if (!lineupByKey.has(key)) lineupByKey.set(key, []);
    lineupByKey.get(key)!.push(lu);
  }

  const matchedLineupIds = new Set<number>();
  const assignments: AssignmentPayloadItem[] = [];
  const unmatched: PersonRef[] = [];
  const matchedButNoGbs: PersonRef[] = [];
  const scheduleMismatches: ScheduleMismatchRow[] = [];
  const changeWarnings: ChangeWarning[] = [];

  for (const row of parsedRows) {
    const candidates = lineupByKey.get(row.matchKey) ?? [];
    // 0건 또는 모호(2건↑) → 미매칭 처리 (assignments 에서 제외)
    if (candidates.length !== 1) {
      unmatched.push({
        univGroupNumber: row.univGroupNumber,
        gradeNumber: row.gradeNumber,
        name: row.name,
        phone: row.phoneRaw,
        excelRow: row.excelRow,
      });
      continue;
    }

    const lu = candidates[0];
    matchedLineupIds.add(lu.id);

    // 카테고리5: 조번호 빈칸
    if (row.gbsNumber == null) {
      matchedButNoGbs.push({
        univGroupNumber: lu.univGroupNumber,
        gradeNumber: lu.gradeNumber,
        name: lu.name,
        phone: lu.phoneNumber,
        excelRow: row.excelRow,
      });
      continue; // 배정 대상 아님
    }

    // 카테고리6: 일정 불일치
    if (
      !sameScheduleSet(row.selectedScheduleIds, lu.userRetreatRegistrationScheduleIds)
    ) {
      scheduleMismatches.push({
        univGroupNumber: lu.univGroupNumber,
        gradeNumber: lu.gradeNumber,
        name: lu.name,
        phone: lu.phoneNumber,
        sheetScheduleIds: [...row.selectedScheduleIds],
        dbScheduleIds: lu.userRetreatRegistrationScheduleIds,
        excelRow: row.excelRow,
      });
    }

    // 카테고리7(경고): GBS/리더 변경
    const changes: string[] = [];
    if ((lu.gbsNumber ?? null) !== row.gbsNumber) {
      changes.push(`GBS ${lu.gbsNumber ?? "없음"}→${row.gbsNumber}`);
    }
    if ((lu.currentLeader ?? "") !== (row.currentLeaderName ?? "")) {
      changes.push(
        `현리더 ${lu.currentLeader || "없음"}→${row.currentLeaderName || "없음"}`
      );
    }
    if (lu.isLeader !== row.isLeaderFlag) {
      changes.push(`리더여부 ${lu.isLeader ? "O" : "X"}→${row.isLeaderFlag ? "O" : "X"}`);
    }
    if (changes.length > 0) {
      changeWarnings.push({
        univGroupNumber: lu.univGroupNumber,
        gradeNumber: lu.gradeNumber,
        name: lu.name,
        phone: lu.phoneNumber,
        changes,
      });
    }

    assignments.push({
      userRetreatRegistrationId: lu.id,
      gbsNumber: row.gbsNumber,
      isLeader: row.isLeaderFlag,
      currentLeaderName: row.currentLeaderName,
    });
  }

  // ── 카테고리4: DB(입금확인)에 있으나 시트에 없음 ──
  const missingDb: PersonRef[] = [];
  for (const lu of lineups) {
    if (!matchedLineupIds.has(lu.id)) {
      missingDb.push({
        univGroupNumber: lu.univGroupNumber,
        gradeNumber: lu.gradeNumber,
        name: lu.name,
        phone: lu.phoneNumber,
      });
    }
  }

  result.unmatchedSheetPeople = unmatched;
  result.missingDbRegistrants = missingDb;
  result.matchedButNoGbs = matchedButNoGbs;
  result.scheduleMismatches = scheduleMismatches;
  result.changeWarnings = changeWarnings;
  result.assignments = assignments;

  // 정보성: 기존 라인업에 없던 GBS 번호(서버가 자동 생성)
  const existingGbsNumbers = new Set<number>(
    lineups.map((lu) => lu.gbsNumber).filter((n): n is number => n != null)
  );
  result.newGbsNumbers = Array.from(
    new Set(assignments.map((a) => a.gbsNumber))
  )
    .filter((n) => !existingGbsNumbers.has(n))
    .sort((a, b) => a - b);

  // 첫 실패 카테고리 (3→4→5→6)
  if (unmatched.length > 0) result.blockingCategory = 3;
  else if (scheduleMismatches.length > 0) result.blockingCategory = 6;
  else result.blockingCategory = null;

  result.hasWarnings = missingDb.length > 0 || matchedButNoGbs.length > 0;
  return result;
}
