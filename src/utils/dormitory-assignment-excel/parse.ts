import { Gender } from "@/types";

import { AssignmentImportRow } from "./types";

type SheetMatrix = (string | number | boolean | null)[][];

const REQUIRED_HEADERS = ["부서", "학년", "성별", "이름", "연락처", "숙소명"];
const MATCH_HEADERS = ["부서", "학년", "성별", "이름", "연락처"];

const cell = (matrix: SheetMatrix, r: number, c: number): string =>
  (matrix[r]?.[c] ?? "").toString().trim();

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

const parseNumberFromLabel = (raw: string): number => {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits === "" ? NaN : Number(digits);
};

const parseGender = (raw: string): Gender | null => {
  const normalized = raw.trim().toUpperCase();
  if (["형제", "남", "남성", Gender.MALE].includes(normalized)) {
    return Gender.MALE;
  }
  if (["자매", "여", "여성", Gender.FEMALE].includes(normalized)) {
    return Gender.FEMALE;
  }
  return null;
};

// 시트를 구조적으로만 파싱한다. 명단/숙소/정원 대조는 validate 에서 수행한다.
export function parseAssignmentSheet(matrix: SheetMatrix): {
  rows: AssignmentImportRow[];
  fileFormatErrors: string[];
} {
  const fileFormatErrors: string[] = [];
  const rows: AssignmentImportRow[] = [];

  const headerRowIndex = matrix.findIndex(row => {
    const values = row.map(v => (v ?? "").toString().trim());
    return REQUIRED_HEADERS.every(header => values.includes(header));
  });

  if (headerRowIndex < 0) {
    return {
      rows,
      fileFormatErrors: [
        "헤더 행을 찾을 수 없습니다. '부서', '학년', '성별', '이름', '연락처', '숙소명' 컬럼이 필요합니다.",
      ],
    };
  }

  const headerValues = matrix[headerRowIndex].map(v =>
    (v ?? "").toString().trim()
  );
  const headerIndex = new Map<string, number>();
  headerValues.forEach((header, index) => {
    if (header && !headerIndex.has(header)) headerIndex.set(header, index);
  });

  const column = (header: string) => headerIndex.get(header) ?? -1;
  const matchColumns = MATCH_HEADERS.map(column);
  const dormitoryColumn = column("숙소명");

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const excelRow = r + 1;
    const matchValues = matchColumns.map(c => cell(matrix, r, c));
    const dormitoryName = cell(matrix, r, dormitoryColumn);

    if (matchValues.every(value => value === "") && dormitoryName === "") {
      continue;
    }

    const univGroupRaw = cell(matrix, r, column("부서"));
    const gradeRaw = cell(matrix, r, column("학년"));
    const genderRaw = cell(matrix, r, column("성별"));
    const name = cell(matrix, r, column("이름"));
    const phoneRaw = cell(matrix, r, column("연락처"));
    const univGroupNumber = parseNumberFromLabel(univGroupRaw);
    const gradeNumber = parseNumberFromLabel(gradeRaw);
    const gender = parseGender(genderRaw);
    const phoneNorm = normalizePhone(phoneRaw);

    if (Number.isNaN(univGroupNumber)) {
      fileFormatErrors.push(
        `${excelRow}행: 부서가 비어있거나 숫자가 아닙니다.`
      );
    }
    if (Number.isNaN(gradeNumber)) {
      fileFormatErrors.push(
        `${excelRow}행: 학년이 비어있거나 숫자가 아닙니다.`
      );
    }
    if (!gender) {
      fileFormatErrors.push(
        `${excelRow}행: 성별은 '형제' 또는 '자매'로 입력해야 합니다.`
      );
    }
    if (!name) {
      fileFormatErrors.push(`${excelRow}행: 이름이 비어있습니다.`);
    }
    if (!phoneNorm) {
      fileFormatErrors.push(
        `${excelRow}행: 연락처가 비어있거나 숫자가 없습니다.`
      );
    }

    if (
      Number.isNaN(univGroupNumber) ||
      Number.isNaN(gradeNumber) ||
      !gender ||
      !name ||
      !phoneNorm
    ) {
      continue;
    }

    rows.push({
      excelRow,
      univGroupNumber,
      gradeNumber,
      gender,
      name,
      phoneRaw,
      phoneNorm,
      dormitoryName,
      matchKey: buildMatchKey(univGroupNumber, gradeNumber, name, phoneNorm),
    });
  }

  if (rows.length === 0 && fileFormatErrors.length === 0) {
    fileFormatErrors.push("적용할 행이 없습니다.");
  }

  return { rows, fileFormatErrors };
}
