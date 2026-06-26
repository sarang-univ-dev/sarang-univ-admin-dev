"use client";

import { BookOpen, HandHeart, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLeaderReports } from "@/hooks/leader-report/use-leader-reports";
import { ILeaderReport, ILeaderTodayInfo } from "@/types/leader-report";
import { formatDate } from "@/utils/formatDate";

import { LeaderDateControls } from "./LeaderDateControls";

interface LeaderReportsTableProps {
  initialData: ILeaderReport[];
  initialDate: string | null;
  initialToday: ILeaderTodayInfo;
  retreatSlug: string;
  selectedDate?: string | null;
  onSelectedDateChange?: (date: string) => void;
  showDateControls?: boolean;
}

function normalizeText(value: string | number | null | undefined) {
  return String(value ?? "").toLowerCase();
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[120px] rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function LeaderReportsTable({
  initialData,
  initialDate,
  initialToday,
  retreatSlug,
  selectedDate,
  onSelectedDateChange,
  showDateControls = true,
}: LeaderReportsTableProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(
    initialDate ?? initialToday.today ?? initialToday.days[0] ?? null
  );
  const [search, setSearch] = useState("");

  const activeDate = selectedDate ?? internalSelectedDate;
  const setActiveDate = onSelectedDateChange ?? setInternalSelectedDate;

  const reportsOptions = useMemo(
    () => ({
      fallbackData: activeDate === initialDate ? initialData : undefined,
    }),
    [activeDate, initialData, initialDate]
  );

  const { reports } = useLeaderReports(
    retreatSlug,
    activeDate ?? undefined,
    reportsOptions
  );

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return reports;

    return reports.filter(report => {
      const fields = [
        report.reportDate,
        `${report.univGroupNumber}부`,
        `${report.gbsNumber} GBS`,
        report.authorName,
        report.graceSharing,
        report.prayerRequests,
      ];
      return fields.some(field => normalizeText(field).includes(keyword));
    });
  }, [reports, search]);

  const reportCount = filteredReports.length;

  return (
    <div className="space-y-5">
      {showDateControls ? (
        <LeaderDateControls
          retreatSlug={retreatSlug}
          selectedDate={activeDate}
          onSelectedDateChange={setActiveDate}
          initialToday={initialToday}
          showTodayControl={false}
        />
      ) : null}

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            부서 은혜나눔/기도제목
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            기준 일자: {activeDate ?? "-"} · {reportCount}건
          </p>
        </div>

        <div className="relative w-full max-w-xl">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            placeholder="검색 (부서, GBS, 리더, 내용)"
            className="pl-8"
            onChange={event => setSearch(event.target.value)}
          />
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {search ? "검색 결과가 없습니다." : "표시할 보고서가 없습니다."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4">
          {filteredReports.map(report => (
            <Card key={report.id} className="w-full overflow-hidden">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{report.univGroupNumber}부</Badge>
                  <Badge variant="outline">{report.gbsNumber} GBS</Badge>
                  <Badge variant="outline">{report.reportDate}</Badge>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base font-semibold">
                    {report.authorName} 리더
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    수정 {formatDate(report.updatedAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HandHeart className="h-4 w-4 text-green-600" />
                    은혜나눔
                  </div>
                  {report.graceSharing?.trim() ? (
                    <div className="min-h-[120px] rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-gray-800">
                      {report.graceSharing}
                    </div>
                  ) : (
                    <EmptyText>작성된 은혜나눔이 없습니다.</EmptyText>
                  )}
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    기도제목
                  </div>
                  {report.prayerRequests?.trim() ? (
                    <div className="min-h-[120px] rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-gray-800">
                      {report.prayerRequests}
                    </div>
                  ) : (
                    <EmptyText>작성된 기도제목이 없습니다.</EmptyText>
                  )}
                </section>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
