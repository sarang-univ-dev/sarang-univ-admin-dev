"use client";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LucideIcon,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderAttendance } from "@/hooks/leader-report/use-leader-attendance";
import { useLeaderReportSubmissionStatus } from "@/hooks/leader-report/use-leader-report-submission-status";
import { useLeaderScheduleChangeRequest } from "@/hooks/leader-schedule-change-request/use-leader-schedule-change-request";
import { LeaderAdminAPI } from "@/lib/api/leader-admin-api";
import { TRetreatRegistrationSchedule } from "@/types";
import {
  ILeaderAttendance,
  ILeaderMemberMemo,
  ILeaderReportSubmissionStatus,
  ILeaderScheduleChangeRequest,
  ILeaderTodayInfo,
} from "@/types/leader-report";

import { LeaderScheduleChangeRequestTable } from "../leader-schedule-change-request";
import { LeaderAttendanceTable } from "./LeaderAttendanceTable";
import { LeaderDateControls } from "./LeaderDateControls";
import { LeaderReportSubmissionStatusTable } from "./LeaderReportSubmissionStatusTable";

interface LeaderOperationsDashboardProps {
  initialAttendance: ILeaderAttendance[];
  initialAttendanceDate: string | null;
  initialSubmissionStatus: ILeaderReportSubmissionStatus[];
  initialSubmissionDate: string | null;
  initialScheduleChangeRequests: ILeaderScheduleChangeRequest[];
  initialToday: ILeaderTodayInfo;
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

type DashboardTab =
  | "overview"
  | "attendance"
  | "submission"
  | "schedule"
  | "memo";

const TAB_DESCRIPTIONS: Record<DashboardTab, string> = {
  overview: "전체 운영 현황",
  attendance: "해당 일자 일정이 있는 전체 인원 기준",
  submission: "해당 일자 일정이 있는 전체 리더 기준",
  schedule: "전체 부서 리더 일정변경 요청 기준",
  memo: "해당 일자 비고가 있는 전체 조원 기준",
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "green" | "blue" | "amber" | "gray";
}) {
  const toneClass = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  }[tone];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className={`rounded-md border p-1.5 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

export function LeaderOperationsDashboard({
  initialAttendance,
  initialAttendanceDate,
  initialSubmissionStatus,
  initialSubmissionDate,
  initialScheduleChangeRequests,
  initialToday,
  schedules,
  retreatSlug,
}: LeaderOperationsDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(
    initialToday.today ??
      initialAttendanceDate ??
      initialSubmissionDate ??
      initialToday.days[0] ??
      null
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const attendanceOptions = useMemo(
    () => ({
      fallbackData:
        selectedDate === initialAttendanceDate && initialAttendanceDate != null
          ? { attendance: initialAttendance, date: initialAttendanceDate }
          : undefined,
    }),
    [initialAttendance, initialAttendanceDate, selectedDate]
  );
  const submissionStatusOptions = useMemo(
    () => ({
      fallbackData:
        selectedDate === initialSubmissionDate && initialSubmissionDate != null
          ? {
              submissionStatus: initialSubmissionStatus,
              date: initialSubmissionDate,
            }
          : undefined,
    }),
    [initialSubmissionDate, initialSubmissionStatus, selectedDate]
  );
  const scheduleChangeRequestOptions = useMemo(
    () => ({
      fallbackData: initialScheduleChangeRequests,
    }),
    [initialScheduleChangeRequests]
  );

  const { attendance } = useLeaderAttendance(
    retreatSlug,
    selectedDate ?? undefined,
    "all",
    attendanceOptions
  );
  const { submissionStatus } = useLeaderReportSubmissionStatus(
    retreatSlug,
    selectedDate ?? undefined,
    "all",
    submissionStatusOptions
  );
  const { requests } = useLeaderScheduleChangeRequest(
    retreatSlug,
    "PENDING",
    "all",
    scheduleChangeRequestOptions
  );

  // 비고 모아보기 — 한 곳에서만 쓰므로 인라인 (해당 일자 비고 있는 전 조원)
  const { data: memoData } = useSWR(
    selectedDate
      ? `/api/v1/retreat/${retreatSlug}/leader/admin/member-memos?date=${selectedDate}`
      : null,
    () =>
      LeaderAdminAPI.getMemberMemos(retreatSlug, selectedDate ?? undefined),
    { revalidateOnFocus: false, refreshInterval: 15000, dedupingInterval: 5000 }
  );
  const memos: ILeaderMemberMemo[] = memoData?.memos ?? [];

  const summary = useMemo(() => {
    const present = attendance.filter(
      member => member.attendanceStatus === "PRESENT"
    ).length;
    const submitted = submissionStatus.filter(row => row.submitted).length;

    return {
      attendance: `${present} / ${attendance.length}`,
      reports: `${submitted} / ${submissionStatus.length}`,
      pendingRequests: `${requests.length}건`,
      selectedDate: selectedDate ?? "-",
    };
  }, [attendance, requests.length, selectedDate, submissionStatus]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          인원관리 간사 조회
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {TAB_DESCRIPTIONS[activeTab]} · 기준 일자: {summary.selectedDate}
        </p>
      </div>

      <LeaderDateControls
        retreatSlug={retreatSlug}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        initialToday={initialToday}
      />

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as DashboardTab)}
        className="space-y-4"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 md:w-fit">
          <TabsTrigger value="overview">전체</TabsTrigger>
          <TabsTrigger value="attendance">출석 현황</TabsTrigger>
          <TabsTrigger value="submission">보고서 제출현황</TabsTrigger>
          <TabsTrigger value="schedule">일정변경 이력</TabsTrigger>
          <TabsTrigger value="memo">비고</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Users}
              label="조회 기준일자"
              value={summary.selectedDate}
              tone="gray"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="출석"
              value={summary.attendance}
              tone="green"
            />
            <SummaryCard
              icon={ClipboardList}
              label="보고서 제출"
              value={summary.reports}
              tone="blue"
            />
            <SummaryCard
              icon={CalendarClock}
              label="대기중 일정변경"
              value={summary.pendingRequests}
              tone="amber"
            />
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <LeaderAttendanceTable
            initialAttendance={initialAttendance}
            initialDate={initialAttendanceDate}
            initialToday={initialToday}
            retreatSlug={retreatSlug}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            showDateControls={false}
            title="전체 출석 현황"
            view="all"
          />
        </TabsContent>

        <TabsContent value="submission">
          <LeaderReportSubmissionStatusTable
            initialData={initialSubmissionStatus}
            initialDate={initialSubmissionDate}
            initialToday={initialToday}
            retreatSlug={retreatSlug}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            showDateControls={false}
            view="all"
          />
        </TabsContent>

        <TabsContent value="schedule">
          <LeaderScheduleChangeRequestTable
            initialData={initialScheduleChangeRequests}
            schedules={schedules}
            retreatSlug={retreatSlug}
            view="all"
          />
        </TabsContent>

        <TabsContent value="memo" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">전체 비고</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                해당 일자 비고가 있는 전체 조원 기준 · 기준 일자:{" "}
                {summary.selectedDate}
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
              <span className="whitespace-nowrap text-sm font-medium text-gray-700">
                비고 {memos.length}건
              </span>
            </div>
          </div>

          {memos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              해당 일자에 등록된 비고가 없습니다.
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {memos.map(m => (
                <div
                  key={m.userRetreatRegistrationId}
                  className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:gap-4"
                >
                  <div className="shrink-0 text-sm sm:w-56">
                    <span className="font-medium">{m.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {m.univGroupNumber}부 · {m.gradeNumber}학년 ·{" "}
                      {m.gbsNumber ?? "-"}GBS
                    </span>
                  </div>
                  <div className="flex-1 whitespace-pre-wrap break-keep text-sm">
                    {m.memo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
