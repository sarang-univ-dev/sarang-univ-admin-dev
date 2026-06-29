"use client";

import {
  ColumnFiltersState,
  SortingState,
  createColumnHelper,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Download,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSWRConfig } from "swr";

import { GenderBadge } from "@/components/Badge";
import { ColumnHeader, VirtualizedTable } from "@/components/common/table";
import { DormitoryAssignmentExcelImportModal } from "@/components/features/dormitory/DormitoryAssignmentExcelImportModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  TRetreatDormitory,
  useAllDormitories,
  useAssignDormitory,
  useAvailableDormitories,
} from "@/hooks/use-available-dormitories";
import { useConfirm } from "@/hooks/use-confirm";
import { useDormitoryStaff } from "@/hooks/use-dormitory-staff";
import { webAxios } from "@/lib/api/axios";
import { arrayIncludesValueFilterFn, EMPTY_FILTER_VALUE } from "@/lib/table";
import { useToastStore } from "@/store/toast-store";
import {
  Gender,
  RetreatRegistrationScheduleType,
  TRetreatRegistrationSchedule,
} from "@/types";
import { downloadDormitoryAssignmentTemplate } from "@/utils/dormitory-assignment-excel/template";
import { generateScheduleColumns } from "@/utils/retreat-utils";

// Simple debounce hook
function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

interface DormitoryRow {
  id: number;
  gbsNumber: number | null;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  phoneNumber: string;
  isLeader: boolean;
  dormitoryLocation?: string;
  schedule: Record<string, boolean>;
  dormitoryStaffMemo?: string;
  dormitoryStaffMemoId?: string;
}

type AssignFn = (
  userRetreatRegistrationId: number,
  dormitoryId: number | null
) => Promise<void>;

type SaveMemoFn = (id: number, memo: string) => Promise<void>;
type DeleteMemoFn = (id: number, memoId?: string) => void;

/* -------------------------------------------------------------------------- */
/*  숙소 배정 Select 셀 (행별 로컬 pending — 전역 disable 버그 제거)          */
/* -------------------------------------------------------------------------- */

interface DormitoryAssignCellProps {
  row: DormitoryRow;
  availableDormitories?: TRetreatDormitory[];
  allDormitories?: TRetreatDormitory[];
  onAssign: AssignFn;
}

const DormitoryAssignCell = memo(function DormitoryAssignCell({
  row,
  availableDormitories,
  allDormitories,
  onAssign,
}: DormitoryAssignCellProps) {
  // 읽기 모드면 가벼운 버튼만 렌더 → 행마다 Radix Select 를 mount 하지 않아
  // 초기 렌더/스크롤 시 비용이 급감한다. 실제 Select 는 클릭한 한 행만 mount.
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  if (!active) {
    return (
      <div className="flex justify-center px-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => setActive(true)}
          className="flex h-10 w-44 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={`min-w-0 flex-1 truncate text-left ${
              row.dormitoryLocation ? "" : "text-muted-foreground"
            }`}
          >
            {row.dormitoryLocation || "숙소 선택"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </div>
    );
  }

  // 편집 모드 (한 번에 한 행만): 실제 Radix Select 를 열린 상태로 mount
  const currentDormitoryId =
    row.dormitoryLocation && allDormitories
      ? (allDormitories.find(d => d.name === row.dormitoryLocation)?.id ?? null)
      : null;
  const inAvail =
    currentDormitoryId != null &&
    (availableDormitories ?? []).some(d => d.id === currentDormitoryId);
  // 사용 가능 숙소 + (현재 배정 숙소가 가용 목록에 없으면 맨 앞에 추가)
  const options =
    currentDormitoryId != null && !inAvail && allDormitories
      ? [
          ...allDormitories.filter(d => d.id === currentDormitoryId),
          ...(availableDormitories ?? []),
        ]
      : (availableDormitories ?? []);

  return (
    <div className="flex justify-center px-1">
      <Select
        defaultOpen
        disabled={pending}
        value={currentDormitoryId != null ? String(currentDormitoryId) : "null"}
        onValueChange={async value => {
          pendingRef.current = true;
          setPending(true);
          try {
            await onAssign(
              row.id,
              value === "null" ? null : parseInt(value, 10)
            );
          } finally {
            pendingRef.current = false;
            setPending(false);
            setActive(false);
          }
        }}
        onOpenChange={open => {
          if (!open && !pendingRef.current) setActive(false);
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="숙소 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="null">
            <span className="text-gray-500">배정 취소</span>
          </SelectItem>
          {options.map(d => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*  담당자 메모 셀 (로컬 draft 상태 — 부모 리렌더/스크롤 충돌 제거)          */
/* -------------------------------------------------------------------------- */

interface DormitoryMemoCellProps {
  row: DormitoryRow;
  onSave: SaveMemoFn;
  onDelete: DeleteMemoFn;
}

const DormitoryMemoCell = memo(function DormitoryMemoCell({
  row,
  onSave,
  onDelete,
}: DormitoryMemoCellProps) {
  const memoValue = row.dormitoryStaffMemo ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(memoValue);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 편집 중이 아닐 때만 외부 값과 동기화
  useEffect(() => {
    if (!isEditing) setValue(memoValue);
  }, [memoValue, isEditing]);

  useEffect(() => {
    if (isEditing) {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await onSave(row.id, trimmed);
      setIsEditing(false);
    } catch {
      // 실패 시 편집 모드 유지 (toast 는 핸들러에서 노출)
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(memoValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative z-50 flex flex-col gap-2 rounded-md border border-gray-300 bg-white p-2 shadow-lg">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="메모를 입력하세요..."
          disabled={isSaving}
          className="w-full resize-none text-sm"
          rows={Math.max(3, Math.min(8, value.split("\n").length + 1))}
        />
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="default"
            onClick={handleSave}
            disabled={isSaving || !value.trim()}
            className="h-8 px-3"
          >
            {isSaving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 px-3"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1 px-1">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={`min-h-[32px] flex-1 line-clamp-2 break-words rounded p-2 text-left text-sm transition-colors ${
          memoValue
            ? "border border-transparent text-gray-700 hover:border-gray-300 hover:bg-gray-100"
            : "border border-dashed border-gray-300 italic text-gray-400 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        {memoValue || "클릭하여 메모 추가"}
      </button>
      {memoValue && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(row.id, row.dormitoryStaffMemoId)}
          className="mt-1 h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*  성별별 테이블 본문                                                        */
/* -------------------------------------------------------------------------- */

interface DormitoryTableContentProps {
  gender: Gender;
  retreatSlug: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  schedules: TRetreatRegistrationSchedule[];
  headerActions?: React.ReactNode;
}

const columnHelper = createColumnHelper<DormitoryRow>();

const DormitoryTableContent = React.memo<DormitoryTableContentProps>(
  function DormitoryTableContent({
    gender,
    retreatSlug,
    searchTerm,
    setSearchTerm,
    schedules,
    headerActions,
  }) {
    const addToast = useToastStore(s => s.add);
    const confirmDialog = useConfirm();

    const {
      data: dormitoryStaffData,
      isLoading: isLoadingUsers,
      mutate,
    } = useDormitoryStaff(retreatSlug);
    const { data: availableDormitories } = useAvailableDormitories(
      retreatSlug,
      gender
    );
    const { data: allDormitories } = useAllDormitories(retreatSlug, gender);
    const assignDormitory = useAssignDormitory(retreatSlug);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const debouncedSearch = useDebounce(searchTerm, 250);

    /* ----------------------------- handlers ------------------------------ */

    const handleAssign = useCallback<AssignFn>(
      async (userId, dormId) => {
        try {
          const res = await assignDormitory.mutateAsync({
            userRetreatRegistrationId: userId,
            dormitoryId: dormId,
          });
          addToast({
            title: dormId == null ? "취소됨" : "성공",
            description:
              res?.message ||
              (dormId == null
                ? "배정이 취소되었습니다."
                : "배정이 완료되었습니다."),
            variant: "default",
          });
        } catch {
          addToast({
            title: "오류",
            description: "배정에 실패했습니다.",
            variant: "destructive",
          });
        }
      },
      [assignDormitory, addToast]
    );

    const handleSaveMemo = useCallback<SaveMemoFn>(
      async (id, memo) => {
        try {
          await mutate(
            async currentData => {
              const response = await webAxios.post(
                `/api/v1/retreat/${retreatSlug}/dormitory/${id}/dormitory-memo`,
                { memo }
              );
              const saved = response.data.dormitoryStaffMemo;
              return (currentData ?? []).map(user =>
                user.id === id
                  ? {
                      ...user,
                      dormitoryStaffMemo: saved.memo,
                      dormitoryStaffMemoId: String(saved.id),
                    }
                  : user
              );
            },
            {
              optimisticData: currentData =>
                (currentData ?? []).map(user =>
                  user.id === id ? { ...user, dormitoryStaffMemo: memo } : user
                ),
              rollbackOnError: true,
              revalidate: false,
            }
          );
          addToast({
            title: "성공",
            description: "메모가 저장되었습니다.",
            variant: "success",
          });
        } catch (e) {
          addToast({
            title: "오류",
            description: "메모 저장에 실패했습니다.",
            variant: "destructive",
          });
          throw e; // 셀이 편집 모드를 유지하도록 전파
        }
      },
      [retreatSlug, mutate, addToast]
    );

    const handleDeleteMemo = useCallback(
      async (id: number, memoId: string) => {
        try {
          await mutate(
            async currentData => {
              await webAxios.delete(
                `/api/v1/retreat/${retreatSlug}/dormitory/${memoId}/dormitory-memo`
              );
              return (currentData ?? []).map(user =>
                user.id === id
                  ? {
                      ...user,
                      dormitoryStaffMemo: undefined,
                      dormitoryStaffMemoId: undefined,
                    }
                  : user
              );
            },
            {
              optimisticData: currentData =>
                (currentData ?? []).map(user =>
                  user.id === id
                    ? {
                        ...user,
                        dormitoryStaffMemo: undefined,
                        dormitoryStaffMemoId: undefined,
                      }
                    : user
                ),
              rollbackOnError: true,
              revalidate: false,
            }
          );
          addToast({
            title: "성공",
            description: "메모가 삭제되었습니다.",
            variant: "success",
          });
        } catch {
          addToast({
            title: "오류",
            description: "메모 삭제에 실패했습니다.",
            variant: "destructive",
          });
        }
      },
      [retreatSlug, mutate, addToast]
    );

    const handleConfirmDeleteMemo = useCallback<DeleteMemoFn>(
      (id, memoId) => {
        if (!memoId) return;
        void confirmDialog.open({
          title: "메모 삭제 확인",
          description: "정말 삭제하시겠습니까?",
          onConfirm: () => handleDeleteMemo(id, memoId),
        });
      },
      [confirmDialog, handleDeleteMemo]
    );

    /* ------------------------------ data --------------------------------- */

    const scheduleColumns = useMemo(
      () => generateScheduleColumns(schedules),
      [schedules]
    );

    // GBS 순서로 정렬된 행 (미배정 맨 뒤, 그룹 내 리더 먼저 → 학년 내림 → 이름)
    const rows = useMemo<DormitoryRow[]>(() => {
      if (!dormitoryStaffData?.length) return [];
      const transformed = dormitoryStaffData
        .filter(u => u.gender === gender)
        .map<DormitoryRow>(user => {
          const sched: Record<string, boolean> = {};
          schedules.forEach(s => {
            sched[`schedule_${s.id}`] =
              user.userRetreatRegistrationScheduleIds?.includes(s.id) ?? false;
          });
          return {
            id: user.id,
            gbsNumber: user.gbsNumber ?? null,
            department: `${user.univGroupNumber}부`,
            gender: user.gender,
            grade: `${user.gradeNumber}학년`,
            name: user.name,
            phoneNumber: user.phoneNumber,
            isLeader: user.isLeader,
            dormitoryLocation: user.dormitoryLocation,
            schedule: sched,
            dormitoryStaffMemo: user.dormitoryStaffMemo,
            dormitoryStaffMemoId: user.dormitoryStaffMemoId,
          };
        });

      return transformed.sort((a, b) => {
        // 1. GBS 번호 (null 은 맨 뒤)
        if (a.gbsNumber == null && b.gbsNumber != null) return 1;
        if (a.gbsNumber != null && b.gbsNumber == null) return -1;
        if (a.gbsNumber !== b.gbsNumber) {
          return (a.gbsNumber ?? 0) - (b.gbsNumber ?? 0);
        }
        // 2. 같은 GBS 내 리더 먼저
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        // 3. 학년 내림차순
        const gradeA = parseInt(a.grade) || 0;
        const gradeB = parseInt(b.grade) || 0;
        if (gradeA !== gradeB) return gradeB - gradeA;
        // 4. 이름 오름차순
        return a.name.localeCompare(b.name, "ko-KR");
      });
    }, [dormitoryStaffData, gender, schedules]);

    /* ----------------------------- columns ------------------------------- */

    const columns = useMemo(
      () => [
        columnHelper.accessor("gbsNumber", {
          id: "gbsNumber",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="GBS번호"
              enableSorting
              enableFiltering
              formatFilterValue={value =>
                value === EMPTY_FILTER_VALUE ? "미배정" : `${value}`
              }
            />
          ),
          filterFn: arrayIncludesValueFilterFn,
          cell: info => {
            const value = info.getValue();
            return (
              <div className="px-1 text-center text-sm whitespace-nowrap">
                {value != null ? (
                  value
                ) : (
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                    미배정
                  </span>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("department", {
          id: "department",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="부서"
              enableSorting
              enableFiltering
            />
          ),
          filterFn: "arrIncludesSome",
          cell: info => (
            <div className="px-1 text-center text-sm whitespace-nowrap">
              {info.getValue()}
            </div>
          ),
        }),
        columnHelper.accessor("gender", {
          id: "gender",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="성별"
              titleOnly
            />
          ),
          cell: info => (
            <div className="flex justify-center px-1">
              <GenderBadge gender={info.getValue()} />
            </div>
          ),
        }),
        columnHelper.accessor("grade", {
          id: "grade",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="학년"
              enableSorting
              enableFiltering
            />
          ),
          filterFn: "arrIncludesSome",
          cell: info => (
            <div className="px-1 text-center text-sm whitespace-nowrap">
              {info.getValue()}
            </div>
          ),
        }),
        columnHelper.accessor("name", {
          id: "name",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="이름"
              enableSorting
            />
          ),
          cell: info => (
            <div
              className={`px-1 text-center text-sm whitespace-nowrap ${
                info.row.original.isLeader ? "font-bold" : "font-medium"
              }`}
            >
              {info.getValue()}
            </div>
          ),
        }),
        columnHelper.accessor("phoneNumber", {
          id: "phoneNumber",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="전화번호"
              titleOnly
            />
          ),
          cell: info => (
            <div className="px-1 text-center text-sm whitespace-nowrap">
              {info.getValue()}
            </div>
          ),
        }),
        ...scheduleColumns.map(col =>
          columnHelper.display({
            id: col.key,
            header: () => (
              <div className="px-1 text-center text-xs whitespace-nowrap">
                {col.label}
              </div>
            ),
            cell: ({ row }) => (
              <div className="flex justify-center px-1">
                <Checkbox
                  checked={row.original.schedule[col.key]}
                  disabled
                  className={
                    row.original.schedule[col.key] ? col.bgColorClass : ""
                  }
                />
              </div>
            ),
          })
        ),
        columnHelper.accessor("dormitoryLocation", {
          id: "currentDormitory",
          header: ({ column, table }) => (
            <ColumnHeader
              column={column}
              table={table}
              title="현재 숙소"
              enableSorting
              enableFiltering
              formatFilterValue={value =>
                value === EMPTY_FILTER_VALUE ? "미배정" : `${value}`
              }
            />
          ),
          filterFn: arrayIncludesValueFilterFn,
          sortingFn: (rowA, rowB) => {
            const a = rowA.original.dormitoryLocation?.trim() ?? "";
            const b = rowB.original.dormitoryLocation?.trim() ?? "";
            if (!a && b) return 1;
            if (a && !b) return -1;
            return a.localeCompare(b, "ko", { numeric: true });
          },
          cell: info => {
            const loc = info.getValue();
            return (
              <div className="px-1 text-center whitespace-nowrap">
                {loc ? (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {loc}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-400">
                    미배정
                  </span>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("dormitoryLocation", {
          id: "assign",
          header: () => (
            <div className="px-1 text-center text-sm whitespace-nowrap">
              숙소 배정
            </div>
          ),
          cell: ({ row }) => (
            <DormitoryAssignCell
              row={row.original}
              availableDormitories={availableDormitories}
              allDormitories={allDormitories}
              onAssign={handleAssign}
            />
          ),
        }),
        columnHelper.accessor(
          row =>
            `${row.dormitoryStaffMemo ?? ""}__${row.dormitoryStaffMemoId ?? ""}`,
          {
            id: "memo",
            header: () => (
              <div className="px-1 text-center text-sm whitespace-nowrap">
                담당자 메모
              </div>
            ),
            cell: ({ row }) => (
              <div className="min-w-[220px]">
                <DormitoryMemoCell
                  row={row.original}
                  onSave={handleSaveMemo}
                  onDelete={handleConfirmDeleteMemo}
                />
              </div>
            ),
          }
        ),
      ],
      [
        scheduleColumns,
        availableDormitories,
        allDormitories,
        handleAssign,
        handleSaveMemo,
        handleConfirmDeleteMemo,
      ]
    );

    const globalFilterFn = useCallback(
      (
        row: { original: DormitoryRow },
        _columnId: string,
        filterValue: string
      ) => {
        const q = String(filterValue ?? "")
          .trim()
          .toLowerCase();
        if (!q) return true;
        const r = row.original;
        return (
          r.name.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.grade.toLowerCase().includes(q) ||
          (r.gbsNumber != null && String(r.gbsNumber).includes(q)) ||
          (r.phoneNumber ?? "").includes(q)
        );
      },
      []
    );

    const table = useReactTable({
      data: rows,
      columns,
      getRowId: row => String(row.id),
      state: {
        sorting,
        columnFilters,
        globalFilter: debouncedSearch,
      },
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      globalFilterFn: globalFilterFn as never,
    });

    if (isLoadingUsers) {
      return <div className="p-4">데이터를 불러오는 중...</div>;
    }

    return (
      <div className="space-y-4">
        {/* 검색 + 엑셀 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="GBS번호/부서/학년/이름/전화번호로 검색..."
              className="pl-8 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {headerActions}
        </div>

        <VirtualizedTable
          table={table}
          estimateSize={49}
          getRowClassName={row =>
            row.isLeader ? "bg-cyan-50 hover:bg-cyan-100" : ""
          }
          className="max-h-[70vh]"
          emptyMessage={
            searchTerm
              ? "검색 결과가 없습니다."
              : "조건에 맞는 데이터가 없습니다."
          }
        />
      </div>
    );
  }
);

/* -------------------------------------------------------------------------- */
/*  최상위 (Card 제거 · gender 탭)                                           */
/* -------------------------------------------------------------------------- */

export const DormitoryStaffTable = React.memo<{
  retreatSlug: string;
  schedules: TRetreatRegistrationSchedule[];
}>(function DormitoryStaffTable({ retreatSlug, schedules }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignmentImportOpen, setIsAssignmentImportOpen] = useState(false);

  const { mutate } = useSWRConfig();
  const { data: people = [] } = useDormitoryStaff(retreatSlug);
  const { data: maleDormitories = [] } = useAllDormitories(
    retreatSlug,
    Gender.MALE
  );
  const { data: femaleDormitories = [] } = useAllDormitories(
    retreatSlug,
    Gender.FEMALE
  );

  // 방배정 엑셀: 숙박(SLEEP) 일정 기준. 정원 초과 검증도 숙박일별로 계산한다.
  const sleepScheduleColumns = useMemo(
    () =>
      generateScheduleColumns(
        schedules.filter(
          schedule => schedule.type === RetreatRegistrationScheduleType.SLEEP
        )
      ),
    [schedules]
  );

  const allDormitories = useMemo(
    () => [...maleDormitories, ...femaleDormitories],
    [maleDormitories, femaleDormitories]
  );

  const revalidateDormitory = useCallback(async () => {
    await mutate(
      key =>
        typeof key === "string" &&
        key.includes(`/api/v1/retreat/${retreatSlug}/dormitory`)
    );
  }, [mutate, retreatSlug]);

  // 검색창과 같은 row 에 두기 위해 탭 본문(DormitoryTableContent)으로 내려보낸다.
  const excelActions = (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={people.length === 0}
        onClick={() =>
          downloadDormitoryAssignmentTemplate(people, sleepScheduleColumns)
        }
      >
        <Download className="mr-1.5 h-4 w-4" />
        엑셀 내보내기
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={people.length === 0}
        onClick={() => setIsAssignmentImportOpen(true)}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        엑셀 가져오기
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          인원관리 간사 숙소 배정
        </h1>
        <p className="text-muted-foreground">
          GBS 순서대로 조회하여 숙소를 배정할 수 있습니다.
        </p>
      </div>

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
          <DormitoryTableContent
            gender={Gender.MALE}
            retreatSlug={retreatSlug}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            schedules={schedules}
            headerActions={excelActions}
          />
        </TabsContent>

        <TabsContent value="female" className="mt-6">
          <DormitoryTableContent
            gender={Gender.FEMALE}
            retreatSlug={retreatSlug}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            schedules={schedules}
            headerActions={excelActions}
          />
        </TabsContent>
      </Tabs>

      <DormitoryAssignmentExcelImportModal
        open={isAssignmentImportOpen}
        onOpenChange={setIsAssignmentImportOpen}
        retreatSlug={retreatSlug}
        people={people}
        dormitories={allDormitories}
        scheduleColumns={sleepScheduleColumns}
        onImported={revalidateDormitory}
      />
    </div>
  );
});
