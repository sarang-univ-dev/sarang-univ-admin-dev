"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { Info, Search } from "lucide-react";

import { GenderBadge } from "@/components/Badge";
import { DetailSidebar } from "@/components/common/detail-sidebar";
import { LeaderScheduleChangeStatusBadge } from "@/components/common/retreat";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useLeaderScheduleChangeRequest } from "@/hooks/leader-schedule-change-request/use-leader-schedule-change-request";
import { useConfirm } from "@/hooks/use-confirm";
import { LeaderAdminView } from "@/lib/api/leader-admin-api";
import { TRetreatRegistrationSchedule } from "@/types";
import {
  ILeaderScheduleChangeRequest,
  LeaderScheduleChangeRequestStatus,
} from "@/types/leader-report";
import { generateScheduleColumns } from "@/utils/retreat-utils";

import { LeaderScheduleChangeRequestDetailContent } from "./LeaderScheduleChangeRequestDetailContent";
import { ScheduleChangeCheckboxRows } from "./schedule-slot-utils";

interface LeaderScheduleChangeRequestTableProps {
  initialData: ILeaderScheduleChangeRequest[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
  view?: LeaderAdminView;
}

const STATUS_OPTIONS: {
  value: LeaderScheduleChangeRequestStatus;
  label: string;
}[] = [
  { value: "PENDING", label: "대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "거절" },
];

function hasSchedule(scheduleIds: number[], scheduleId: number) {
  return scheduleIds.some(id => Number(id) === scheduleId);
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? "").toLowerCase();
}

export function LeaderScheduleChangeRequestTable({
  initialData,
  schedules,
  retreatSlug,
  view = "department",
}: LeaderScheduleChangeRequestTableProps) {
  const [status, setStatus] =
    useState<LeaderScheduleChangeRequestStatus>("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarData, setSidebarData] =
    useState<ILeaderScheduleChangeRequest | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] =
    useState<ILeaderScheduleChangeRequest | null>(null);
  const [approvalMemo, setApprovalMemo] = useState("");
  const [approvalAfterScheduleIds, setApprovalAfterScheduleIds] = useState<
    number[]
  >([]);

  const isAllView = view === "all";
  const statusLabel =
    STATUS_OPTIONS.find(option => option.value === status)?.label ?? "대기";

  const requestOptions = useMemo(
    () => ({
      fallbackData: status === "PENDING" ? initialData : undefined,
    }),
    [initialData, status]
  );

  const {
    requests,
    isMutating,
    approveRequest,
    rejectRequest,
    saveMemo,
    updateMemo,
    deleteMemo,
  } = useLeaderScheduleChangeRequest(retreatSlug, status, view, requestOptions);

  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter(request => {
      const fields = [
        request.memberName,
        request.requesterName,
        request.reason,
        request.memo,
        request.status,
        `${request.univGroupNumber}부`,
        `${request.gradeNumber}학년`,
        `${request.gbsNumber}`,
      ];

      return fields.some(field => normalizeSearchValue(field).includes(keyword));
    });
  }, [requests, searchTerm]);

  const confirmDialog = useConfirm();

  const handleRowClick = useCallback((row: ILeaderScheduleChangeRequest) => {
    setSidebarData(row);
    setIsSidebarOpen(true);
  }, []);

  const handleApprove = useCallback(
    (row: ILeaderScheduleChangeRequest) => {
      setApprovalTarget(row);
      setApprovalMemo("");
      setApprovalAfterScheduleIds(row.afterScheduleIds.map(Number));
    },
    []
  );

  const handleCloseApprovalDialog = useCallback(() => {
    if (isMutating) return;
    setApprovalTarget(null);
    setApprovalMemo("");
    setApprovalAfterScheduleIds([]);
  }, [isMutating]);

  const handleApprovalAfterScheduleToggle = useCallback((scheduleId: number) => {
    setApprovalAfterScheduleIds(prev =>
      prev.includes(scheduleId)
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId].sort((a, b) => a - b)
    );
  }, []);

  const handleSubmitApproval = useCallback(async () => {
    if (!approvalTarget) return;

    const memo = approvalMemo.trim();
    if (!memo) return;

    await approveRequest(approvalTarget.id, memo, approvalAfterScheduleIds);
    setApprovalTarget(null);
    setApprovalMemo("");
    setApprovalAfterScheduleIds([]);
  }, [approvalAfterScheduleIds, approvalMemo, approvalTarget, approveRequest]);

  const handleReject = useCallback(
    (row: ILeaderScheduleChangeRequest) => {
      void confirmDialog.open({
        title: "일정 변경 요청 거절",
        description: `${row.memberName}님의 일정 변경 요청을 거절하시겠습니까?`,
        onConfirm: () => rejectRequest(row.id),
      });
    },
    [confirmDialog, rejectRequest]
  );

  const handleStatusChange = useCallback(
    (nextStatus: LeaderScheduleChangeRequestStatus) => {
      if (status === nextStatus) return;
      setStatus(nextStatus);
    },
    [status]
  );

  const renderScheduleCells = (
    rowLabel: "before" | "after",
    request: ILeaderScheduleChangeRequest
  ) => {
    const scheduleIds =
      rowLabel === "before"
        ? request.beforeScheduleIds
        : request.afterScheduleIds;

    return scheduleColumns.map(col => {
      const checked = hasSchedule(scheduleIds, col.id);

      return (
        <TableCell
          key={`${request.id}-${rowLabel}-${col.key}`}
          className="p-2 text-center"
        >
          <Checkbox
            checked={checked}
            disabled
            className={checked ? col.bgColorClass : ""}
          />
        </TableCell>
      );
    });
  };

  const handleSaveMemo = useCallback(
    async (id: string, memo: string) => {
      await saveMemo(Number(id), memo);
    },
    [saveMemo]
  );

  const handleDeleteMemo = useCallback(
    async (id: string) => {
      await deleteMemo(Number(id));
    },
    [deleteMemo]
  );

  const handleUpdateMemo = useCallback(
    async (id: string, memo: string) => {
      await updateMemo(Number(id), memo);
    },
    [updateMemo]
  );

  const emptyColSpan =
    12 +
    scheduleColumns.length +
    1 +
    (isAllView ? 1 : 0);

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {isAllView ? "전체 일정변경 이력" : "부서 인원관리 일정변경 이력"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isAllView ? "전체 부서" : "내 부서"} {statusLabel} 요청{" "}
            ({filteredRequests.length}건)
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="검색 (이름, 요청자, 사유, 부서, 학년, GBS)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {STATUS_OPTIONS.map(option => (
              <Button
                key={option.value}
                size="sm"
                variant={status === option.value ? "default" : "outline"}
                onClick={() => handleStatusChange(option.value)}
                className="h-8 px-3 text-xs whitespace-nowrap"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="max-h-[70vh] overflow-auto">
            <Table className="min-w-full whitespace-nowrap relative text-sm">
              <TableHeader className="bg-gray-100 sticky top-0 z-10 select-none">
                <TableRow>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>리더 부서</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>리더</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>리더 연락처</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>부서</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>성별</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>학년</span>
                    </div>
                  </TableHead>
                  <TableHead
                    className="sticky left-0 bg-gray-100 z-20 px-3 py-2.5"
                    rowSpan={2}
                  >
                    <div className="flex items-center justify-center">
                      <span>이름</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>GBS</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>구분</span>
                    </div>
                  </TableHead>
                  <TableHead
                    colSpan={scheduleColumns.length}
                    className="text-center px-3 py-2.5"
                  >
                    수양회 일정
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>사유</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>상태</span>
                    </div>
                  </TableHead>
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>메모</span>
                    </div>
                  </TableHead>
                  {isAllView ? (
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center justify-center">
                        <span>액션</span>
                      </div>
                    </TableHead>
                  ) : null}
                  <TableHead className="px-3 py-2.5" rowSpan={2}>
                    <div className="flex items-center justify-center">
                      <span>상세</span>
                    </div>
                  </TableHead>
                </TableRow>
                <TableRow>
                  {scheduleColumns.map(scheduleCol => (
                    <TableHead
                      key={scheduleCol.key}
                      className="p-2 text-center"
                    >
                      <div className="flex items-center justify-center">
                        <span className="text-xs whitespace-normal">
                          {scheduleCol.label}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={emptyColSpan}
                      className="text-center py-10 text-gray-500"
                    >
                      {searchTerm
                        ? "검색 결과가 없습니다."
                        : "표시할 요청이 없습니다."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(request => {
                    const disabled = request.status !== "PENDING" || isMutating;

                    return (
                      <Fragment key={request.id}>
                        <TableRow
                          className="group cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => handleRowClick(request)}
                        >
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.requesterUnivGroupNumber
                              ? `${request.requesterUnivGroupNumber}부`
                              : "-"}
                          </TableCell>
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.requesterName}
                          </TableCell>
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.requesterPhoneNumber || "-"}
                          </TableCell>
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.univGroupNumber}부
                          </TableCell>
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            <GenderBadge gender={request.gender} />
                          </TableCell>
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.gradeNumber}학년
                          </TableCell>
                          <TableCell
                            className="sticky left-0 bg-white group-hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.memberName}
                          </TableCell>
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.gbsNumber ?? "-"}
                          </TableCell>
                          <TableCell className="text-center px-3 py-2.5 font-medium">
                            변경 전
                          </TableCell>
                          {renderScheduleCells("before", request)}
                          <TableCell
                            className="text-center text-sm whitespace-pre-wrap break-words min-w-[140px] max-w-[260px] px-3 py-2.5"
                            rowSpan={2}
                          >
                            {request.reason || "-"}
                          </TableCell>
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            <div className="flex justify-center">
                              <LeaderScheduleChangeStatusBadge
                                status={request.status}
                              />
                            </div>
                          </TableCell>
                          <TableCell
                            className="min-w-[240px] max-w-[360px] px-2 py-2.5"
                            rowSpan={2}
                          >
                            <MemoEditor
                              row={{ id: String(request.id) }}
                              memoValue={request.memo}
                              onSave={handleSaveMemo}
                              onUpdate={async (_id, memo) => {
                                if (request.memoId) {
                                  await handleUpdateMemo(
                                    String(request.memoId),
                                    memo
                                  );
                                }
                              }}
                              onDelete={async () => {
                                if (request.memoId) {
                                  await handleDeleteMemo(
                                    String(request.memoId)
                                  );
                                }
                              }}
                              hasExistingMemo={() =>
                                Boolean(request.memo && request.memoId)
                              }
                            />
                          </TableCell>
                          {isAllView ? (
                            <TableCell
                              className="text-center px-3 py-2.5"
                              rowSpan={2}
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={disabled}
                                  onClick={event => {
                                    event.stopPropagation();
                                    handleApprove(request);
                                  }}
                                  className="h-8 px-3 whitespace-nowrap text-xs hover:bg-green-600 hover:text-white transition-colors"
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={disabled}
                                  onClick={event => {
                                    event.stopPropagation();
                                    handleReject(request);
                                  }}
                                  className="h-8 px-3 whitespace-nowrap text-xs hover:bg-red-600 hover:text-white transition-colors"
                                >
                                  거절
                                </Button>
                              </div>
                            </TableCell>
                          ) : null}
                          <TableCell
                            className="text-center px-3 py-2.5"
                            rowSpan={2}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={event => {
                                event.stopPropagation();
                                handleRowClick(request);
                              }}
                              className="h-8 px-3 whitespace-nowrap"
                            >
                              <Info className="h-4 w-4 mr-1" />
                              보기
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow
                          className="group cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => handleRowClick(request)}
                        >
                          <TableCell className="text-center px-3 py-2.5 font-medium">
                            변경 후
                          </TableCell>
                          {renderScheduleCells("after", request)}
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(approvalTarget)}
        onOpenChange={open => {
          if (!open) {
            handleCloseApprovalDialog();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>일정 변경 요청 승인</DialogTitle>
            <DialogDescription>
              승인할 일정 변경 내용을 확인하고 메모를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          {approvalTarget ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-md border bg-gray-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <div className="text-xs text-muted-foreground">부서</div>
                  <div className="mt-1 font-medium">
                    {approvalTarget.univGroupNumber}부
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">성별</div>
                  <div className="mt-1">
                    <GenderBadge gender={approvalTarget.gender} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">학년</div>
                  <div className="mt-1 font-medium">
                    {approvalTarget.gradeNumber}학년
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">이름</div>
                  <div className="mt-1 font-medium">
                    {approvalTarget.memberName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">GBS</div>
                  <div className="mt-1 font-medium">
                    {approvalTarget.gbsNumber ?? "-"}
                  </div>
                </div>
              </div>

              <ScheduleChangeCheckboxRows
                beforeScheduleIds={approvalTarget.beforeScheduleIds}
                afterScheduleIds={approvalAfterScheduleIds}
                schedules={schedules}
                fitContainer
                editableAfterScheduleIds={approvalAfterScheduleIds}
                onAfterScheduleToggle={handleApprovalAfterScheduleToggle}
                disabled={isMutating}
              />
              <p className="text-xs text-muted-foreground">
                변경 후 일정을 여기서 조정한 값으로 승인합니다. 모두 해제하면
                전체 취소 요청으로 재정에서 취소/환불 여부를 선택합니다.
              </p>

              {approvalTarget.reason ? (
                <div className="rounded-md border bg-white p-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    리더 요청 사유
                  </div>
                  <div className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {approvalTarget.reason}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="leader-schedule-change-approval-memo">
                  일정 변경 메모
                </Label>
                <Textarea
                  id="leader-schedule-change-approval-memo"
                  value={approvalMemo}
                  onChange={event => setApprovalMemo(event.target.value)}
                  placeholder="일정 변경 내용을 입력하세요."
                  className="min-h-28"
                  disabled={isMutating}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseApprovalDialog}
              disabled={isMutating}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmitApproval()}
              disabled={!approvalMemo.trim() || isMutating}
            >
              {isMutating ? "승인 중..." : "승인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        data={sidebarData}
        title="일정 변경 요청 상세"
      >
        {data => (
          <LeaderScheduleChangeRequestDetailContent
            data={data}
            schedules={schedules}
          />
        )}
      </DetailSidebar>

    </>
  );
}
