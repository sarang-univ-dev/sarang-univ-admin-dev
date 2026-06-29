import type { Gender } from "@/types";

export interface ShuttleBusExcelGrade {
  gradeId: number;
  gradeName: string;
  gradeNumber: number;
}

export interface ShuttleBusExcelUnivGroup {
  univGroupId: number;
  univGroupName: string;
  univGroupNumber: number;
  grades: ShuttleBusExcelGrade[];
}

export interface ShuttleBusImportRow {
  excelRow: number;
  name: string;
  phoneNumber: string;
  gender: Gender;
  univGroupNumber: number;
  gradeNumber: number;
  gradeId: number;
  shuttleBusIds: number[];
}

export interface ShuttleBusImportExcludedRow extends ShuttleBusImportRow {
  reason: "EXISTING_REGISTRATION";
  reasonText: string;
}

export interface ShuttleBusImportValidation {
  rows: ShuttleBusImportRow[];
  excludedRows: ShuttleBusImportExcludedRow[];
  errors: string[];
}
