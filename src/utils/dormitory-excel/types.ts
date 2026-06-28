import { Gender } from "@/types";

export type DormitoryImportRow = {
  excelRow: number;
  gender: Gender;
  name: string;
  optimalCapacity: number;
  maxCapacity: number | null;
  memo: string | null;
};

export type DormitoryImportValidation = {
  rows: DormitoryImportRow[];
  errors: string[];
};
