"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToastStore } from "@/store/toast-store";
import { listAdmins } from "@/lib/api/admin-api";
import type { AdminListRow } from "@/types/admin-management";

import CreateAdminModal from "./CreateAdminModal";

export default function AdminListClient() {
  const addToast = useToastStore(state => state.add);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<AdminListRow[]>(
    "/api/v1/admin/admins",
    listAdmins
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      row =>
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            전체 관리자 조회, 신규 등록 및 superuser 권한 지정
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Admin 추가
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름 또는 이메일로 검색"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>부서</TableHead>
              <TableHead className="text-center">활성</TableHead>
              <TableHead className="text-center">Superuser</TableHead>
              <TableHead className="text-right">권한 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  불러오는 중…
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-destructive py-8">
                  조회 실패: {String((error as { message?: string })?.message ?? error)}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(row => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>
                  <Link href={`/admins/${row.id}`} className="block w-full">
                    {row.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admins/${row.id}`} className="block w-full font-medium">
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admins/${row.id}`} className="block w-full">
                    {row.email}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admins/${row.id}`} className="block w-full">
                    {row.univGroupNumber != null
                      ? `${row.univGroupNumber}부 ${row.univGroupName ?? ""}`.trim()
                      : "-"}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/admins/${row.id}`} className="block w-full">
                    {row.isActive ? (
                      <Badge variant="default">활성</Badge>
                    ) : (
                      <Badge variant="secondary">비활성</Badge>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/admins/${row.id}`} className="block w-full">
                    {row.isSuperuser ? (
                      <Badge variant="default">Superuser</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admins/${row.id}`} className="block w-full">
                    {row.assignmentCount}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
