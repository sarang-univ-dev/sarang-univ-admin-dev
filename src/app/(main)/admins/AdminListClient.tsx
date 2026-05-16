"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { debounce } from "lodash";
import {
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CheckCheck, Plus, Search, Shield, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UnifiedColumnHeader, VirtualizedTable } from "@/components/common/table";
import { useToastStore } from "@/store/toast-store";
import { listAdmins } from "@/lib/api/admin-api";
import type { AdminListRow } from "@/types/admin-management";

import CreateAdminModal from "./CreateAdminModal";

const columnHelper = createColumnHelper<AdminListRow>();

export default function AdminListClient() {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "id", desc: false },
  ]);

  const debouncedSetFilter = useMemo(
    () => debounce((v: string) => setGlobalFilter(v), 200),
    []
  );
  useEffect(() => () => debouncedSetFilter.cancel(), [debouncedSetFilter]);

  const { data, error, isLoading, mutate } = useSWR<AdminListRow[]>(
    "/api/v1/admin/admins",
    listAdmins
  );

  const rows = useMemo(() => data ?? [], [data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="ID"
            enableSorting
          />
        ),
        cell: info => (
          <div className="text-center text-sm text-muted-foreground whitespace-nowrap shrink-0 px-1">
            {info.getValue()}
          </div>
        ),
        size: 70,
      }),
      columnHelper.accessor("name", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
          />
        ),
        cell: info => (
          <div className="font-medium text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("email", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="이메일"
            enableSorting
          />
        ),
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor(
        row =>
          row.univGroupNumber != null
            ? `${row.univGroupNumber}부 ${row.univGroupName ?? ""}`.trim()
            : "-",
        {
          id: "univGroup",
          header: ({ column, table }) => (
            <UnifiedColumnHeader
              column={column}
              table={table}
              title="부서"
              enableSorting
              enableFiltering
            />
          ),
          cell: info => (
            <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">
              {info.getValue()}
            </div>
          ),
          filterFn: "arrIncludesSome",
        }
      ),
      columnHelper.accessor("isActive", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="활성"
            enableSorting
          />
        ),
        cell: info => (
          <div className="flex justify-center shrink-0 px-1">
            {info.getValue() ? (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" />
                <span className="text-xs font-medium text-green-700 whitespace-nowrap">
                  활성
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
                <XCircle className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  비활성
                </span>
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("isSuperuser", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="Superuser"
            enableSorting
          />
        ),
        cell: info => (
          <div className="flex justify-center shrink-0 px-1">
            {info.getValue() ? (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
                <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5 flex-shrink-0" />
                <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">
                  Superuser
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase().trim();
      if (!q) return true;
      const r = row.original;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin 관리</h1>
        <p className="text-muted-foreground">
          관리자 계정을 조회·추가하고 superuser 권한을 부여합니다.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>관리자 목록</CardTitle>
            <CardDescription>
              {data ? `총 ${data.length}명` : "불러오는 중…"}
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Admin 추가
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="이름 또는 이메일로 검색"
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                debouncedSetFilter(e.target.value);
              }}
            />
          </div>

          {error ? (
            <div className="border rounded-lg py-12 text-center text-destructive">
              조회 실패: {String((error as { message?: string })?.message ?? error)}
            </div>
          ) : isLoading ? (
            <div className="border rounded-lg py-12 text-center text-muted-foreground">
              불러오는 중…
            </div>
          ) : (
            <VirtualizedTable
              table={table}
              estimateSize={52}
              className="max-h-[70vh]"
              emptyMessage="결과가 없습니다."
              onRowClick={row => router.push(`/admins/${row.id}`)}
              getRowClassName={() => "cursor-pointer"}
            />
          )}
        </CardContent>
      </Card>

      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          mutate();
          addToast({ title: "Admin이 추가되었습니다.", variant: "success" });
        }}
      />
    </div>
  );
}
