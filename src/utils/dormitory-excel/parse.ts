import { Gender } from "@/types";
import { DormitoryImportRow, DormitoryImportValidation } from "./types";

type SheetMatrix = (string | number | boolean | null)[][];

const REQUIRED_HEADERS = ["성별", "숙소명", "정원"];
const OPTIONAL_HEADERS = ["최대 인원", "메모"];

const cell = (matrix: SheetMatrix, r: number, c: number): string =>
  (matrix[r]?.[c] ?? "").toString().trim();

const parseGender = (value: string): Gender | null => {
  const normalized = value.trim().toUpperCase();
  if (["남", "남자", "형제", "M", "MALE"].includes(normalized)) {
    return Gender.MALE;
  }
  if (["여", "여자", "자매", "F", "FEMALE"].includes(normalized)) {
    return Gender.FEMALE;
  }
  return null;
};

const parsePositiveInteger = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
};

export function parseDormitorySheet(
  matrix: SheetMatrix
): DormitoryImportValidation {
  const errors: string[] = [];
  const rows: DormitoryImportRow[] = [];

  const headerRowIndex = matrix.findIndex((row) => {
    const values = row.map((v) => (v ?? "").toString().trim());
    return REQUIRED_HEADERS.every((header) => values.includes(header));
  });

  if (headerRowIndex < 0) {
    return {
      rows,
      errors: [
        "헤더 행을 찾을 수 없습니다. '성별', '숙소명', '정원' 컬럼이 필요합니다.",
      ],
    };
  }

  const headerValues = matrix[headerRowIndex].map((v) =>
    (v ?? "").toString().trim()
  );
  const columnIndex = new Map<string, number>();
  [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].forEach((header) => {
    columnIndex.set(header, headerValues.indexOf(header));
  });

  for (const header of REQUIRED_HEADERS) {
    if ((columnIndex.get(header) ?? -1) < 0) {
      errors.push(`필수 컬럼이 없습니다: ${header}`);
    }
  }

  if (errors.length > 0) {
    return { rows, errors };
  }

  const seen = new Set<string>();

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const genderRaw = cell(matrix, r, columnIndex.get("성별")!);
    const name = cell(matrix, r, columnIndex.get("숙소명")!);
    const optimalCapacityRaw = cell(matrix, r, columnIndex.get("정원")!);
    const maxColumnIndex = columnIndex.get("최대 인원") ?? -1;
    const memoColumnIndex = columnIndex.get("메모") ?? -1;
    const maxCapacityRaw =
      maxColumnIndex >= 0 ? cell(matrix, r, maxColumnIndex) : "";
    const memo = memoColumnIndex >= 0 ? cell(matrix, r, memoColumnIndex) : "";

    if (!genderRaw && !name && !optimalCapacityRaw && !maxCapacityRaw && !memo) {
      continue;
    }

    const excelRow = r + 1;
    const gender = parseGender(genderRaw);
    const optimalCapacity = parsePositiveInteger(optimalCapacityRaw);
    const maxCapacity = maxCapacityRaw
      ? parsePositiveInteger(maxCapacityRaw)
      : null;

    if (!gender) {
      errors.push(
        `${excelRow}행: 성별은 형제/자매 또는 MALE/FEMALE로 입력해주세요.`
      );
      continue;
    }
    if (!name) {
      errors.push(`${excelRow}행: 숙소명을 입력해주세요.`);
      continue;
    }
    if (optimalCapacity == null) {
      errors.push(`${excelRow}행: 정원은 1 이상의 정수로 입력해주세요.`);
      continue;
    }
    if (maxCapacityRaw && maxCapacity == null) {
      errors.push(`${excelRow}행: 최대 인원은 1 이상의 정수로 입력해주세요.`);
      continue;
    }
    if (maxCapacity != null && maxCapacity < optimalCapacity) {
      errors.push(`${excelRow}행: 최대 인원은 정원보다 작을 수 없습니다.`);
      continue;
    }

    const key = `${gender}|${name}`;
    if (seen.has(key)) {
      errors.push(`${excelRow}행: 같은 성별/숙소명이 파일 안에 중복됩니다.`);
      continue;
    }
    seen.add(key);

    rows.push({
      excelRow,
      gender,
      name,
      optimalCapacity,
      maxCapacity,
      memo: memo || null,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("적용할 숙소 행이 없습니다.");
  }

  return { rows, errors };
}
