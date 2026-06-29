import { Gender } from "@/types";

export type ImportStep =
  | "pick"
  | "selectSheet"
  | "validate"
  | "result"
  | "submitting"
  | "done";

// 시트에서 추출한 구조적 행 (인적사항 + 숙소명)
export type AssignmentImportRow = {
  excelRow: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: Gender;
  name: string;
  phoneRaw: string;
  phoneNorm: string;
  dormitoryName: string; // 비면 배정 해제
  matchKey: string;
};

export type AssignmentPersonRef = {
  excelRow?: number;
  univGroupNumber: number | string;
  gradeNumber: number | string;
  name: string;
  phone: string;
};

export type UnmatchedSheetPerson = AssignmentPersonRef;

export type UnknownDormitoryRef = {
  excelRow: number;
  name: string;
  univGroupNumber: number;
  gradeNumber: number;
  phone: string;
  gender: Gender;
  dormitoryName: string;
};

export type CapacityViolation = {
  gender: Gender;
  dormitoryName: string;
  scheduleLabel: string;
  count: number;
  capacity: number;
};

export type AssignmentChange = {
  id: number;
  name: string;
  department: string;
  grade: string;
  phone: string;
  from: string; // 현재 숙소명 또는 "미배정"
  to: string; // 새 숙소명 또는 "미배정"
};

export type AssignmentValidationResult = {
  fileFormatErrors: string[]; // 카테고리1 (차단)
  sheetDuplicatePeople: AssignmentPersonRef[]; // 카테고리2 (차단)
  unmatchedSheetPeople: UnmatchedSheetPerson[]; // 카테고리3 (차단)
  unknownDormitories: UnknownDormitoryRef[]; // 카테고리4 (차단)
  capacityViolations: CapacityViolation[]; // 카테고리5 (차단)
  missingDbPeople: AssignmentPersonRef[]; // 경고 (현재 배정 유지)
  changes: AssignmentChange[]; // 정보 (변경 내역)
  blockingCategory: number | null;
  hasWarnings: boolean;
  assignments: {
    userRetreatRegistrationId: number;
    dormitoryId: number | null;
  }[];
};
