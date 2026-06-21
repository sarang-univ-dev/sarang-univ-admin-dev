import { Table } from "@tanstack/react-table";

export function getOrderedTableRowIds<TData>(
  table: Table<TData>,
  getId: (row: TData) => number | string
): number[] {
  return table
    .getRowModel()
    .rows.map(row => Number(getId(row.original)))
    .filter(Number.isFinite);
}
