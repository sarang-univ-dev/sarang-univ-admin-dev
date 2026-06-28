import { Gender } from "@/types";

// 시트에서 추출한 구조적 행 (ID + 숙소명)
export type AssignmentImportRow = {
  excelRow: number;
  id: number;
  dormitoryName: string; // 비면 배정 해제
};

export type AssignmentPersonRef = {
  excelRow?: number;
  id: number;
  name: string;
  department: string;
  grade: string;
};

export type UnmatchedSheetId = {
  excelRow: number;
  id: number;
};

export type UnknownDormitoryRef = {
  excelRow: number;
  id: number;
  name: string;
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
  from: string; // 현재 숙소명 또는 "미배정"
  to: string; // 새 숙소명 또는 "미배정"
};

export type AssignmentValidationResult = {
  fileFormatErrors: string[]; // 카테고리1 (차단)
  sheetDuplicateIds: AssignmentPersonRef[]; // 카테고리2 (차단)
  unmatchedSheetIds: UnmatchedSheetId[]; // 카테고리3 (차단)
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
