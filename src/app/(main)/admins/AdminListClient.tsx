"use client";

import { debounce } from "lodash";
import { Ban, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

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

export default function AdminListClient() {
  const addToast = useToastStore(state => state.add);
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminListRow | null>(
    null
  );
  const [deactivating, setDeactivating] = useState(false);

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

  const groupedRows = useMemo(() => {
    const q = globalFilter.toLowerCase().trim();
    const filteredRows = rows.filter(row => {
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.univGroupNumber != null &&
          `${row.univGroupNumber}부`.includes(q))
      );
    });

    return Object.values(
      filteredRows.reduce<
        Record<
          string,
          {
            univGroupNumber: number | null;
            rows: AdminListRow[];
          }
        >
      >((groups, row) => {
        const key =
          row.univGroupNumber == null
            ? "unknown"
            : row.univGroupNumber.toString();

        groups[key] ??= {
          univGroupNumber: row.univGroupNumber,
          rows: [],
        };
        groups[key].rows.push(row);
        return groups;
      }, {})
    )
      .sort((a, b) => {
        if (a.univGroupNumber == null) return 1;
        if (b.univGroupNumber == null) return -1;
        return a.univGroupNumber - b.univGroupNumber;
      })
      .map(group => ({
        ...group,
        rows: group.rows.sort((a, b) => {
          const nameCompare = a.name.localeCompare(b.name, "ko");
          if (nameCompare !== 0) return nameCompare;
          return a.email.localeCompare(b.email);
        }),
      }));
  }, [globalFilter, rows]);

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
          현재는 수양회 생성 및 전역 수양회 관리 권한을 가진 관리자 계정을
          조회하고 추가합니다. 이후 권한 범위는 확장될 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>관리자 목록</CardTitle>
            <CardDescription>
              {data
                ? `총 ${data.length}명, ${groupedRows.length}개 부서`
                : "불러오는 중…"}
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
          ) : groupedRows.length === 0 ? (
            <div className="border rounded-lg py-12 text-center text-muted-foreground">
              결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedRows.map(group => (
                <section
                  key={group.univGroupNumber ?? "unknown"}
                  className="overflow-hidden rounded-lg border"
                >
                  <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                    <h2 className="text-sm font-semibold">
                      {group.univGroupNumber == null
                        ? "부서 없음"
                        : `${group.univGroupNumber}부`}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {group.rows.length}명
                    </span>
                  </div>
                  <div className="divide-y">
                    {group.rows.map(row => (
                      <div
                        key={row.id}
                        className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(120px,0.8fr)_minmax(180px,1.4fr)_auto]"
                      >
                        <div className="min-w-0">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {row.email}
                          </div>
                        </div>
                        <div className="hidden min-w-0 items-center text-sm text-muted-foreground md:flex">
                          <span className="truncate">{row.email}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 md:justify-end">
                          <span className="text-xs text-muted-foreground">
                            역할 {row.assignmentCount}개
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeactivateTarget(row)}
                          >
                            <Ban className="mr-1 h-4 w-4" />
                            비활성화
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
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
