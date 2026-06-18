"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { GenderBadge } from "@/components/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { LineupUnivGroupAdminStaffMemo } from "@/hooks/gbs-line-up/use-lineup-univ-group-admin-staff-memos";
import { formatDate } from "@/utils/formatDate";

interface LineupUnivGroupAdminStaffMemoTableProps {
  memos: LineupUnivGroupAdminStaffMemo[];
}

export function LineupUnivGroupAdminStaffMemoTable({
  memos,
}: LineupUnivGroupAdminStaffMemoTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const rows = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return [...memos]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .filter((memo) => {
        if (!normalizedSearchTerm) return true;

        return [
          `${memo.univGroupNumber}부`,
          `${memo.gradeNumber}학년`,
          memo.name,
          memo.phoneNumber,
          memo.currentLeaderName,
          memo.gbsNumber ? `${memo.gbsNumber}` : "미배정",
          memo.memo,
          memo.createdAdminUserName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm);
      });
  }, [memos, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="이름, 부서, GBS, 메모 검색"
            className="pl-9"
          />
        </div>
        <div className="text-sm text-gray-500">{rows.length}명</div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="whitespace-nowrap text-center">부서</TableHead>
              <TableHead className="whitespace-nowrap text-center">학년</TableHead>
              <TableHead className="whitespace-nowrap text-center">성별</TableHead>
              <TableHead className="whitespace-nowrap">이름</TableHead>
              <TableHead className="whitespace-nowrap">전화번호</TableHead>
              <TableHead className="whitespace-nowrap text-center">GBS</TableHead>
              <TableHead className="whitespace-nowrap">현리더</TableHead>
              <TableHead className="min-w-[280px]">메모</TableHead>
              <TableHead className="whitespace-nowrap">작성자</TableHead>
              <TableHead className="whitespace-nowrap">Created At</TableHead>
              <TableHead className="whitespace-nowrap">Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-32 text-center text-sm text-gray-500"
                >
                  행정간사 메모가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((memo) => (
                <TableRow key={memo.userRetreatRegistrationId}>
                  <TableCell className="whitespace-nowrap text-center">
                    {memo.univGroupNumber}부
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    {memo.gradeNumber}학년
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <GenderBadge gender={memo.gender} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {memo.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <a
                      href={`tel:${memo.phoneNumber}`}
                      className="text-blue-600 hover:underline"
                    >
                      {memo.phoneNumber}
                    </a>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    {memo.gbsNumber ? `${memo.gbsNumber}번` : "미배정"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {memo.currentLeaderName || "-"}
                  </TableCell>
                  <TableCell>
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {memo.memo}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {memo.createdAdminUserName || "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(memo.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(memo.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
