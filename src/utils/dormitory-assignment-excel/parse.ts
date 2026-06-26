import { AssignmentImportRow } from "./types";

type SheetMatrix = (string | number | boolean | null)[][];

const REQUIRED_HEADERS = ["ID", "숙소명"];

const cell = (matrix: SheetMatrix, r: number, c: number): string =>
  (matrix[r]?.[c] ?? "").toString().trim();

// 시트를 구조적으로만 파싱한다 (ID + 숙소명). 명단/숙소/정원 대조는 validate 에서.
export function parseAssignmentSheet(matrix: SheetMatrix): {
  rows: AssignmentImportRow[];
  fileFormatErrors: string[];
} {
  const fileFormatErrors: string[] = [];
  const rows: AssignmentImportRow[] = [];

  const headerRowIndex = matrix.findIndex((row) => {
    const values = row.map((v) => (v ?? "").toString().trim());
    return REQUIRED_HEADERS.every((header) => values.includes(header));
  });

  if (headerRowIndex < 0) {
    return {
      rows,
      fileFormatErrors: [
        "헤더 행을 찾을 수 없습니다. 'ID', '숙소명' 컬럼이 필요합니다.",
      ],
    };
  }

  const headerValues = matrix[headerRowIndex].map((v) =>
    (v ?? "").toString().trim()
  );
  const idColumn = headerValues.indexOf("ID");
  const dormitoryColumn = headerValues.indexOf("숙소명");

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const idRaw = cell(matrix, r, idColumn);
    const dormitoryName = cell(matrix, r, dormitoryColumn);

    if (!idRaw && !dormitoryName) continue;

    const excelRow = r + 1;
    if (!/^\d+$/.test(idRaw)) {
      fileFormatErrors.push(`${excelRow}행: ID가 비어있거나 숫자가 아닙니다.`);
      continue;
    }

    rows.push({ excelRow, id: Number(idRaw), dormitoryName });
  }

  if (rows.length === 0 && fileFormatErrors.length === 0) {
    fileFormatErrors.push("적용할 행이 없습니다.");
  }

  return { rows, fileFormatErrors };
}
