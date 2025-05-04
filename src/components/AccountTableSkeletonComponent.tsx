"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountTableSkeletonComponent() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5 text-center">입금 확인 페이지</h1>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-center">
                부서
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                성별
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                학년
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                이름
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                휴대전화
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                일정
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                등록 시각
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                등록비
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                등록 상태
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                문자 전송
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-6 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-32 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Badge className="bg-gray-200">
                    <Skeleton className="h-4 w-20" />
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Button disabled className="bg-slate-300">
                    <Skeleton className="h-4 w-24" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
