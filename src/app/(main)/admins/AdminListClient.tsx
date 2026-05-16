"use client";

import {
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { debounce } from "lodash";
import { Ban, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import {
  UnifiedColumnHeader,
  VirtualizedTable,
} from "@/components/common/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deactivateAdmin, listAdmins } from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type { AdminListRow } from "@/types/admin-management";

import CreateAdminModal from "./CreateAdminModal";

const columnHelper = createColumnHelper<AdminListRow>();

export default function AdminListClient() {
  const addToast = useToastStore(state => state.add);
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminListRow | null>(
    null
  );
  const [deactivating, setDeactivating] = useState(false);
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
      columnHelper.display({
        id: "actions",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="관리"
            titleOnly
          />
        ),
        cell: ({ row }) => (
          <div className="flex justify-center px-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={event => {
                event.stopPropagation();
                setDeactivateTarget(row.original);
              }}
            >
              <Ban className="h-4 w-4 mr-1" />
              비활성화
            </Button>
          </div>
        ),
        size: 120,
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
        r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleDeactivate = async () => {
    if (!deactivateTarget || deactivating) return;
    setDeactivating(true);
    try {
      await deactivateAdmin(deactivateTarget.id);
      await mutate();
      addToast({
        title: "수양회 관리자를 비활성화했습니다.",
        variant: "success",
      });
      setDeactivateTarget(null);
    } catch (error) {
      const description =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : "수양회 관리자를 비활성화하지 못했습니다.";
      addToast({
        title: "비활성화 실패",
        description,
        variant: "destructive",
      });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">수양회 관리자</h1>
        <p className="text-muted-foreground">
          전체 수양회 운영 권한을 가진 관리자 계정을 조회하고 추가합니다.
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
            관리자 추가
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
              조회 실패:{" "}
              {String((error as { message?: string })?.message ?? error)}
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
            />
          )}
        </CardContent>
      </Card>

      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          mutate();
          addToast({
            title: "수양회 관리자가 추가되었습니다.",
            variant: "success",
          });
        }}
      />

      <AlertDialog
        open={deactivateTarget !== null}
        onOpenChange={open => {
          if (!open && !deactivating) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수양회 관리자 비활성화</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.name} ({deactivateTarget?.email}) 계정을
              비활성화합니다. 이 계정은 즉시 로그인할 수 없고, 전체 수양회 운영
              권한과 연결된 수양회 역할 권한도 사용할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deactivateTarget && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              연결된 수양회 역할 {deactivateTarget.assignmentCount}개는 삭제되지
              않지만, 계정이 비활성화된 동안 권한 체크에서 제외됩니다.
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>취소</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deactivating}
                onClick={event => {
                  event.preventDefault();
                  handleDeactivate();
                }}
              >
                {deactivating ? "비활성화 중…" : "비활성화"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
