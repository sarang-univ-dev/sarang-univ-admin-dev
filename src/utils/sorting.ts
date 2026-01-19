import { Row } from "@tanstack/react-table";

/**
 * 학년 문자열에서 숫자 추출
 * @example parseGrade("1학년") // 1
 * @example parseGrade("10학년") // 10
 * @example parseGrade(null) // 0
 */
export const parseGrade = (grade: string | null | undefined): number => {
  return parseInt(grade?.replace(/[^0-9]/g, "") || "0", 10);
};

/**
 * 학년 오름차순 정렬 함수 (1학년 → 4학년)
 * TanStack Table의 sortingFn으로 사용
 */
export const gradeAscSortingFn = <T>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string
): number => {
  const gradeA = rowA.getValue(columnId) as string;
  const gradeB = rowB.getValue(columnId) as string;
  return parseGrade(gradeA) - parseGrade(gradeB);
};

/**
 * 학년 내림차순 정렬 함수 (4학년 → 1학년)
 * TanStack Table의 sortingFn으로 사용
 */
export const gradeDescSortingFn = <T>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string
): number => {
  const gradeA = rowA.getValue(columnId) as string;
  const gradeB = rowB.getValue(columnId) as string;
  return parseGrade(gradeB) - parseGrade(gradeA);
};

/**
 * 필터 드롭다운용 학년 정렬 비교 함수
 * UnifiedColumnHeader, ColumnHeader의 sortFilterValues prop에 사용
 */
export const gradeFilterSort = (a: unknown, b: unknown): number => {
  const numA = parseInt(String(a), 10);
  const numB = parseInt(String(b), 10);
  return numA - numB;
};

/**
 * 부서 문자열에서 숫자 추출 후 오름차순 정렬 함수
 * @example "1부" → "2부" → "10부"
 */
export const departmentSortingFn = <T>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string
): number => {
  const a = rowA.getValue(columnId) as string;
  const b = rowB.getValue(columnId) as string;
  const numA = parseInt(a?.replace(/[^0-9]/g, "") || "0", 10);
  const numB = parseInt(b?.replace(/[^0-9]/g, "") || "0", 10);
  return numA - numB;
};
