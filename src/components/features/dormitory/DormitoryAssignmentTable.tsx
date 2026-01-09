"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  Table,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import debounce from "lodash/debounce";
import { Download, Search, Settings } from "lucide-react";
import { AxiosError } from "axios";

import { VirtualizedTable } from "@/components/common/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/custom-checkbox";

import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useAllDormitories } from "@/hooks/use-available-dormitories";
import { useDormitoryStaff } from "@/hooks/use-dormitory-staff";
import { useRetreatSchedules } from "@/hooks/use-retreat-schedules";
import { Gender, RetreatRegistrationScheduleType, TRetreatRegistrationSchedule } from "@/types";
import { generateScheduleColumns } from "@/utils/retreat-utils";

const UNASSIGNED_LABEL = "미배정";

type GroupMode = "gbs" | "dormitory";

type DormitoryCapacityInfo = {
  optimalCapacity: number;
  maxCapacity: number;
};

interface DormitoryDataRow {
  kind: "data";
  id: number;
  department: string;
  grade: string;
  name: string;
  gender: Gender;
  gbsNumber: number | null;
  dormitoryLocation: string | null;
  schedules: Record<string, boolean>;
  isLeader: boolean;
  gradeNumber: number;
  univGroupNumber: number;
}

type DormitoryGroupMeta = {
  label: string;
  summary: string;
  scheduleCounts: Record<string, number>;
  occupancy: number;
  firstRowId: number | null;
};

interface DormitoryGroupRow {
  kind: "group";
  id: string;
  department: string;
  grade: string;
  name: string;
  gender: Gender;
  gbsNumber: number | null;
  dormitoryLocation: string | null;
  schedules: Record<string, boolean>;
  isLeader: boolean;
  gradeNumber: number;
  univGroupNumber: number;
  groupMode: GroupMode;
  groupKey: string;
  groupLabel: string;
  groupSummary: string;
  scheduleCounts: Record<string, number>;
  occupancy: number;
}

type DormitoryTableRow = DormitoryDataRow | DormitoryGroupRow;

const columnHelper = createColumnHelper<DormitoryTableRow>();

const isGroupRow = (row: DormitoryTableRow): row is DormitoryGroupRow =>
  row.kind === "group";

const normalizeDormitoryLocation = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : UNASSIGNED_LABEL;
};

const buildDormitoryCapacityMap = (
  dormitories: {
    name: string;
    optimalCapacity: number;
    maxCapacity?: number;
  }[]
) => {
  const map = new Map<string, DormitoryCapacityInfo>();
  dormitories.forEach((dormitory) => {
    const key = normalizeDormitoryLocation(dormitory.name);
    if (key === UNASSIGNED_LABEL) return;
    map.set(key, {
      optimalCapacity: dormitory.optimalCapacity,
      maxCapacity: dormitory.maxCapacity ?? dormitory.optimalCapacity,
    });
  });
  return map;
};

const getGbsKey = (value?: number | null) =>
  value != null ? String(value) : UNASSIGNED_LABEL;

const getGroupKey = (row: DormitoryDataRow, groupMode: GroupMode) =>
  groupMode === "gbs"
    ? getGbsKey(row.gbsNumber)
    : normalizeDormitoryLocation(row.dormitoryLocation);

const getGroupLabel = (key: string, groupMode: GroupMode) =>
  groupMode === "gbs"
    ? key === UNASSIGNED_LABEL
      ? "GBS 미배정"
      : `GBS ${key}`
    : key;

const sortDormitoryKeys = (a: string, b: string) => {
  if (a === UNASSIGNED_LABEL) return 1;
  if (b === UNASSIGNED_LABEL) return -1;
  return a.localeCompare(b, "ko");
};

const sortGbsKeys = (a: string, b: string) => {
  if (a === UNASSIGNED_LABEL) return 1;
  if (b === UNASSIGNED_LABEL) return -1;
  return Number(a) - Number(b);
};

const compareDormitoryRows = (a: DormitoryDataRow, b: DormitoryDataRow) => {
  const gbsA = a.gbsNumber;
  const gbsB = b.gbsNumber;
  if (gbsA == null && gbsB != null) return 1;
  if (gbsA != null && gbsB == null) return -1;
  if (gbsA != null && gbsB != null && gbsA !== gbsB) return gbsA - gbsB;
  if (a.gradeNumber !== b.gradeNumber) return b.gradeNumber - a.gradeNumber;
  return a.name.localeCompare(b.name, "ko");
};

const compareGbsRows = (a: DormitoryDataRow, b: DormitoryDataRow) => {
  if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
  if (a.gradeNumber !== b.gradeNumber) return b.gradeNumber - a.gradeNumber;
  return a.name.localeCompare(b.name, "ko");
};

const buildDormitorySummary = (rows: DormitoryDataRow[]) => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = normalizeDormitoryLocation(row.dormitoryLocation);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const keys = Array.from(counts.keys()).sort(sortDormitoryKeys);
  return keys.map((key) => `${key} ${counts.get(key)}명`).join(" / ");
};

const buildGbsSummary = (rows: DormitoryDataRow[]) => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = getGbsKey(row.gbsNumber);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const keys = Array.from(counts.keys()).sort(sortGbsKeys);
  return keys
    .map((key) => {
      const label = key === UNASSIGNED_LABEL ? "GBS 미배정" : `GBS ${key}`;
      return `${label} ${counts.get(key)}명`;
    })
    .join(" / ");
};

const buildGroupedRows = (
  rows: DormitoryDataRow[],
  groupMode: GroupMode,
  groupMeta: Map<string, DormitoryGroupMeta>
) => {
  const groups = new Map<string, DormitoryDataRow[]>();
  rows.forEach((row) => {
    const key = getGroupKey(row, groupMode);
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  });

  const sortedKeys = Array.from(groups.keys()).sort(
    groupMode === "gbs" ? sortGbsKeys : sortDormitoryKeys
  );

  const result: DormitoryTableRow[] = [];

  sortedKeys.forEach((key) => {
    const groupRows = groups.get(key) ?? [];
    const sortedRows = [...groupRows].sort(
      groupMode === "gbs" ? compareGbsRows : compareDormitoryRows
    );
    const meta = groupMeta.get(key);

    if (groupMode === "dormitory") {
      result.push({
        kind: "group",
        id: `group-${groupMode}-${key}`,
        department: "",
        grade: "",
        name: "",
        gender: sortedRows[0]?.gender ?? Gender.MALE,
        gbsNumber: null,
        dormitoryLocation: null,
        schedules: {},
        isLeader: false,
        gradeNumber: 0,
        univGroupNumber: 0,
        groupMode,
        groupKey: key,
        groupLabel: meta?.label ?? getGroupLabel(key, groupMode),
        groupSummary: meta?.summary ?? "",
        scheduleCounts: meta?.scheduleCounts ?? {},
        occupancy: meta?.occupancy ?? sortedRows.length,
      });
    }

    result.push(...sortedRows);
  });

  return result;
};

const buildScheduleMap = (
  registration: { userRetreatRegistrationScheduleIds?: number[] },
  sleepSchedules: TRetreatRegistrationSchedule[]
) => {
  const selected = new Set(registration.userRetreatRegistrationScheduleIds ?? []);
  const scheduleMap: Record<string, boolean> = {};
  sleepSchedules.forEach((schedule) => {
    scheduleMap[`schedule_${schedule.id}`] = selected.has(schedule.id);
  });
  return scheduleMap;
};

const buildGroupMeta = (
  rows: DormitoryDataRow[],
  groupMode: GroupMode,
  scheduleColumnsInfo: ReturnType<typeof generateScheduleColumns>
) => {
  const groups = new Map<string, DormitoryDataRow[]>();
  rows.forEach((row) => {
    const key = getGroupKey(row, groupMode);
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  });

  const meta = new Map<string, DormitoryGroupMeta>();
  groups.forEach((groupRows, key) => {
    const label = getGroupLabel(key, groupMode);
    const summary =
      groupMode === "gbs"
        ? buildDormitorySummary(groupRows)
        : buildGbsSummary(groupRows);
    const scheduleCounts: Record<string, number> = {};
    scheduleColumnsInfo.forEach((scheduleInfo) => {
      const count = groupRows.reduce((acc, row) => {
        const scheduleKey = `schedule_${scheduleInfo.id}`;
        return acc + (row.schedules[scheduleKey] ? 1 : 0);
      }, 0);
      scheduleCounts[scheduleInfo.key] = count;
    });
    const scheduleValues = Object.values(scheduleCounts);
    const occupancy =
      scheduleValues.length > 0
        ? Math.max(...scheduleValues)
        : groupRows.length;

    meta.set(key, {
      label,
      summary,
      scheduleCounts,
      occupancy,
      firstRowId: null,
    });
  });

  return meta;
};

const getColumnLabel = (id: string, metaLabel?: string) => {
  if (metaLabel) return metaLabel;
  if (id.startsWith("schedule_")) return id;
  const labels: Record<string, string> = {
    group: "그룹",
    department: "부서",
    grade: "학년",
    name: "이름",
    gbsNumber: "GBS 번호",
    dormitoryLocation: "숙소",
  };
  return labels[id] || id;
};

function DormitoryAssignmentTableToolbar({
  table,
  retreatSlug,
  searchTerm,
  setSearchTerm,
  groupMode,
  setGroupMode,
}: {
  table: Table<DormitoryTableRow>;
  retreatSlug: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  groupMode: GroupMode;
  setGroupMode: (value: GroupMode) => void;
}) {
  const addToast = useToastStore((state) => state.add);
  const [downloadState, setDownloadState] = useState({
    gbsLocation: false,
    gbsMealCount: false,
  });

  const debouncedSetSearchTerm = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
      }, 300),
    [setSearchTerm]
  );

  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel();
    };
  }, [debouncedSetSearchTerm]);

  const resolveDownloadFileName = (
    contentDisposition: string | undefined,
    fallback: string
  ) => {
    if (!contentDisposition) return fallback;
    const encodedMatch = contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i
    );
    if (encodedMatch?.[1]) {
      try {
        return decodeURIComponent(encodedMatch[1]);
      } catch {
        return encodedMatch[1];
      }
    }
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    return match?.[1] ?? fallback;
  };

  const downloadExcel = async ({
    url,
    fallbackFileName,
    successMessage,
    stateKey,
  }: {
    url: string;
    fallbackFileName: string;
    successMessage: string;
    stateKey: "gbsLocation" | "gbsMealCount";
  }) => {
    setDownloadState((prev) => ({ ...prev, [stateKey]: true }));
    try {
      const response = await webAxios.get(url, { responseType: "blob" });
      const contentDisposition = response.headers["content-disposition"];
      const fileName = resolveDownloadFileName(
        contentDisposition,
        fallbackFileName
      );
      const urlObject = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = urlObject;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlObject);

      addToast({
        title: "성공",
        description: successMessage,
        variant: "success",
      });
    } catch (error) {
      console.error("엑셀 다운로드 중 오류 발생:", error);
      let errorMessage = "엑셀 파일 다운로드 중 오류가 발생했습니다.";

      if (error instanceof AxiosError && error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `서버 오류: ${error.response?.status ?? ""} ${error.response?.statusText ?? ""}`.trim();
        }
      }

      addToast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloadState((prev) => ({ ...prev, [stateKey]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="이름/부서/학년/GBS/숙소 검색..."
          defaultValue={searchTerm}
          onChange={(event) => debouncedSetSearchTerm(event.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={groupMode}
          onValueChange={(value) => {
            if (value) setGroupMode(value as GroupMode);
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="gbs">GBS별</ToggleGroupItem>
          <ToggleGroupItem value="dormitory">숙소별</ToggleGroupItem>
        </ToggleGroup>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              열 설정
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {table
              .getAllLeafColumns()
              .filter((column: any) => column.getCanHide())
              .map((column: any) => {
                const metaLabel = column.columnDef.meta?.label as
                  | string
                  | undefined;
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                  >
                    {getColumnLabel(column.id, metaLabel)}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadExcel({
              url: `/api/v1/retreat/${retreatSlug}/dormitory/gbs-location-excel`,
              fallbackFileName: "GBS_위치.xlsx",
              successMessage: "GBS 장소 엑셀 파일이 다운로드되었습니다.",
              stateKey: "gbsLocation",
            })
          }
          disabled={downloadState.gbsLocation}
        >
          {downloadState.gbsLocation ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          수양회 GBS 장소 엑셀 다운로드
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadExcel({
              url: `/api/v1/retreat/${retreatSlug}/dormitory/gbs-meal-count-excel`,
              fallbackFileName: "GBS_식수_현황.xlsx",
              successMessage: "GBS별 식수 엑셀 파일이 다운로드되었습니다.",
              stateKey: "gbsMealCount",
            })
          }
          disabled={downloadState.gbsMealCount}
        >
          {downloadState.gbsMealCount ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          수양회 GBS별 식수 엑셀 다운로드
        </Button>
      </div>
    </div>
  );
}

function DormitoryAssignmentTableContent({
  registrations,
  sleepSchedules,
  retreatSlug,
  searchTerm,
  setSearchTerm,
  groupMode,
  setGroupMode,
  dormitoryCapacityMap,
}: {
  registrations: DormitoryDataRow[];
  sleepSchedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  groupMode: GroupMode;
  setGroupMode: (value: GroupMode) => void;
  dormitoryCapacityMap: Map<string, DormitoryCapacityInfo>;
}) {
  const scheduleColumnsInfo = useMemo(
    () => generateScheduleColumns(sleepSchedules),
    [sleepSchedules]
  );

  const dormitoryOccupancyMap = useMemo(() => {
    const countsBySchedule = new Map<string, Record<string, number>>();
    if (scheduleColumnsInfo.length === 0) {
      const totals = new Map<string, number>();
      registrations.forEach((row) => {
        const key = normalizeDormitoryLocation(row.dormitoryLocation);
        totals.set(key, (totals.get(key) ?? 0) + 1);
      });
      return totals;
    }

    registrations.forEach((row) => {
      const key = normalizeDormitoryLocation(row.dormitoryLocation);
      const scheduleCounts = countsBySchedule.get(key) ?? {};
      scheduleColumnsInfo.forEach((scheduleInfo) => {
        const scheduleKey = `schedule_${scheduleInfo.id}`;
        if (row.schedules[scheduleKey]) {
          scheduleCounts[scheduleInfo.key] =
            (scheduleCounts[scheduleInfo.key] ?? 0) + 1;
        }
      });
      countsBySchedule.set(key, scheduleCounts);
    });

    const occupancyMap = new Map<string, number>();
    countsBySchedule.forEach((counts, key) => {
      const values = Object.values(counts);
      occupancyMap.set(key, values.length > 0 ? Math.max(...values) : 0);
    });
    return occupancyMap;
  }, [registrations, scheduleColumnsInfo]);

  const dormitoryCapacityStatusMap = useMemo(() => {
    const statusMap = new Map<string, "over" | "warning">();
    dormitoryCapacityMap.forEach((capacity, key) => {
      const occupancy = dormitoryOccupancyMap.get(key) ?? 0;
      if (occupancy > capacity.maxCapacity) {
        statusMap.set(key, "over");
      } else if (occupancy > capacity.optimalCapacity) {
        statusMap.set(key, "warning");
      }
    });
    return statusMap;
  }, [dormitoryCapacityMap, dormitoryOccupancyMap]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return registrations;
    const query = searchTerm.trim().toLowerCase();
    return registrations.filter((row) => {
      return (
        row.name.toLowerCase().includes(query) ||
        row.department.toLowerCase().includes(query) ||
        row.grade.toLowerCase().includes(query) ||
        (row.gbsNumber != null && String(row.gbsNumber).includes(query)) ||
        normalizeDormitoryLocation(row.dormitoryLocation)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [registrations, searchTerm]);

  const baseGroupMeta = useMemo(
    () => buildGroupMeta(registrations, groupMode, scheduleColumnsInfo),
    [groupMode, registrations, scheduleColumnsInfo]
  );

  const groupedRows = useMemo(
    () => buildGroupedRows(filteredRows, groupMode, baseGroupMeta),
    [filteredRows, baseGroupMeta, groupMode]
  );

  const groupMeta = useMemo(() => {
    const meta = new Map<string, DormitoryGroupMeta>();
    baseGroupMeta.forEach((value, key) => {
      meta.set(key, { ...value });
    });
    if (groupMode === "gbs") {
      groupedRows.forEach((row) => {
        if (isGroupRow(row)) return;
        const key = getGroupKey(row, groupMode);
        const entry = meta.get(key);
        if (entry && entry.firstRowId == null) {
          entry.firstRowId = row.id;
        }
      });
    }
    return meta;
  }, [baseGroupMeta, groupMode, groupedRows]);

  const columns = useMemo<ColumnDef<DormitoryTableRow>[]>(() => {
    const baseColumns: ColumnDef<DormitoryTableRow>[] = [
      columnHelper.display({
        id: "group",
        header: () => (
          <div className="text-center text-sm">
            {groupMode === "gbs" ? "GBS" : "숙소"}
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          if (isGroupRow(row)) {
            const capacityStatus =
              row.groupMode === "dormitory"
                ? dormitoryCapacityStatusMap.get(row.groupKey)
                : null;
            const capacityClassName =
              capacityStatus === "over"
                ? "text-red-600"
                : capacityStatus === "warning"
                  ? "text-yellow-700"
                  : "";
            const capacity = dormitoryCapacityMap.get(row.groupKey);
            const occupancy = dormitoryOccupancyMap.get(row.groupKey) ?? 0;
            const capacityHint =
              row.groupMode === "dormitory" && capacity
                ? `현재 ${occupancy}명 / 권장 ${capacity.optimalCapacity}명 / 최대 ${capacity.maxCapacity}명`
                : undefined;
            const summary = row.groupSummary ? ` · ${row.groupSummary}` : "";
            const capacityDisplay =
              row.groupMode === "dormitory" && capacity
                ? `(권장 ${capacity.optimalCapacity}명 / 최대 ${capacity.maxCapacity}명)`
                : null;
            return (
              <div
                className={`text-left px-2 py-1 whitespace-nowrap font-semibold ${capacityClassName}`}
                title={capacityHint ? `${capacityHint}${summary}` : row.groupSummary}
              >
                {row.groupLabel}
                {capacityDisplay && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {capacityDisplay}
                  </span>
                )}
              </div>
            );
          }

          const key = getGroupKey(row, groupMode);
          const meta = groupMeta.get(key);
          if (groupMode !== "gbs" || !meta || meta.firstRowId !== row.id) {
            return <div className="px-2 py-1 whitespace-nowrap"></div>;
          }
          // gbs 모드에서는 capacity 관련 표시 없음
          return (
            <div
              className="text-left px-2 py-1 whitespace-nowrap font-semibold"
              title={meta.summary}
            >
              {meta.label}
            </div>
          );
        },
        enableHiding: false,
        meta: { label: groupMode === "gbs" ? "GBS" : "숙소" },
      }),
      columnHelper.accessor("department", {
        id: "department",
        header: () => <div className="text-center text-sm">부서</div>,
        cell: (info) => {
          const row = info.row.original;
          if (isGroupRow(row)) return null;
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {info.getValue()}
            </div>
          );
        },
        meta: { label: "부서" },
      }),
      columnHelper.accessor("grade", {
        id: "grade",
        header: () => <div className="text-center text-sm">학년</div>,
        cell: (info) => {
          const row = info.row.original;
          if (isGroupRow(row)) return null;
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {info.getValue()}
            </div>
          );
        },
        meta: { label: "학년" },
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: () => <div className="text-center text-sm">이름</div>,
        cell: (info) => {
          const row = info.row.original;
          if (isGroupRow(row)) return null;
          return (
            <div
              className={`text-center px-2 py-1 whitespace-nowrap ${
                row.isLeader ? "font-semibold" : ""
              }`}
            >
              {info.getValue()}
            </div>
          );
        },
        meta: { label: "이름" },
      }),
      columnHelper.accessor("gbsNumber", {
        id: "gbsNumber",
        header: () => <div className="text-center text-sm">GBS 번호</div>,
        cell: (info) => {
          const row = info.row.original;
          if (isGroupRow(row)) return null;
          const value = info.getValue();
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {value != null ? value : "-"}
            </div>
          );
        },
        meta: { label: "GBS 번호" },
      }),
      columnHelper.accessor("dormitoryLocation", {
        id: "dormitoryLocation",
        header: () => <div className="text-center text-sm">숙소</div>,
        cell: (info) => {
          const row = info.row.original;
          if (isGroupRow(row)) return null;
          const value = info.getValue();
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap">
              {value ?? UNASSIGNED_LABEL}
            </div>
          );
        },
        meta: { label: "숙소" },
      }),
    ];

    const scheduleColumns = scheduleColumnsInfo.map((scheduleInfo) =>
      columnHelper.accessor(
        (row) =>
          row.kind === "data"
            ? row.schedules[`schedule_${scheduleInfo.id}`]
            : false,
        {
          id: scheduleInfo.key,
          header: () => (
            <div className="text-center text-xs whitespace-nowrap">
              {scheduleInfo.label}
            </div>
          ),
          cell: (info) => {
            const row = info.row.original;
            if (isGroupRow(row) && row.groupMode === "dormitory") {
              const count = row.scheduleCounts[scheduleInfo.key] ?? 0;
              return (
                <div className="text-center text-xs font-semibold text-slate-700">
                  {count}명
                </div>
              );
            }
            if (isGroupRow(row)) return null;
            const isChecked = Boolean(info.getValue());
            return (
              <div className="flex justify-center">
                <Checkbox
                  checked={isChecked}
                  disabled
                  checkedColor={scheduleInfo.simpleColorClass}
                  uncheckedColor="bg-gray-300"
                />
              </div>
            );
          },
          enableSorting: false,
          meta: {
            label: scheduleInfo.label,
          },
        }
      )
    );

    return [...baseColumns, ...scheduleColumns];
  }, [
    dormitoryCapacityMap,
    dormitoryOccupancyMap,
    dormitoryCapacityStatusMap,
    groupMeta,
    groupMode,
    scheduleColumnsInfo,
  ]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: groupedRows,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) =>
      `${groupMode}-${row.kind === "group" ? row.id : `row-${row.id}`}`,
  });

  return (
    <div className="space-y-4">
      <DormitoryAssignmentTableToolbar
        table={table}
        retreatSlug={retreatSlug}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        groupMode={groupMode}
        setGroupMode={setGroupMode}
      />

      <VirtualizedTable
        table={table}
        estimateSize={48}
        overscan={10}
        className="max-h-[70vh]"
        emptyMessage={
          searchTerm.trim()
            ? "검색 결과가 없습니다."
            : "표시할 데이터가 없습니다."
        }
        getRowClassName={(row) => {
          if (isGroupRow(row)) {
            return "bg-muted/50 text-muted-foreground font-medium";
          }
          if (groupMode === "dormitory") {
            const key = getGroupKey(row, groupMode);
            const status = dormitoryCapacityStatusMap.get(key);
            if (status === "over") return "bg-red-50 hover:bg-red-100";
            if (status === "warning") return "bg-yellow-50 hover:bg-yellow-100";
          }
          return row.isLeader ? "bg-cyan-50" : "";
        }}
      />
    </div>
  );
}

export function DormitoryAssignmentTable({
  retreatSlug,
}: {
  retreatSlug: string;
}) {
  const { data: dormitoryStaff = [], isLoading, error } =
    useDormitoryStaff(retreatSlug);
  const {
    data: maleDormitories,
    error: maleDormitoryError,
  } = useAllDormitories(retreatSlug, Gender.MALE);
  const {
    data: femaleDormitories,
    error: femaleDormitoryError,
  } = useAllDormitories(retreatSlug, Gender.FEMALE);
  const {
    data: schedules = [],
    isLoading: isSchedulesLoading,
    error: scheduleError,
  } = useRetreatSchedules(retreatSlug);

  const sleepSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) => schedule.type === RetreatRegistrationScheduleType.SLEEP
      ),
    [schedules]
  );

  const rows = useMemo<DormitoryDataRow[]>(() => {
    if (!dormitoryStaff.length) return [];
    return dormitoryStaff.map((registration) => ({
      kind: "data",
      id: registration.id,
      department: `${registration.univGroupNumber}부`,
      grade: `${registration.gradeNumber}학년`,
      name: registration.name,
      gbsNumber: registration.gbsNumber ?? null,
      dormitoryLocation: registration.dormitoryLocation ?? null,
      schedules: buildScheduleMap(registration, sleepSchedules),
      isLeader: registration.isLeader,
      gradeNumber: registration.gradeNumber,
      univGroupNumber: registration.univGroupNumber,
      gender: registration.gender,
    }));
  }, [dormitoryStaff, sleepSchedules]);

  const maleDormitoryCapacityMap = useMemo(
    () => buildDormitoryCapacityMap(maleDormitories ?? []),
    [maleDormitories]
  );
  const femaleDormitoryCapacityMap = useMemo(
    () => buildDormitoryCapacityMap(femaleDormitories ?? []),
    [femaleDormitories]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("gbs");

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
        <CardTitle>숙소 배정 결과 조회</CardTitle>
        <CardDescription>
          숙소 배정 결과를 GBS별 또는 숙소별로 확인할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="male" className="w-full">
          <TabsList className="grid grid-cols-2 w-fit">
            <TabsTrigger value="male" className="px-8">
              형제
            </TabsTrigger>
            <TabsTrigger value="female" className="px-8">
              자매
            </TabsTrigger>
          </TabsList>

          <TabsContent value="male" className="mt-6">
            <DormitoryAssignmentTableContent
              registrations={rows.filter((row) => row.gender === Gender.MALE)}
              sleepSchedules={sleepSchedules}
              retreatSlug={retreatSlug}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              groupMode={groupMode}
              setGroupMode={setGroupMode}
              dormitoryCapacityMap={maleDormitoryCapacityMap}
            />
          </TabsContent>

          <TabsContent value="female" className="mt-6">
            <DormitoryAssignmentTableContent
              registrations={rows.filter((row) => row.gender === Gender.FEMALE)}
              sleepSchedules={sleepSchedules}
              retreatSlug={retreatSlug}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              groupMode={groupMode}
              setGroupMode={setGroupMode}
              dormitoryCapacityMap={femaleDormitoryCapacityMap}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
