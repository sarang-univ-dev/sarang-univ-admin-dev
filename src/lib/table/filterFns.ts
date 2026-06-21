import { FilterFn } from "@tanstack/react-table";

export const EMPTY_FILTER_VALUE = "__EMPTY__";

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return String(left) === String(right);
}

export const arrayIncludesValueFilterFn: FilterFn<any> = (
  row,
  columnId,
  filterValue
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;

  const value = row.getValue(columnId);
  const hasEmptyFilter = filterValue.includes(EMPTY_FILTER_VALUE);

  if (hasEmptyFilter && isEmptyValue(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return hasEmptyFilter;
    return value.some(item =>
      filterValue.some(filter => valuesEqual(item, filter))
    );
  }

  return filterValue.some(filter => valuesEqual(value, filter));
};
