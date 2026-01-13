"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { useSWRConfig } from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useAllDormitories } from "@/hooks/use-available-dormitories";
import { useDormitoryStaff } from "@/hooks/use-dormitory-staff";
import { useRetreatSchedules } from "@/hooks/use-retreat-schedules";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import {
  Gender,
  RetreatRegistrationScheduleType,
} from "@/types";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import type { DormitoryAssignmentPreview } from "@/types/dormitory-assignment";

const normalizeDormitoryLocation = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

type ScheduleColumn = ReturnType<typeof generateScheduleColumns>[number];

type PersonRow = {
  id: number;
  gbsNumber: number | null;
  gbsMemo: string | null;
  department: string;
  grade: string;
  name: string;
  gender: Gender;
  scheduleIds: number[];
  scheduleMap: Record<string, boolean>;
  dormitoryLocation: string | null;
  gradeNumber: number;
  univGroupNumber: number;
};

type DormitoryRow = {
  id: number;
  name: string;
  optimalCapacity: number;
  maxCapacity: number;
  remainingBySchedule: Record<string, number>;
};

type PreviewGroupMode = "gbs" | "dormitory";

type PreviewDataRow = {
  kind: "data";
  id: number;
  gbsNumber: number | null;
  univGroupNumber: number;
  gradeNumber: number;
  userName: string;
  dormitoryName: string;
  scheduleMap: Record<string, boolean>;
};

type PreviewGroupRow = {
  kind: "group";
  id: string;
  groupMode: PreviewGroupMode;
  groupKey: string;
  groupLabel: string;
  scheduleCounts: Record<string, number>;
  totalCount: number;
};

type PreviewTableRow = PreviewDataRow | PreviewGroupRow;

const buildScheduleMap = (
  scheduleIds: number[],
  scheduleColumns: ScheduleColumn[]
) => {
  const selected = new Set(scheduleIds);
  const scheduleMap: Record<string, boolean> = {};
  scheduleColumns.forEach((schedule) => {
    scheduleMap[schedule.key] = selected.has(schedule.id);
  });
  return scheduleMap;
};

const compareByGbs = (a: PersonRow, b: PersonRow) => {
  if (a.gbsNumber == null && b.gbsNumber != null) return 1;
  if (a.gbsNumber != null && b.gbsNumber == null) return -1;
  if (a.gbsNumber != null && b.gbsNumber != null && a.gbsNumber !== b.gbsNumber) {
    return a.gbsNumber - b.gbsNumber;
  }
  if (a.gradeNumber !== b.gradeNumber) return b.gradeNumber - a.gradeNumber;
  return a.name.localeCompare(b.name, "ko");
};

const UNASSIGNED_LABEL = "미배정";

const isPreviewGroupRow = (row: PreviewTableRow): row is PreviewGroupRow =>
  row.kind === "group";

const normalizeGroupKey = (value?: string | null) =>
  normalizeDormitoryLocation(value) ?? UNASSIGNED_LABEL;

const getPreviewGroupKey = (row: PreviewDataRow, groupMode: PreviewGroupMode) =>
  groupMode === "gbs"
    ? row.gbsNumber != null
      ? String(row.gbsNumber)
      : UNASSIGNED_LABEL
    : normalizeGroupKey(row.dormitoryName);

const getPreviewGroupLabel = (key: string, groupMode: PreviewGroupMode) =>
  groupMode === "gbs"
    ? key === UNASSIGNED_LABEL
      ? "GBS 미배정"
      : `GBS ${key}`
    : key;

const comparePreviewByGradeName = (a: PreviewDataRow, b: PreviewDataRow) => {
  if (a.gradeNumber !== b.gradeNumber) return b.gradeNumber - a.gradeNumber;
  return a.userName.localeCompare(b.userName, "ko");
};

const comparePreviewByGbs = (a: PreviewDataRow, b: PreviewDataRow) => {
  if (a.gbsNumber == null && b.gbsNumber != null) return 1;
  if (a.gbsNumber != null && b.gbsNumber == null) return -1;
  if (a.gbsNumber != null && b.gbsNumber != null && a.gbsNumber !== b.gbsNumber) {
    return a.gbsNumber - b.gbsNumber;
  }
  return comparePreviewByGradeName(a, b);
};

const sortPreviewKeys = (a: string, b: string, groupMode: PreviewGroupMode) => {
  if (a === UNASSIGNED_LABEL) return 1;
  if (b === UNASSIGNED_LABEL) return -1;
  if (groupMode === "gbs") return Number(a) - Number(b);
  return a.localeCompare(b, "ko");
};

const buildPreviewGroupedRows = (
  rows: PreviewDataRow[],
  groupMode: PreviewGroupMode,
  scheduleColumns: ScheduleColumn[]
) => {
  const groups = new Map<string, PreviewDataRow[]>();
  rows.forEach((row) => {
    const key = getPreviewGroupKey(row, groupMode);
    const groupRows = groups.get(key) ?? [];
    groupRows.push(row);
    groups.set(key, groupRows);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
    sortPreviewKeys(a, b, groupMode)
  );

  const result: PreviewTableRow[] = [];
  sortedKeys.forEach((key) => {
    const groupRows = groups.get(key) ?? [];
    const sortedRows = [...groupRows].sort(
      groupMode === "gbs" ? comparePreviewByGradeName : comparePreviewByGbs
    );
    const scheduleCounts: Record<string, number> = {};
    scheduleColumns.forEach((schedule) => {
      scheduleCounts[schedule.key] = 0;
    });
    groupRows.forEach((row) => {
      scheduleColumns.forEach((schedule) => {
        if (row.scheduleMap[schedule.key]) {
          scheduleCounts[schedule.key] += 1;
        }
      });
    });

    result.push({
      kind: "group",
      id: `preview-group-${groupMode}-${key}`,
      groupMode,
      groupKey: key,
      groupLabel: getPreviewGroupLabel(key, groupMode),
      scheduleCounts,
      totalCount: groupRows.length,
    });
    result.push(...sortedRows);
  });

  return result;
};

const resolveAssignmentStrategyLabel = (
  strategy: DormitoryAssignmentPreview["assignmentStrategy"]
) =>
  strategy === "SAME_GBS_SAME_DORMITORY"
    ? "GBS 동일 숙소 우선"
    : "랜덤 배정";

const resolveCapacityBasisLabel = (
  basis: DormitoryAssignmentPreview["capacityBasis"]
) => (basis === "OPTIMAL" ? "정원 기준" : "최대 인원 기준");

const useDragSelection = <T extends number>(
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<T>>>
) => {
  const dragStateRef = useRef({ active: false, shouldSelect: true });

  const stopDragging = useCallback(() => {
    dragStateRef.current.active = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [stopDragging]);

  const updateSelection = useCallback(
    (id: T, shouldSelect: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (shouldSelect) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [setSelectedIds]
  );

  const handlePointerDown = useCallback(
    (id: T, isSelected: boolean, event: React.PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      dragStateRef.current.active = true;
      dragStateRef.current.shouldSelect = !isSelected;
      updateSelection(id, dragStateRef.current.shouldSelect);
    },
    [updateSelection]
  );

  const handlePointerEnter = useCallback(
    (id: T) => {
      if (!dragStateRef.current.active) return;
      updateSelection(id, dragStateRef.current.shouldSelect);
    },
    [updateSelection]
  );

  return { handlePointerDown, handlePointerEnter };
};

const buildDormitoryRows = (
  registrations: PersonRow[],
  dormitories: {
    id: number;
    name: string;
    optimalCapacity: number;
    maxCapacity?: number;
  }[],
  scheduleColumns: ScheduleColumn[],
  scheduleIds: Set<number>
) => {
  const occupancyByDormitory = new Map<string, Map<number, number>>();

  registrations.forEach((registration) => {
    const locationKey = normalizeDormitoryLocation(
      registration.dormitoryLocation
    );
    if (!locationKey) return;

    const scheduleMap = occupancyByDormitory.get(locationKey) ?? new Map();

    registration.scheduleIds.forEach((scheduleId) => {
      if (!scheduleIds.has(scheduleId)) return;
      const count = scheduleMap.get(scheduleId) ?? 0;
      scheduleMap.set(scheduleId, count + 1);
    });

    occupancyByDormitory.set(locationKey, scheduleMap);
  });

  return dormitories
    .map((dormitory) => {
      const maxCapacity = dormitory.maxCapacity ?? dormitory.optimalCapacity;
      const scheduleMap = occupancyByDormitory.get(
        normalizeDormitoryLocation(dormitory.name) ?? ""
      );
      const remainingBySchedule: Record<string, number> = {};

      scheduleColumns.forEach((schedule) => {
        const occupied = scheduleMap?.get(schedule.id) ?? 0;
        remainingBySchedule[schedule.key] = Math.max(maxCapacity - occupied, 0);
      });

      return {
        id: dormitory.id,
        name: dormitory.name,
        optimalCapacity: dormitory.optimalCapacity,
        maxCapacity,
        remainingBySchedule,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
};

function PersonSelectionTable({
  rows,
  scheduleColumns,
  selectedIds,
  setSelectedIds,
}: {
  rows: PersonRow[];
  scheduleColumns: ScheduleColumn[];
  selectedIds: Set<number>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;
}) {
  const { handlePointerDown, handlePointerEnter } = useDragSelection(
    setSelectedIds
  );

  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const someSelected = rows.some((row) => selectedIds.has(row.id));

  const toggleAll = (checked: boolean) => {
    setSelectedIds(() => {
      if (!checked) return new Set();
      return new Set(rows.map((row) => row.id));
    });
  };

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[48px] text-center">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(value) => toggleAll(!!value)}
                aria-label="모든 인원 선택"
              />
            </TableHead>
            <TableHead className="text-center">GBS</TableHead>
            <TableHead className="text-center">GBS 메모</TableHead>
            <TableHead className="text-center">부서</TableHead>
            <TableHead className="text-center">학년</TableHead>
            <TableHead className="text-center">이름</TableHead>
            {scheduleColumns.map((schedule) => (
              <TableHead key={schedule.key} className="text-center">
                {schedule.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isSelected = selectedIds.has(row.id);
            return (
              <TableRow
                key={row.id}
                data-state={isSelected ? "selected" : undefined}
                className="cursor-pointer select-none"
                onPointerDown={(event) =>
                  handlePointerDown(row.id, isSelected, event)
                }
                onPointerEnter={() => handlePointerEnter(row.id)}
              >
                <TableCell className="text-center">
                  <Checkbox checked={isSelected} aria-label={`${row.name} 선택`} />
                </TableCell>
                <TableCell className="text-center">
                  {row.gbsNumber != null ? (
                    row.gbsNumber
                  ) : (
                    <Badge variant="outline">미배정</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.gbsMemo ? row.gbsMemo : "-"}
                </TableCell>
                <TableCell className="text-center">{row.department}</TableCell>
                <TableCell className="text-center">{row.grade}</TableCell>
                <TableCell className="text-center">{row.name}</TableCell>
                {scheduleColumns.map((schedule) => (
                  <TableCell key={`${row.id}-${schedule.key}`} className="text-center">
                    <Checkbox
                      checked={row.scheduleMap[schedule.key]}
                      disabled
                      className={
                        row.scheduleMap[schedule.key] ? schedule.bgColorClass : ""
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DormitorySelectionTable({
  rows,
  scheduleColumns,
  selectedIds,
  setSelectedIds,
}: {
  rows: DormitoryRow[];
  scheduleColumns: ScheduleColumn[];
  selectedIds: Set<number>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;
}) {
  const { handlePointerDown, handlePointerEnter } = useDragSelection(
    setSelectedIds
  );

  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const someSelected = rows.some((row) => selectedIds.has(row.id));

  const toggleAll = (checked: boolean) => {
    setSelectedIds(() => {
      if (!checked) return new Set();
      return new Set(rows.map((row) => row.id));
    });
  };

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[48px] text-center">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(value) => toggleAll(!!value)}
                aria-label="모든 숙소 선택"
              />
            </TableHead>
            <TableHead className="text-center">숙소</TableHead>
            <TableHead className="text-center">정원</TableHead>
            <TableHead className="text-center">최대 인원</TableHead>
            {scheduleColumns.map((schedule) => (
              <TableHead key={schedule.key} className="text-center">
                {schedule.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isSelected = selectedIds.has(row.id);
            return (
              <TableRow
                key={row.id}
                data-state={isSelected ? "selected" : undefined}
                className="cursor-pointer select-none"
                onPointerDown={(event) =>
                  handlePointerDown(row.id, isSelected, event)
                }
                onPointerEnter={() => handlePointerEnter(row.id)}
              >
                <TableCell className="text-center">
                  <Checkbox
                    checked={isSelected}
                    aria-label={`${row.name} 선택`}
                  />
                </TableCell>
                <TableCell className="text-center">{row.name}</TableCell>
                <TableCell className="text-center">
                  {row.optimalCapacity}
                </TableCell>
                <TableCell className="text-center">{row.maxCapacity}</TableCell>
                {scheduleColumns.map((schedule) => (
                  <TableCell key={`${row.id}-${schedule.key}`} className="text-center">
                    {row.remainingBySchedule[schedule.key]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function AssignmentPreviewTable({
  preview,
  scheduleColumns,
  scheduleMapById,
}: {
  preview: DormitoryAssignmentPreview;
  scheduleColumns: ScheduleColumn[];
  scheduleMapById: Map<number, Record<string, boolean>>;
}) {
  const [groupMode, setGroupMode] = useState<PreviewGroupMode>("gbs");

  const emptyScheduleMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    scheduleColumns.forEach((schedule) => {
      map[schedule.key] = false;
    });
    return map;
  }, [scheduleColumns]);

  const rows = useMemo<PreviewDataRow[]>(
    () =>
      preview.previewAssignments.map((assignment) => ({
        kind: "data",
        id: assignment.userRetreatRegistrationId,
        gbsNumber: assignment.gbsNumber ?? null,
        univGroupNumber: assignment.univGroupNumber,
        gradeNumber: assignment.gradeNumber,
        userName: assignment.userName,
        dormitoryName: assignment.dormitoryName,
        scheduleMap:
          scheduleMapById.get(assignment.userRetreatRegistrationId) ??
          emptyScheduleMap,
      })),
    [preview.previewAssignments, scheduleMapById, emptyScheduleMap]
  );

  const groupedRows = useMemo(
    () => buildPreviewGroupedRows(rows, groupMode, scheduleColumns),
    [groupMode, rows, scheduleColumns]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>배정 전략: {resolveAssignmentStrategyLabel(preview.assignmentStrategy)}</span>
        <span>·</span>
        <span>기준: {resolveCapacityBasisLabel(preview.capacityBasis)}</span>
        <span>·</span>
        <span>배정 가능: {preview.isAssignable ? "가능" : "불가"}</span>
        <span>·</span>
        <span>대상 {preview.previewAssignments.length}명</span>
      </div>
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={groupMode}
          onValueChange={(value) => {
            if (value) setGroupMode(value as PreviewGroupMode);
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="gbs">GBS별</ToggleGroupItem>
          <ToggleGroupItem value="dormitory">숙소별</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {!preview.isAssignable && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          선택된 숙소로 모든 인원을 배정할 수 없습니다. 숙소를 더 선택하거나
          인원을 줄여서 다시 조회해 주세요.
        </div>
      )}
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">
                {groupMode === "gbs" ? "GBS" : "숙소"}
              </TableHead>
              <TableHead className="text-center">GBS</TableHead>
              <TableHead className="text-center">부서</TableHead>
              <TableHead className="text-center">학년</TableHead>
              <TableHead className="text-center">이름</TableHead>
              <TableHead className="text-center">배정 숙소</TableHead>
              {scheduleColumns.map((schedule) => (
                <TableHead key={schedule.key} className="text-center">
                  {schedule.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedRows.map((row) => {
              if (isPreviewGroupRow(row)) {
                return (
                  <TableRow
                    key={row.id}
                    className="bg-muted/50 text-muted-foreground font-medium"
                  >
                    <TableCell className="text-left font-semibold">
                      {row.groupLabel}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {row.totalCount}명
                      </span>
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    {scheduleColumns.map((schedule) => (
                      <TableCell key={`${row.id}-${schedule.key}`} className="text-center">
                        {row.scheduleCounts[schedule.key] ?? 0}명
                      </TableCell>
                    ))}
                  </TableRow>
                );
              }

              return (
                <TableRow key={row.id}>
                  <TableCell />
                  <TableCell className="text-center">
                    {row.gbsNumber != null ? (
                      row.gbsNumber
                    ) : (
                      <Badge variant="outline">미배정</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.univGroupNumber}부
                  </TableCell>
                  <TableCell className="text-center">
                    {row.gradeNumber}학년
                  </TableCell>
                  <TableCell className="text-center">{row.userName}</TableCell>
                  <TableCell className="text-center">
                    {row.dormitoryName}
                  </TableCell>
                  {scheduleColumns.map((schedule) => (
                    <TableCell key={`${row.id}-${schedule.key}`} className="text-center">
                      <Checkbox
                        checked={row.scheduleMap[schedule.key]}
                        disabled
                        className={
                          row.scheduleMap[schedule.key]
                            ? schedule.bgColorClass
                            : ""
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GenderAssignmentPanel({
  retreatSlug,
  gender,
  registrations,
  dormitories,
  scheduleColumns,
  scheduleIds,
}: {
  retreatSlug: string;
  gender: Gender;
  registrations: PersonRow[];
  dormitories: {
    id: number;
    name: string;
    optimalCapacity: number;
    maxCapacity?: number;
  }[];
  scheduleColumns: ScheduleColumn[];
  scheduleIds: Set<number>;
}) {
  const addToast = useToastStore((state) => state.add);
  const { mutate } = useSWRConfig();

  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [selectedDormitoryIds, setSelectedDormitoryIds] = useState<Set<number>>(
    new Set()
  );
  const [previewData, setPreviewData] = useState<DormitoryAssignmentPreview | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const dormitoryRows = useMemo(
    () =>
      buildDormitoryRows(
        registrations,
        dormitories,
        scheduleColumns,
        scheduleIds
      ),
    [registrations, dormitories, scheduleColumns, scheduleIds]
  );
  const scheduleMapById = useMemo(() => {
    const map = new Map<number, Record<string, boolean>>();
    registrations.forEach((registration) => {
      map.set(registration.id, registration.scheduleMap);
    });
    return map;
  }, [registrations]);

  const canPreview =
    selectedUserIds.size > 0 && selectedDormitoryIds.size > 0;

  useEffect(() => {
    setPreviewData(null);
    setShowPreview(false);
  }, [selectedUserIds, selectedDormitoryIds]);

  const handlePreview = async () => {
    if (!canPreview) {
      addToast({
        title: "안내",
        description: "배정할 인원과 숙소를 먼저 선택해 주세요.",
        variant: "warning",
      });
      return;
    }

    setIsPreviewing(true);
    try {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/dormitory/preview-assign-dormitory`,
        {
          userRetreatRegistrationIds: Array.from(selectedUserIds),
          dormitoryIds: Array.from(selectedDormitoryIds),
          gender,
        }
      );

      setPreviewData(response.data.preview as DormitoryAssignmentPreview);
      setShowPreview(true);
    } catch (error) {
      const description =
        error instanceof AxiosError
          ? error.response?.data?.message || "배정 결과 조회에 실패했습니다."
          : "배정 결과 조회에 실패했습니다.";

      addToast({
        title: "오류",
        description,
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!previewData) {
      addToast({
        title: "안내",
        description: "배정 결과 조회 후에 배정할 수 있습니다.",
        variant: "warning",
      });
      return;
    }

    if (!previewData.isAssignable) {
      addToast({
        title: "안내",
        description: "현재 선택으로는 배정이 불가능합니다.",
        variant: "warning",
      });
      return;
    }

    setIsAssigning(true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/dormitory/bulk-assign-dormitory`,
        {
          assignments: previewData.previewAssignments.map((assignment) => ({
            userRetreatRegistrationId: assignment.userRetreatRegistrationId,
            dormitoryId: assignment.dormitoryId,
          })),
        }
      );

      addToast({
        title: "성공",
        description: "숙소 배정이 완료되었습니다.",
        variant: "success",
      });

      mutate((key) =>
        typeof key === "string" &&
        key.includes(`/api/v1/retreat/${retreatSlug}/dormitory`)
      );

      setSelectedUserIds(new Set());
      setSelectedDormitoryIds(new Set());
      setPreviewData(null);
      setShowPreview(false);
    } catch (error) {
      const description =
        error instanceof AxiosError
          ? error.response?.data?.message || "숙소 배정에 실패했습니다."
          : "숙소 배정에 실패했습니다.";

      addToast({
        title: "오류",
        description,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>인원 표</CardTitle>
            <CardDescription>GBS별 보기 기준으로 정렬됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <PersonSelectionTable
              rows={registrations}
              scheduleColumns={scheduleColumns}
              selectedIds={selectedUserIds}
              setSelectedIds={setSelectedUserIds}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>숙소 표</CardTitle>
            <CardDescription>
              정원과 최대 인원 기준으로 숙박 일정별 잔여 인원을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DormitorySelectionTable
              rows={dormitoryRows}
              scheduleColumns={scheduleColumns}
              selectedIds={selectedDormitoryIds}
              setSelectedIds={setSelectedDormitoryIds}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          선택 인원 {selectedUserIds.size}명 · 선택 숙소 {selectedDormitoryIds.size}곳
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={isPreviewing}
          >
            {isPreviewing ? "조회 중..." : "배정 결과 조회"}
          </Button>
          <Button
            type="button"
            onClick={handleBulkAssign}
            disabled={isAssigning || !previewData || !previewData.isAssignable}
          >
            {isAssigning ? "배정 중..." : "배정하기"}
          </Button>
        </div>
      </div>

      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle>배정 결과 미리보기</CardTitle>
            <CardDescription>
              선택한 인원과 숙소 기준으로 계산된 배정 결과입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignmentPreviewTable
              preview={previewData}
              scheduleColumns={scheduleColumns}
              scheduleMapById={scheduleMapById}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function DormitoryAssignmentManager({ retreatSlug }: { retreatSlug: string }) {
  const {
    data: dormitoryStaff = [],
    isLoading,
    error,
  } = useDormitoryStaff(retreatSlug);
  const {
    data: schedules = [],
    isLoading: isSchedulesLoading,
    error: scheduleError,
  } = useRetreatSchedules(retreatSlug);
  const { data: maleDormitories, error: maleDormitoryError } = useAllDormitories(
    retreatSlug,
    Gender.MALE
  );
  const { data: femaleDormitories, error: femaleDormitoryError } =
    useAllDormitories(retreatSlug, Gender.FEMALE);

  const sleepSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) => schedule.type === RetreatRegistrationScheduleType.SLEEP
      ),
    [schedules]
  );

  const scheduleColumns = useMemo(
    () => generateScheduleColumns(sleepSchedules),
    [sleepSchedules]
  );

  const scheduleIds = useMemo(
    () => new Set(scheduleColumns.map((schedule) => schedule.id)),
    [scheduleColumns]
  );

  const registrations = useMemo<PersonRow[]>(() => {
    return dormitoryStaff.map((registration) => ({
      id: registration.id,
      gbsNumber: registration.gbsNumber ?? null,
      gbsMemo: registration.gbsMemo ?? null,
      department: `${registration.univGroupNumber}부`,
      grade: `${registration.gradeNumber}학년`,
      name: registration.name,
      gender: registration.gender,
      scheduleIds: registration.userRetreatRegistrationScheduleIds ?? [],
      scheduleMap: buildScheduleMap(
        registration.userRetreatRegistrationScheduleIds ?? [],
        scheduleColumns
      ),
      dormitoryLocation: registration.dormitoryLocation ?? null,
      gradeNumber: registration.gradeNumber,
      univGroupNumber: registration.univGroupNumber,
    }));
  }, [dormitoryStaff, scheduleColumns]);

  const maleRegistrations = useMemo(
    () =>
      registrations
        .filter((registration) => registration.gender === Gender.MALE)
        .sort(compareByGbs),
    [registrations]
  );

  const femaleRegistrations = useMemo(
    () =>
      registrations
        .filter((registration) => registration.gender === Gender.FEMALE)
        .sort(compareByGbs),
    [registrations]
  );

  if (
    isLoading ||
    isSchedulesLoading ||
    maleDormitories == null ||
    femaleDormitories == null
  ) {
    return <div className="py-10 text-center">데이터를 불러오는 중...</div>;
  }

  if (error || scheduleError || maleDormitoryError || femaleDormitoryError) {
    return (
      <div className="py-10 text-center text-red-600">
        데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>숙소 배정</CardTitle>
        <CardDescription>
          인원과 숙소를 선택한 뒤 배정 결과를 조회하고 일괄 배정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="male" className="w-full">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="male" className="px-8">
              형제
            </TabsTrigger>
            <TabsTrigger value="female" className="px-8">
              자매
            </TabsTrigger>
          </TabsList>

          <TabsContent value="male" className="mt-6">
            <GenderAssignmentPanel
              retreatSlug={retreatSlug}
              gender={Gender.MALE}
              registrations={maleRegistrations}
              dormitories={maleDormitories}
              scheduleColumns={scheduleColumns}
              scheduleIds={scheduleIds}
            />
          </TabsContent>

          <TabsContent value="female" className="mt-6">
            <GenderAssignmentPanel
              retreatSlug={retreatSlug}
              gender={Gender.FEMALE}
              registrations={femaleRegistrations}
              dormitories={femaleDormitories}
              scheduleColumns={scheduleColumns}
              scheduleIds={scheduleIds}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
