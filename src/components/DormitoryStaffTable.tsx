"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Save, X, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { useDormitoryStaff } from "@/hooks/use-dormitory-staff";
import {
  useAvailableDormitories,
  useAssignDormitory,
  useAllDormitories,
} from "@/hooks/use-available-dormitories";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";

import { COMPLETE_GROUP_ROW_COUNT } from "@/lib/constant/lineup.constant";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { webAxios } from "@/lib/api/axios";
import { AxiosError } from "axios";

import { UserRetreatRegistrationMemoType, Gender } from "@/types";

// Simple debounce hook
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

interface DormitoryTableRowData {
  id: number;
  gbsNumber: number | null;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  phoneNumber: string;
  isLeader: boolean;
  dormitoryLocation?: string;
  univGroupNumber: number;
  gradeNumber: number;
  schedule: Record<string, boolean>;
  dormitoryStaffMemo?: string;
  dormitoryStaffMemoId?: string;
}

interface DormitoryTableRowProps {
  row: DormitoryTableRowData;
  isFirstInGroup: boolean;
  groupSize: number;
  scheduleColumns: { key: string; label: string; bgColorClass: string }[];
  editingMemo: Record<number, boolean>;
  memoValues: Record<number, string>;
  isMemoLoading: (id: number, action: string) => boolean;
  getDormitoryOptionsForUser: (dormitoryLocation?: string) => {
    options: any[];
    currentDormitoryId: number | null;
  };
  assignDormitory: any;
  handleAssignDormitory: (
    userRetreatRegistrationId: number,
    dormitoryId: number | null
  ) => Promise<void>;
  handleStartEditMemo: (id: number, currentMemo?: string) => void;
  setMemoValues: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleSaveMemo: (id: number) => Promise<void>;
  handleCancelEditMemo: (id: number) => void;
  handleConfirmDeleteMemo: (id: number, memoId?: string) => void;
}

const DormitoryTableRow = React.memo<DormitoryTableRowProps>(
  ({
    row,
    isFirstInGroup,
    groupSize,
    scheduleColumns,
    editingMemo,
    memoValues,
    isMemoLoading,
    getDormitoryOptionsForUser,
    assignDormitory,
    handleAssignDormitory,
    handleStartEditMemo,
    setMemoValues,
    handleSaveMemo,
    handleCancelEditMemo,
    handleConfirmDeleteMemo,
  }) => {
    const cellClassName = row.isLeader ? "bg-cyan-200" : "";

    // Compute dorm options once per render
    const { options, currentDormitoryId } = getDormitoryOptionsForUser(
      row.dormitoryLocation
    );

    return (
      <TableRow className={row.isLeader ? "bg-cyan-100" : ""}>
        {/* GBS 번호 cell (no rowspan) */}
        <TableCell
          className={`text-center px-3 py-2 whitespace-nowrap w-[80px] ${cellClassName}`}
        >
          {row.gbsNumber != null ? (
            row.gbsNumber
          ) : (
            <Badge variant="destructive">미배정</Badge>
          )}
        </TableCell>

        {/* Department */}
        <TableCell
          className={`text-center px-3 py-2 whitespace-nowrap w-[60px] ${cellClassName}`}
        >
          {row.department}
        </TableCell>

        {/* Gender */}
        <TableCell
          className={`text-center px-3 py-2 whitespace-nowrap w-[60px] ${cellClassName}`}
        >
          <Badge variant={row.gender === Gender.MALE ? "default" : "secondary"}>
            {row.gender === Gender.MALE ? "형제" : "자매"}
          </Badge>
        </TableCell>

        {/* Grade */}
        <TableCell
          className={`text-center px-3 py-2 whitespace-nowrap w-[60px] ${cellClassName}`}
        >
          {row.grade}
        </TableCell>

        {/* Name */}
        <TableCell
          className={`text-center px-3 py-2 whitespace-nowrap w-[100px] ${cellClassName} ${
            row.isLeader ? "font-bold text-base" : ""
          }`}
        >
          {row.name}
        </TableCell>

        {/* Phone */}
        <TableCell
          className={`text-center px-3 py-2 whitespace-nowrap w-[120px] ${cellClassName}`}
        >
          {row.phoneNumber}
        </TableCell>

        {/* Schedule checkboxes */}
        {scheduleColumns.map((col, i) => (
          <TableCell
            key={`${row.id}-${col.key}`}
            className={`px-3 py-2 text-center whitespace-nowrap w-[50px] ${cellClassName}`}
          >
            <Checkbox
              checked={row.schedule[col.key]}
              disabled
              className={row.schedule[col.key] ? col.bgColorClass : ""}
            />
          </TableCell>
        ))}

        {/* Current dorm */}
        <TableCell
          className={`text-center px-3 py-2 whitespace-nowrap w-[100px] ${cellClassName}`}
        >
          {row.dormitoryLocation ? (
            <Badge variant="secondary">{row.dormitoryLocation}</Badge>
          ) : (
            <Badge variant="outline">미배정</Badge>
          )}
        </TableCell>

        {/* Assign dorm */}
        <TableCell
          className={`text-center px-3 py-2 w-[200px] ${cellClassName}`}
        >
          <Select
            disabled={assignDormitory.isPending}
            value={
              currentDormitoryId != null
                ? currentDormitoryId.toString()
                : "null"
            }
            onValueChange={value => {
              if (value === "null") {
                handleAssignDormitory(row.id, null);
              } else {
                handleAssignDormitory(row.id, parseInt(value));
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="숙소 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">
                <span className="text-gray-500">배정 취소</span>
              </SelectItem>
              {options.map(d => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>

        {/* Memo */}
        <TableCell className={`text-left px-3 py-2 w-[250px] ${cellClassName}`}>
          {editingMemo[row.id] ? (
            <div className="flex flex-col gap-2 p-2">
              <Textarea
                value={memoValues[row.id] || ""}
                onChange={e =>
                  setMemoValues(p => ({
                    ...p,
                    [row.id]: e.target.value,
                  }))
                }
                placeholder="메모를 입력하세요..."
                className="resize-none w-full"
                style={{
                  height:
                    Math.max(
                      60,
                      Math.min(
                        200,
                        ((memoValues[row.id] || "").split("\n").length || 1) *
                          20 +
                          20
                      )
                    ) + "px",
                }}
                disabled={isMemoLoading(row.id, "memo")}
              />
              <div className="flex gap-1 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveMemo(row.id)}
                  disabled={isMemoLoading(row.id, "memo")}
                  className="h-7 px-2"
                >
                  {isMemoLoading(row.id, "memo") ? (
                    <div className="animate-spin h-3 w-3 rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancelEditMemo(row.id)}
                  disabled={isMemoLoading(row.id, "memo")}
                  className="h-7 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-2">
              <div
                className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded break-words"
                onClick={() =>
                  handleStartEditMemo(row.id, row.dormitoryStaffMemo)
                }
              >
                {row.dormitoryStaffMemo || "클릭하여 메모 추가"}
              </div>
              {row.dormitoryStaffMemo && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleConfirmDeleteMemo(row.id, row.dormitoryStaffMemoId)
                  }
                  disabled={isMemoLoading(row.id, "delete_memo")}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 mt-1"
                >
                  {isMemoLoading(row.id, "delete_memo") ? (
                    <div className="animate-spin h-3 w-3 rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  }
);
DormitoryTableRow.displayName = "DormitoryTableRow";

interface DormitoryTableContentProps {
  gender: Gender;
  retreatSlug: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  schedules: any[];
}

const ROW_HEIGHT = 64; // adjust to match your row padding

const DormitoryTableContent = React.memo<DormitoryTableContentProps>(
  function DormitoryTableContent({
    gender,
    retreatSlug,
    searchTerm,
    setSearchTerm,
    schedules,
  }) {
    const addToast = useToastStore(s => s.add);
    const confirmDialog = useConfirmDialogStore();

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

    const [editingMemo, setEditingMemo] = useState<Record<number, boolean>>({});
    const [memoValues, setMemoValues] = useState<Record<number, string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
      {}
    );

    const setLoading = useCallback(
      (id: number, action: string, l: boolean) =>
        setLoadingStates(p => ({ ...p, [`${id}_${action}`]: l })),
      []
    );
    const isMemoLoading = useCallback(
      (id: number, action: string) => loadingStates[`${id}_${action}`] || false,
      [loadingStates]
    );

    const handleStartEditMemo = useCallback((id: number, current = "") => {
      setEditingMemo(p => ({ ...p, [id]: true }));
      setMemoValues(p => ({ ...p, [id]: current }));
    }, []);
    const handleCancelEditMemo = useCallback((id: number) => {
      setEditingMemo(p => ({ ...p, [id]: false }));
      setMemoValues(p => ({ ...p, [id]: "" }));
    }, []);

    const handleSaveMemo = useCallback(
      async (id: number) => {
        const memo = memoValues[id]?.trim();
        if (!memo) return;
        setLoading(id, "memo", true);
        try {
          await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/dormitory/${id}/dormitory-memo`,
            { memo }
          );
          addToast({
            title: "성공",
            description: "메모가 저장되었습니다.",
            variant: "success",
          });
          setEditingMemo(p => ({ ...p, [id]: false }));
          setMemoValues(p => ({ ...p, [id]: "" }));
          mutate();
        } catch (e) {
          addToast({
            title: "오류",
            description: "메모 저장에 실패했습니다.",
            variant: "destructive",
          });
        } finally {
          setLoading(id, "memo", false);
        }
      },
      [memoValues, retreatSlug, addToast, mutate, setLoading]
    );

    const handleDeleteMemo = useCallback(
      async (id: number, memoId: string) => {
        setLoading(id, "delete_memo", true);
        try {
          await webAxios.delete(
            `/api/v1/retreat/${retreatSlug}/dormitory/${memoId}/dormitory-memo`
          );
          addToast({
            title: "성공",
            description: "메모가 삭제되었습니다.",
            variant: "success",
          });
          mutate();
        } catch {
          addToast({
            title: "오류",
            description: "메모 삭제에 실패했습니다.",
            variant: "destructive",
          });
        } finally {
          setLoading(id, "delete_memo", false);
        }
      },
      [retreatSlug, addToast, mutate, setLoading]
    );

    const handleConfirmDeleteMemo = useCallback(
      (id: number, memoId?: string) => {
        if (!memoId) return;
        confirmDialog.show({
          title: "메모 삭제 확인",
          description: "정말 삭제하시겠습니까?",
          onConfirm: () => handleDeleteMemo(id, memoId),
        });
      },
      [confirmDialog, handleDeleteMemo]
    );

    const handleAssignDormitory = useCallback(
      async (userId: number, dormId: number | null) => {
        try {
          const res = await assignDormitory.mutateAsync({
            userRetreatRegistrationId: userId,
            dormitoryId: dormId,
          });
          mutate();
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
      [assignDormitory, addToast, mutate]
    );

    const getDormitoryOptionsForUser = useCallback(
      (loc?: string) => {
        if (!availableDormitories || !allDormitories) {
          return { options: [], currentDormitoryId: null };
        }
        const currentId = loc
          ? (allDormitories.find(d => d.name === loc)?.id ?? null)
          : null;
        const inAvail =
          currentId != null &&
          availableDormitories.some(d => d.id === currentId);
        let opts = [...availableDormitories];
        if (currentId != null && !inAvail && loc) {
          const cur = allDormitories.find(d => d.id === currentId);
          if (cur) opts = [cur, ...opts];
        }
        return { options: opts, currentDormitoryId: currentId };
      },
      [availableDormitories, allDormitories]
    );

    // debounce the search term
    const debouncedSearch = useDebounce(searchTerm, 300);

    // generate scheduleCols once
    const scheduleColumns = useMemo(
      () => generateScheduleColumns(schedules),
      [schedules]
    );

    const columnWidths = useMemo(() => {
      // 내용에 맞춰지는 자동 너비 설정 제거 - CSS로 처리
      return [];
    }, [scheduleColumns]);

    // 테이블의 고정 너비 계산
    const totalTableWidth = useMemo(() => {
      const baseWidth = 80 + 60 + 60 + 60 + 100 + 120 + 100 + 200 + 250; // 기본 컬럼들의 너비 합계
      const scheduleWidth = scheduleColumns.length * 50; // 스케줄 컬럼들의 너비
      return baseWidth + scheduleWidth;
    }, [scheduleColumns]);

    // flatten + group + filter
    const flatRows = useMemo(() => {
      if (!dormitoryStaffData?.length) return [];
      // transform
      const transformed: DormitoryTableRowData[] = dormitoryStaffData
        .filter(u => u.gender === gender)
        .map(user => {
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
            univGroupNumber: user.univGroupNumber,
            gradeNumber: user.gradeNumber,
            schedule: sched,
            dormitoryStaffMemo: user.dormitoryStaffMemo,
            dormitoryStaffMemoId: user.dormitoryStaffMemoId,
          };
        });

      // filter
      const q = debouncedSearch.trim().toLowerCase();
      const filtered = q
        ? transformed.filter(u => {
            return (
              u.name.toLowerCase().includes(q) ||
              u.department.includes(q) ||
              u.grade.includes(q) ||
              (u.gbsNumber != null && String(u.gbsNumber).includes(q))
            );
          })
        : transformed;

      // group
      const groups: Record<string, DormitoryTableRowData[]> = {};
      filtered.forEach(u => {
        const key = u.gbsNumber != null ? String(u.gbsNumber) : "unassigned";
        if (!groups[key]) groups[key] = [];
        groups[key].push(u);
      });

      // sort keys
      const keys = Object.keys(groups).sort((a, b) => {
        if (a === "unassigned") return 1;
        if (b === "unassigned") return -1;
        return +a - +b;
      });

      // flatten
      return keys.flatMap(key => {
        const grp = groups[key];
        return grp.map((row, idx) => ({
          row,
          isFirstInGroup: idx === 0,
          groupSize: grp.length,
        }));
      });
    }, [dormitoryStaffData, debouncedSearch, gender, schedules]);

    if (isLoadingUsers) {
      return <div className="p-4">데이터를 불러오는 중...</div>;
    }

    return (
      <div className="space-y-4">
        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="GBS번호/부서/학년/이름으로 검색 ..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table with virtualized body */}
        <div className="rounded-md border overflow-x-auto">
          {/* header */}
          <Table
            style={{
              width: totalTableWidth,
              tableLayout: "fixed",
              minWidth: totalTableWidth,
            }}
            className="w-full"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="text-center px-3 py-2 whitespace-nowrap w-[80px]">
                  GBS번호
                </TableHead>
                <TableHead className="text-center px-3 py-2 whitespace-nowrap w-[60px]">
                  부서
                </TableHead>
                <TableHead className="text-center px-3 py-2 whitespace-nowrap w-[60px]">
                  성별
                </TableHead>
                <TableHead className="text-center px-3 py-2 whitespace-nowrap w-[60px]">
                  학년
                </TableHead>
                <TableHead className="text-center px-3 py-2 whitespace-nowrap w-[100px]">
                  이름
                </TableHead>
                <TableHead className="text-center px-3 py-2 whitespace-nowrap w-[120px]">
                  전화번호
                </TableHead>
                {scheduleColumns.map((col, i) => (
                  <TableHead
                    key={col.key}
                    className="px-3 py-2 text-center whitespace-nowrap w-[50px]"
                  >
                    <span className="text-xs">{col.label}</span>
                  </TableHead>
                ))}
                <TableHead className="text-center px-3 py-2 whitespace-nowrap w-[100px]">
                  현재 숙소
                </TableHead>
                <TableHead className="text-center px-3 py-2 w-[200px]">
                  숙소 배정
                </TableHead>
                <TableHead className="text-center px-3 py-2 w-[250px]">
                  담당자 메모
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          {/* virtualized rows */}
          <List
            height={Math.min(
              flatRows.length * ROW_HEIGHT,
              window.innerHeight * 0.6
            )}
            itemCount={flatRows.length}
            itemSize={ROW_HEIGHT}
            width={totalTableWidth}
            itemData={flatRows}
          >
            {({
              index,
              style,
              data,
            }: {
              index: number;
              style: React.CSSProperties;
              data: any[];
            }) => {
              const { row, isFirstInGroup, groupSize } = data[index];
              return (
                <div
                  style={{
                    ...style,
                    width: totalTableWidth,
                    overflow: "hidden",
                  }}
                >
                  <Table
                    className="w-full"
                    style={{
                      tableLayout: "fixed",
                      width: totalTableWidth,
                      minWidth: totalTableWidth,
                    }}
                  >
                    <TableBody>
                      <DormitoryTableRow
                        row={row}
                        isFirstInGroup={isFirstInGroup}
                        groupSize={groupSize}
                        scheduleColumns={scheduleColumns}
                        editingMemo={editingMemo}
                        memoValues={memoValues}
                        isMemoLoading={isMemoLoading}
                        getDormitoryOptionsForUser={getDormitoryOptionsForUser}
                        assignDormitory={assignDormitory}
                        handleAssignDormitory={handleAssignDormitory}
                        handleStartEditMemo={handleStartEditMemo}
                        setMemoValues={setMemoValues}
                        handleSaveMemo={handleSaveMemo}
                        handleCancelEditMemo={handleCancelEditMemo}
                        handleConfirmDeleteMemo={handleConfirmDeleteMemo}
                      />
                    </TableBody>
                  </Table>
                </div>
              );
            }}
          </List>
        </div>

        {flatRows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            조건에 맞는 데이터가 없습니다.
          </div>
        )}
      </div>
    );
  }
);

export const DormitoryStaffTable = React.memo<{
  retreatSlug: string;
  schedules: any[];
}>(function DormitoryStaffTable({ retreatSlug, schedules }) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>인원관리 간사 숙소 배정</CardTitle>
        <CardDescription>
          GBS 순서대로 조회하여 숙소를 배정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-1 pt-4">
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
            <DormitoryTableContent
              gender={Gender.MALE}
              retreatSlug={retreatSlug}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              schedules={schedules}
            />
          </TabsContent>

          <TabsContent value="female" className="mt-6">
            <DormitoryTableContent
              gender={Gender.FEMALE}
              retreatSlug={retreatSlug}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              schedules={schedules}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
