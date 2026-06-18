"use client";

import { AxiosError } from "axios";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  Search,
  UserCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { GenderBadge } from "@/components/Badge";
import {
  DetailSidebar,
  InfoItem,
  InfoSection,
} from "@/components/common/detail-sidebar";
import { RetreatScheduleTable } from "@/components/common/retreat/RetreatScheduleTable";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { IUserScheduleChangeLineup } from "@/hooks/user-schedule-change-lineup-request";
import { webAxios } from "@/lib/api/axios";
import useUserRole from "@/lib/hooks/swr/useUserRole";
import { useToastStore } from "@/store/toast-store";
import {
  RetreatAdminUserRole,
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationScheduleHistoryMemoType,
} from "@/types";
import { formatDate } from "@/utils/formatDate";

import { generateScheduleColumns } from "../utils/retreat-utils";

type ScheduleChangeHistoryRow = {
  id: string;
  historyId: number;
  registrationId: number;
  department: string;
  gender: IUserScheduleChangeLineup["gender"];
  grade: string;
  name: string;
  phone: string;
  currentLeader: string;
  gbsNumber?: number;
  gbsLeaderNames?: string[];
  schedule: Record<string, boolean>;
  price: number;
  userName?: string | null;
  timestamp?: string | null;
  type: "before" | "after";
  rowIndex: number;
  lineupReviewerName?: string | null;
  lineupReviewedAt?: string | null;
  history: IUserScheduleChangeLineup;
};

const scheduleHistoryMemoSections = [
  {
    label: "행정간사 메모",
    memoType: UserRetreatRegistrationScheduleHistoryMemoType.UNIV_GROUP_ADMIN_STAFF,
    role: RetreatAdminUserRole.UNIV_GROUP_ADMIN_STAFF,
    placeholder: "행정간사 메모를 입력하세요",
  },
  {
    label: "재정간사 메모",
    memoType: UserRetreatRegistrationScheduleHistoryMemoType.ACCOUNT_STAFF,
    role: RetreatAdminUserRole.ACCOUNT_STAFF,
    placeholder: "재정간사 메모를 입력하세요",
  },
  {
    label: "인원관리간사 메모",
    memoType: UserRetreatRegistrationScheduleHistoryMemoType.DORMITORY_STAFF,
    role: RetreatAdminUserRole.DORMITORY_STAFF,
    placeholder: "인원관리간사 메모를 입력하세요",
  },
  {
    label: "라인업간사 메모",
    memoType: UserRetreatRegistrationScheduleHistoryMemoType.LINEUP_STAFF,
    role: RetreatAdminUserRole.LINEUP_STAFF,
    placeholder: "라인업간사 메모를 입력하세요",
  },
];

const roleToScheduleHistoryMemoType: Partial<
  Record<string, UserRetreatRegistrationScheduleHistoryMemoType>
> = Object.fromEntries(
  scheduleHistoryMemoSections.map(section => [section.role, section.memoType])
);

const buildScheduleMap = (
  scheduleIds: number[],
  schedules: TRetreatRegistrationSchedule[]
) =>
  schedules.reduce(
    (acc, cur) => {
      const scheduleId = cur.id;
      const isIncluded =
        scheduleIds.includes(scheduleId) ||
        scheduleIds.includes(scheduleId.toString() as any) ||
        scheduleIds.includes(parseInt(scheduleId.toString()));

      acc[`schedule_${cur.id}`] = isIncluded;
      return acc;
    },
    {} as Record<string, boolean>
  );

const transformScheduleChangeHistoriesForTable = (
  histories: IUserScheduleChangeLineup[],
  schedules: TRetreatRegistrationSchedule[]
) => {
  const transformedData: ScheduleChangeHistoryRow[] = [];

  histories.forEach((history, index) => {
    const beforeScheduleIds = Array.isArray(
      history.beforeUserRetreatRegistrationScheduleIds
    )
      ? history.beforeUserRetreatRegistrationScheduleIds
      : [];
    const afterScheduleIds = Array.isArray(
      history.afterUserRetreatRegistrationScheduleIds
    )
      ? history.afterUserRetreatRegistrationScheduleIds
      : [];

    const common = {
      historyId: history.userRetreatRegistrationScheduleHistoryId,
      registrationId: history.userRetreatRegistrationId,
      department: `${history.univGroupNumber}부`,
      gender: history.gender,
      grade: `${history.gradeNumber}학년`,
      name: history.userName,
      phone: history.phoneNumber,
      currentLeader: history.currentLeaderName,
      gbsNumber: history.gbsNumber,
      gbsLeaderNames: history.gbsLeaderNames,
      rowIndex: index,
      lineupReviewerName: history.lineupReviewerName,
      lineupReviewedAt: history.lineupReviewedAt,
      history,
    };

    transformedData.push(
      {
        ...common,
        id: `${history.userRetreatRegistrationScheduleHistoryId}_before`,
        schedule: buildScheduleMap(beforeScheduleIds, schedules),
        price: history.beforePrice,
        userName: history.createdUserName,
        timestamp: history.historyCreatedAt,
        type: "before",
      },
      {
        ...common,
        id: `${history.userRetreatRegistrationScheduleHistoryId}_after`,
        schedule: buildScheduleMap(afterScheduleIds, schedules),
        price: history.afterPrice,
        userName: history.resolvedUserName,
        timestamp: history.resolvedAt,
        type: "after",
      }
    );
  });

  return transformedData;
};

function ScheduleHistoryDetailContent({
  history,
  schedules,
  editableMemoTypes,
  onCreateMemo,
  onUpdateMemo,
  onDeleteMemo,
}: {
  history: IUserScheduleChangeLineup;
  schedules: TRetreatRegistrationSchedule[];
  editableMemoTypes: Set<UserRetreatRegistrationScheduleHistoryMemoType>;
  onCreateMemo: (
    historyId: number,
    memoType: UserRetreatRegistrationScheduleHistoryMemoType,
    memo: string
  ) => Promise<void>;
  onUpdateMemo: (memoId: number, memo: string) => Promise<void>;
  onDeleteMemo: (memoId: number) => Promise<void>;
}) {
  return (
    <>
      <InfoSection title="기본 정보" icon={UserCircle} columns={2}>
        <InfoItem label="이름" value={history.userName} />
        <InfoItem label="부서" value={`${history.univGroupNumber}부`} />
        <InfoItem label="학년" value={`${history.gradeNumber}학년`} />
        <InfoItem label="성별" value={<GenderBadge gender={history.gender} />} />
        <InfoItem label="전화번호" value={history.phoneNumber || "-"} />
        <InfoItem label="현재 리더" value={history.currentLeaderName || "-"} />
        <InfoItem label="GBS" value={history.gbsNumber ?? "-"} />
      </InfoSection>

      <InfoSection title="변경 정보" icon={CreditCard}>
        <InfoItem
          label="변경 전 금액"
          value={`${history.beforePrice?.toLocaleString()}원`}
        />
        <InfoItem
          label="변경 후 금액"
          value={`${history.afterPrice?.toLocaleString()}원`}
        />
        <InfoItem label="처리자" value={history.resolvedUserName || "-"} />
        <InfoItem
          label="처리시각"
          value={formatDate(history.resolvedAt ?? null) || "-"}
        />
        <InfoItem
          label="라인업 확인"
          value={
            history.lineupReviewerName
              ? `${history.lineupReviewerName} / ${
                  formatDate(history.lineupReviewedAt ?? null) || "-"
                }`
              : "미확인"
          }
        />
      </InfoSection>

      <InfoSection title="변경 전 일정" icon={Calendar}>
        <RetreatScheduleTable
          schedules={schedules}
          selectedScheduleIds={history.beforeUserRetreatRegistrationScheduleIds.map(
            Number
          )}
          readonly
        />
      </InfoSection>

      <InfoSection title="변경 후 일정" icon={Calendar}>
        <RetreatScheduleTable
          schedules={schedules}
          selectedScheduleIds={history.afterUserRetreatRegistrationScheduleIds.map(
            Number
          )}
          readonly
        />
      </InfoSection>

      <InfoSection title="역할별 메모" icon={FileText}>
        <div className="space-y-4">
          {scheduleHistoryMemoSections.map(section => {
            const memo = history.scheduleHistoryMemos?.[section.memoType];
            const canEdit = editableMemoTypes.has(section.memoType);
            const editorRow = {
              id: `${history.userRetreatRegistrationScheduleHistoryId}-${section.memoType}`,
            };

            return (
              <div key={section.memoType} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {section.label}
                  </p>
                  {!canEdit && (
                    <span className="text-xs text-gray-400">읽기 전용</span>
                  )}
                </div>

                {canEdit ? (
                  <MemoEditor
                    row={editorRow}
                    memoValue={memo?.memo}
                    onSave={async (_, nextMemo) => {
                      await onCreateMemo(
                        history.userRetreatRegistrationScheduleHistoryId,
                        section.memoType,
                        nextMemo
                      );
                    }}
                    onUpdate={async (_, nextMemo) => {
                      if (memo?.id) {
                        await onUpdateMemo(memo.id, nextMemo);
                      }
                    }}
                    onDelete={async () => {
                      if (memo?.id) {
                        await onDeleteMemo(memo.id);
                      }
                    }}
                    hasExistingMemo={() => Boolean(memo?.id)}
                    placeholder={section.placeholder}
                  />
                ) : (
                  <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap break-words min-h-[44px]">
                    {memo?.memo || "메모가 없습니다."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </InfoSection>
    </>
  );
}

export function RetreatScheduleChangeHistoryTable({
  scheduleChangeHistories = [],
  schedules = [],
  retreatSlug,
  mutate,
}: {
  scheduleChangeHistories: IUserScheduleChangeLineup[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
  mutate?: () => Promise<any>;
}) {
  const addToast = useToastStore(state => state.add);
  const [allData, setAllData] = useState<ScheduleChangeHistoryRow[]>([]);
  const [filteredData, setFilteredData] = useState<ScheduleChangeHistoryRow[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const confirmDialog = useConfirm();
  const { userRole } = useUserRole(retreatSlug);
  const [selectedHistory, setSelectedHistory] =
    useState<IUserScheduleChangeLineup | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  const editableMemoTypes = useMemo(() => {
    return new Set(
      (userRole ?? [])
        .map(role => roleToScheduleHistoryMemoType[role.role])
        .filter(
          (
            memoType
          ): memoType is UserRetreatRegistrationScheduleHistoryMemoType =>
            Boolean(memoType)
        )
    );
  }, [userRole]);
  const canResolveLineupReview = useMemo(
    () =>
      userRole?.some(role => role.role === RetreatAdminUserRole.LINEUP_STAFF),
    [userRole]
  );

  useEffect(() => {
    if (scheduleChangeHistories.length > 0 && schedules.length > 0) {
      try {
        setAllData(
          transformScheduleChangeHistoriesForTable(
            scheduleChangeHistories,
            schedules
          )
        );
      } catch (error) {
        console.error("데이터 변환 중 오류 발생:", error);
        addToast({
          title: "오류",
          description:
            error instanceof AxiosError
              ? error.response?.data?.message || error.message
              : error instanceof Error
                ? error.message
                : "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } else {
      setAllData([]);
    }
  }, [scheduleChangeHistories, schedules, addToast]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(allData);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchedRowIndexes = new Set(
      allData
        .filter(row =>
          [
            row.name,
            row.department,
            row.grade,
            row.phone,
            row.currentLeader,
            row.gbsNumber?.toString(),
            row.userName,
            row.lineupReviewerName,
          ].some(field => field?.toLowerCase().includes(lowerSearchTerm))
        )
        .map(row => row.rowIndex)
    );

    setFilteredData(allData.filter(row => matchedRowIndexes.has(row.rowIndex)));
  }, [allData, searchTerm]);

  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  const isLoading = (id: string, action: string) => {
    return !!loadingStates[`${id}_${action}`];
  };

  const refreshHistory = async (historyId: number) => {
    const nextData = (await mutate?.()) as
      | IUserScheduleChangeLineup[]
      | undefined;
    const nextHistory = nextData?.find(
      item => item.userRetreatRegistrationScheduleHistoryId === historyId
    );

    if (nextHistory) {
      setSelectedHistory(nextHistory);
    }
  };

  const performResolveChange = async (historyId: number) => {
    setLoading(historyId.toString(), "confirm", true);

    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/line-up/schedule-history/resolve`,
        {
          userRetreatRegistrationScheduleHistoryId: historyId,
        }
      );

      addToast({
        title: "성공",
        description: "일정 변경 이력이 읽음 처리되었습니다.",
        variant: "success",
      });

      await refreshHistory(historyId);
    } catch (error) {
      console.error("일정 변경 이력 읽음 처리 중 오류 발생:", error);
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "일정 변경 이력 읽음 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(historyId.toString(), "confirm", false);
    }
  };

  const handleResolveChange = (historyId: number) => {
    void confirmDialog.open({
      title: "일정 변경 이력 읽음 처리",
      description: "정말로 이 일정 변경 이력을 읽음 처리하시겠습니까?",
      onConfirm: () => performResolveChange(historyId),
    });
  };

  const createScheduleHistoryMemo = async (
    historyId: number,
    memoType: UserRetreatRegistrationScheduleHistoryMemoType,
    memo: string
  ) => {
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/line-up/schedule-history/${historyId}/memo`,
        { memoType, memo }
      );
      addToast({
        title: "성공",
        description: "메모가 저장되었습니다.",
        variant: "success",
      });
      await refreshHistory(historyId);
    } catch (error) {
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateScheduleHistoryMemo = async (memoId: number, memo: string) => {
    const historyId = selectedHistory?.userRetreatRegistrationScheduleHistoryId;

    try {
      await webAxios.put(
        `/api/v1/retreat/${retreatSlug}/line-up/schedule-history-memos/${memoId}`,
        { memo }
      );
      addToast({
        title: "성공",
        description: "메모가 수정되었습니다.",
        variant: "success",
      });
      if (historyId) {
        await refreshHistory(historyId);
      }
    } catch (error) {
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "메모 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteScheduleHistoryMemo = async (memoId: number) => {
    const historyId = selectedHistory?.userRetreatRegistrationScheduleHistoryId;

    try {
      await webAxios.delete(
        `/api/v1/retreat/${retreatSlug}/line-up/schedule-history-memos/${memoId}`
      );
      addToast({
        title: "성공",
        description: "메모가 삭제되었습니다.",
        variant: "success",
      });
      if (historyId) {
        await refreshHistory(historyId);
      }
    } catch (error) {
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "메모 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const renderLineupReviewCell = (row: ScheduleChangeHistoryRow) => {
    if (row.lineupReviewerName) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-green-600">
            {row.lineupReviewerName}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(row.lineupReviewedAt ?? null)}
          </span>
        </div>
      );
    }

    if (!canResolveLineupReview) {
      return <span className="text-sm text-gray-500">미확인</span>;
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={event => {
          event.stopPropagation();
          handleResolveChange(row.historyId);
        }}
        disabled={isLoading(row.historyId.toString(), "confirm")}
        className="inline-flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
      >
        {isLoading(row.historyId.toString(), "confirm") ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        <span>읽음 처리</span>
      </Button>
    );
  };

  const renderTableRow = (row: ScheduleChangeHistoryRow) => {
    const isBeforeRow = row.type === "before";

    return (
      <TableRow
        key={row.id}
        onClick={() => {
          setSelectedHistory(row.history);
          setIsDetailOpen(true);
        }}
        className="group hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
      >
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            {row.department}
          </TableCell>
        )}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            <GenderBadge gender={row.gender} />
          </TableCell>
        )}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            {row.grade}
          </TableCell>
        )}
        {isBeforeRow && (
          <TableCell
            className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center px-3 py-2.5"
            rowSpan={2}
          >
            {row.name}
          </TableCell>
        )}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            {row.phone || "-"}
          </TableCell>
        )}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            {row.currentLeader || "-"}
          </TableCell>
        )}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            {row.gbsNumber ?? "-"}
          </TableCell>
        )}

        <TableCell className="text-center px-3 py-2.5 font-medium">
          {isBeforeRow ? "변경 전" : "변경 후"}
        </TableCell>

        {scheduleColumns.map(col => {
          const isChecked = !!row.schedule?.[col.key];

          return (
            <TableCell key={`${row.id}-${col.key}`} className="p-2 text-center">
              <Checkbox
                checked={isChecked}
                disabled
                className={isChecked ? col.bgColorClass : ""}
              />
            </TableCell>
          );
        })}

        <TableCell className="font-medium text-center px-3 py-2.5">
          {row.price?.toLocaleString()}원
        </TableCell>
        <TableCell className="text-center px-3 py-2.5">
          {row.userName || "-"}
        </TableCell>
        <TableCell className="text-gray-600 text-xs text-center whitespace-nowrap px-3 py-2.5">
          {formatDate(row.timestamp ?? null) || "-"}
        </TableCell>

        {isBeforeRow && (
          <TableCell className="font-medium text-center px-3 py-2.5" rowSpan={2}>
            {renderLineupReviewCell(row)}
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <>
      <Card className="shadow-sm">
      <CardHeader className="bg-gray-50 border-b px-4 py-3">
        <div>
          <CardTitle className="text-lg">일정 변경 이력 조회</CardTitle>
          <CardDescription className="text-sm">
            라인업 확인이 필요한 일정 변경 이력 목록
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="통합 검색 (이름, 부서, 학년, 전화번호, 리더, GBS, 처리자 등)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            className="rounded-md border overflow-hidden"
            ref={tableContainerRef}
          >
            <div className="max-h-[80vh] overflow-auto">
              <Table className="min-w-full whitespace-nowrap relative text-sm">
                <TableHeader className="bg-gray-100 sticky top-0 z-10 select-none">
                  <TableRow>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>부서</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>성별</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>학년</span>
                      </div>
                    </TableHead>
                    <TableHead
                      className="sticky left-0 bg-gray-100 z-20 px-3 py-2.5"
                      rowSpan={2}
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>이름</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>전화번호</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>현재 리더</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>GBS</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
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
                      <div className="flex items-center space-x-1 justify-center">
                        <span>금액</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>처리자명</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-3 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>처리시각</span>
                      </div>
                    </TableHead>
                    <TableHead className="px-6 py-2.5" rowSpan={2}>
                      <div className="flex items-center space-x-1 justify-center">
                        <span>라인업 확인</span>
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
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={12 + scheduleColumns.length}
                        className="text-center py-10 text-gray-500"
                      >
                        {allData.length > 0
                          ? "검색 결과가 없습니다."
                          : "표시할 데이터가 없습니다."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredData.map(row => renderTableRow(row))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
      </Card>

      <DetailSidebar
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        data={selectedHistory}
        title="일정 변경 이력 상세"
        className="!w-[680px] !max-w-[95vw]"
        preventDismissWhenAlertDialogOpen
      >
        {history => (
          <ScheduleHistoryDetailContent
            history={history}
            schedules={schedules}
            editableMemoTypes={editableMemoTypes}
            onCreateMemo={createScheduleHistoryMemo}
            onUpdateMemo={updateScheduleHistoryMemo}
            onDeleteMemo={deleteScheduleHistoryMemo}
          />
        )}
      </DetailSidebar>
    </>
  );
}
