/**
 * GBS 엑셀 가져오기 — 공유 타입.
 */

export type ImportStep =
  | "pick"
  | "selectSheet"
  | "validate"
  | "result"
  | "submitting"
  | "done";

/** 시트 한 데이터 행을 정규화한 형태 */
export interface ParsedSheetRow {
  /** 사람이 읽는 엑셀 행 번호 (1-based) — 오류 표시용 */
  excelRow: number;
  isLeaderFlag: boolean;
  gbsNumber: number | null;
  univGroupNumber: number; // 숫자 변환 실패 시 NaN
  gradeNumber: number; // 숫자 변환 실패 시 NaN
  name: string;
  phoneRaw: string;
  phoneNorm: string;
  currentLeaderName: string;
  /** "1" 인 스케줄 컬럼 → schedule id 집합 */
  selectedScheduleIds: Set<number>;
  matchKey: string;
}

export interface ColumnLayout {
  headerRowIndex: number;
  colOffset: number;
  scheduleLabelsInOrder: string[];
}

/** 오류/경고 리스트에 표시하는 사람 정보 */
export interface PersonRef {
  univGroupNumber: number | string;
  gradeNumber: number | string;
  name: string;
  phone: string;
  /** 오류 표시용 엑셀 행 번호 */
  excelRow?: number;
}

/** 카테고리6(일정 불일치) 표시용 — 시트/DB 선택 일정 id 집합 (체크박스 렌더용) */
export interface ScheduleMismatchRow {
  univGroupNumber: number;
  gradeNumber: number;
  name: string;
  phone: string;
  excelRow?: number;
  /** 시트에서 선택된 일정 id */
  sheetScheduleIds: number[];
  /** DB(명단)에서 선택된 일정 id */
  dbScheduleIds: number[];
}

export interface ChangeWarning {
  univGroupNumber: number;
  gradeNumber: number;
  name: string;
  phone: string;
  changes: string[];
}

export interface AssignmentPayloadItem {
  userRetreatRegistrationId: number;
  gbsNumber: number;
  isLeader: boolean;
  currentLeaderName: string;
}

export type BlockingCategory = 1 | 2 | 3 | 6 | null;

export interface ValidationResult {
  /** 카테고리1: 파일 형식(컬럼) — 차단 */
  fileFormatErrors: string[];
  /** 카테고리2: 시트 내 중복 레코드 — 차단 */
  sheetDuplicates: PersonRef[];
  /** 카테고리3: 시트에 있으나 명단(DB)에 없음 — 차단 */
  unmatchedSheetPeople: PersonRef[];
  /** 카테고리6: 일정 불일치 — 차단 */
  scheduleMismatches: ScheduleMismatchRow[];
  /** 카테고리4(경고): 명단(DB)에 있으나 시트에 없음 */
  missingDbRegistrants: PersonRef[];
  /** 카테고리5(경고): 매칭됐으나 조번호 빈칸 */
  matchedButNoGbs: PersonRef[];
  /** GBS/리더 변경 내역(정보성) */
  changeWarnings: ChangeWarning[];

  /** 차단 카테고리(1·2·3·6) 중 첫 번째, 없으면 null */
  blockingCategory: BlockingCategory;
  /** 경고(카테고리4·5) 존재 여부 — 확인 체크 시 제출 가능 */
  hasWarnings: boolean;
  /** 제출 payload (매칭 + 조번호 있는 행) */
  assignments: AssignmentPayloadItem[];
  /** 정보성: 새로 생성될 것으로 보이는 GBS 번호 */
  newGbsNumbers: number[];
}
