import { Row } from "@tanstack/react-table";

export type SearchMode = "contains" | "token" | "exact";

export interface SearchField<TData> {
  value: (row: TData) => unknown;
  mode?: SearchMode;
}

const TOKEN_SPLIT_PATTERN = /[\s,;/|(){}\[\]<>]+/;

export function normalizeSearchText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function toSearchValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [value];
}

function getSearchTokens(value: unknown): Set<string> {
  const tokens = new Set<string>();

  toSearchValues(value).forEach(item => {
    const normalized = normalizeSearchText(item);
    if (!normalized) return;

    tokens.add(normalized);

    normalized
      .split(TOKEN_SPLIT_PATTERN)
      .filter(Boolean)
      .forEach(token => tokens.add(token));

    normalized.match(/\d+/g)?.forEach(token => tokens.add(token));
  });

  return tokens;
}

function matchesField(value: unknown, query: string, mode: SearchMode): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  if (mode === "contains") {
    return toSearchValues(value).some(item =>
      normalizeSearchText(item).includes(normalizedQuery)
    );
  }

  if (mode === "exact") {
    return toSearchValues(value).some(
      item => normalizeSearchText(item) === normalizedQuery
    );
  }

  return getSearchTokens(value).has(normalizedQuery);
}

export function matchesSearchFields<TData>(
  row: TData,
  query: unknown,
  fields: SearchField<TData>[]
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  return fields.some(field =>
    matchesField(field.value(row), normalizedQuery, field.mode ?? "contains")
  );
}

export function createGlobalSearchFilter<TData>(
  fields: SearchField<TData>[]
) {
  return (row: Row<TData>, _columnId: string, filterValue: unknown): boolean =>
    matchesSearchFields(row.original, filterValue, fields);
}
