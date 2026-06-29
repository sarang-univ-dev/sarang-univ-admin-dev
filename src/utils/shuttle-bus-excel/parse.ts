import type { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";
import { Gender, TRetreatShuttleBus } from "@/types";

import type {
  ShuttleBusExcelUnivGroup,
  ShuttleBusImportValidation,
} from "./types";
import { getShuttleBusImportColumnLabel } from "./labels";

export type ShuttleBusSheetMatrix = (string | number | boolean | null)[][];

const REQUIRED_HEADERS = ["이름", "전화번호", "성별", "부서", "학년"];

function cell(matrix: ShuttleBusSheetMatrix, r: number, c: number): string {
  return (matrix[r]?.[c] ?? "").toString().trim();
}

function parseGender(value: string): Gender | null {
  const normalized = value.trim().toUpperCase();
  if (["남", "남자", "형제", "M", "MALE"].includes(normalized)) {
    return Gender.MALE;
  }
  if (["여", "여자", "자매", "F", "FEMALE"].includes(normalized)) {
    return Gender.FEMALE;
  }
  return null;
}

function normalizePhoneNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!/^010\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function getExistingRegistrationPhoneNumber(
  registration: IShuttleBusPaymentConfirmationRegistration
) {
  const candidate =
    registration.userPhoneNumber ??
    (
      registration as IShuttleBusPaymentConfirmationRegistration & {
        phoneNumber?: string;
      }
    ).phoneNumber;

  return candidate ? normalizePhoneNumber(candidate) : null;
}

function parsePositiveInteger(value: string): number | null {
  const match = value.trim().match(/^(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseSelected(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  return ["1", "Y", "YES", "TRUE", "O", "OK", "V", "신청", "체크"].includes(
    normalized
  );
}

function parseBusIdFromHeader(value: string): number | null {
  const match = value.trim().match(/^버스\s+(\d+)\s*:/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getBusIdFromHeader(
  value: string,
  schedules: TRetreatShuttleBus[]
): number | null {
  const idFromLegacyHeader = parseBusIdFromHeader(value);
  if (idFromLegacyHeader !== null) {
    return idFromLegacyHeader;
  }

  const normalized = value.trim();
  const matchingSchedules = schedules.filter(
    schedule => getShuttleBusImportColumnLabel(schedule) === normalized
  );

  return matchingSchedules.length === 1 ? matchingSchedules[0].id : null;
}

export function parseShuttleBusRegistrationSheet({
  matrix,
  schedules,
  univGroupAndGrade,
  existingRegistrations,
}: {
  matrix: ShuttleBusSheetMatrix;
  schedules: TRetreatShuttleBus[];
  univGroupAndGrade: ShuttleBusExcelUnivGroup[];
  existingRegistrations: IShuttleBusPaymentConfirmationRegistration[];
}): ShuttleBusImportValidation {
  const errors: string[] = [];
  const rows: ShuttleBusImportValidation["rows"] = [];
  const excludedRows: ShuttleBusImportValidation["excludedRows"] = [];
  const scheduleIds = new Set(schedules.map(schedule => schedule.id));
  const existingKeys = new Set(
    existingRegistrations
      .map(registration => {
        const phoneNumber = getExistingRegistrationPhoneNumber(registration);
        return phoneNumber
          ? `${registration.name.trim()}|${phoneNumber}`
          : null;
      })
      .filter((key): key is string => key !== null)
  );

  const headerRowIndex = matrix.findIndex(row => {
    const values = row.map(v => (v ?? "").toString().trim());
    return REQUIRED_HEADERS.every(header => values.includes(header));
  });

  if (headerRowIndex < 0) {
    return {
      rows,
      excludedRows,
      errors: [
        "헤더 행을 찾을 수 없습니다. 이름, 전화번호, 성별, 부서, 학년 컬럼이 필요합니다.",
      ],
    };
  }

  const headers = matrix[headerRowIndex].map(v => (v ?? "").toString().trim());
  const columnIndex = new Map<string, number>();
  REQUIRED_HEADERS.forEach(header => {
    columnIndex.set(header, headers.indexOf(header));
  });

  for (const header of REQUIRED_HEADERS) {
    if ((columnIndex.get(header) ?? -1) < 0) {
      errors.push(`필수 컬럼이 없습니다: ${header}`);
    }
  }

  const busColumns = headers
    .map((header, index) => ({
      shuttleBusId: getBusIdFromHeader(header, schedules),
      index,
    }))
    .filter(
      (column): column is { shuttleBusId: number; index: number } =>
        column.shuttleBusId !== null && scheduleIds.has(column.shuttleBusId)
    );

  if (busColumns.length === 0) {
    errors.push(
      "셔틀버스 선택 컬럼이 없습니다. 최신 템플릿을 내려받아 사용해주세요."
    );
  }

  if (errors.length > 0) {
    return { rows, excludedRows, errors };
  }

  const sheetKeys = new Map<string, number>();

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const name = cell(matrix, r, columnIndex.get("이름")!);
    const phoneRaw = cell(matrix, r, columnIndex.get("전화번호")!);
    const genderRaw = cell(matrix, r, columnIndex.get("성별")!);
    const univGroupRaw = cell(matrix, r, columnIndex.get("부서")!);
    const gradeRaw = cell(matrix, r, columnIndex.get("학년")!);
    const hasBusSelection = busColumns.some(column =>
      parseSelected(cell(matrix, r, column.index))
    );

    if (
      !name &&
      !phoneRaw &&
      !genderRaw &&
      !univGroupRaw &&
      !gradeRaw &&
      !hasBusSelection
    ) {
      continue;
    }

    const excelRow = r + 1;
    const phoneNumber = normalizePhoneNumber(phoneRaw);
    const gender = parseGender(genderRaw);
    const univGroupNumber = parsePositiveInteger(univGroupRaw);
    const gradeNumber = parsePositiveInteger(gradeRaw);
    const selectedBusIds = busColumns
      .filter(column => parseSelected(cell(matrix, r, column.index)))
      .map(column => column.shuttleBusId);

    if (!name) {
      errors.push(`${excelRow}행: 이름을 입력해주세요.`);
    }
    if (!phoneNumber) {
      errors.push(`${excelRow}행: 전화번호는 010-0000-0000 형식이어야 합니다.`);
    }
    if (!gender) {
      errors.push(
        `${excelRow}행: 성별은 남/여 또는 MALE/FEMALE로 입력해주세요.`
      );
    }
    if (!univGroupNumber) {
      errors.push(
        `${excelRow}행: 부서를 숫자 또는 '2부' 형식으로 입력해주세요.`
      );
    }
    if (!gradeNumber) {
      errors.push(
        `${excelRow}행: 학년을 숫자 또는 '1학년' 형식으로 입력해주세요.`
      );
    }
    if (selectedBusIds.length === 0) {
      errors.push(`${excelRow}행: 신청할 셔틀버스를 1개 이상 선택해주세요.`);
    }

    if (
      !phoneNumber ||
      !gender ||
      !univGroupNumber ||
      !gradeNumber ||
      !name ||
      selectedBusIds.length === 0
    ) {
      continue;
    }

    const univGroup = univGroupAndGrade.find(
      group => group.univGroupNumber === univGroupNumber
    );
    if (!univGroup) {
      errors.push(`${excelRow}행: ${univGroupNumber}부를 찾을 수 없습니다.`);
      continue;
    }

    const grade = univGroup.grades.find(
      candidate => candidate.gradeNumber === gradeNumber
    );
    if (!grade) {
      errors.push(
        `${excelRow}행: ${univGroupNumber}부 ${gradeNumber}학년을 찾을 수 없습니다.`
      );
      continue;
    }

    const key = `${name}|${phoneNumber}`;
    const firstRow = sheetKeys.get(key);
    if (firstRow) {
      errors.push(`${excelRow}행: ${firstRow}행과 같은 이름/전화번호입니다.`);
      continue;
    }
    sheetKeys.set(key, excelRow);

    if (existingKeys.has(key)) {
      excludedRows.push({
        excelRow,
        name,
        phoneNumber,
        gender,
        univGroupNumber,
        gradeNumber,
        gradeId: grade.gradeId,
        shuttleBusIds: selectedBusIds,
        reason: "EXISTING_REGISTRATION",
        reasonText: "이미 셔틀버스 신청이 있어 제외됩니다.",
      });
      continue;
    }

    rows.push({
      excelRow,
      name,
      phoneNumber,
      gender,
      univGroupNumber,
      gradeNumber,
      gradeId: grade.gradeId,
      shuttleBusIds: selectedBusIds,
    });
  }

  if (rows.length === 0 && excludedRows.length === 0 && errors.length === 0) {
    errors.push("가져올 신청 행이 없습니다.");
  }

  return { rows, excludedRows, errors };
}
