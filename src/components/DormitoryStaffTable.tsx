"use client";

import React, { useState, useMemo, useCallback } from "react";
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
import { useDormitoryStaff } from "@/hooks/use-dormitory-staff";
import { useAvailableDormitories, useAssignDormitory, useAllDormitories } from "@/hooks/use-available-dormitories";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { GenderBadge } from "@/components/Badge";
import { COMPLETE_GROUP_ROW_COUNT } from "@/lib/constant/lineup.constant";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { webAxios } from "@/lib/api/axios";
import { AxiosError } from "axios";
import { UserRetreatRegistrationMemoType, Gender } from "@/types";
import Cookies from "js-cookie";

interface DormitoryStaffTableProps {
  retreatSlug: string;
  schedules: any[];
}

interface GroupedDormitoryData {
  [gbsNumber: string]: Array<{
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
  }>;
}

interface DormitoryTableContentProps {
  gender: Gender;
  retreatSlug: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  schedules: any[];
}

const DormitoryTableContent = React.memo<DormitoryTableContentProps>(
  function DormitoryTableContent({ gender, retreatSlug, searchTerm, setSearchTerm, schedules }) {
    const addToast = useToastStore(state => state.add);
    const confirmDialog = useConfirmDialogStore();

    const { data: dormitoryStaffData, isLoading: isLoadingUsers, mutate } = useDormitoryStaff(retreatSlug);
    const { data: availableDormitories } = useAvailableDormitories(retreatSlug, gender);
    const { data: allDormitories } = useAllDormitories(retreatSlug, gender);
    const assignDormitory = useAssignDormitory(retreatSlug);

    // 메모 관련 상태
    const [editingMemo, setEditingMemo] = useState<Record<number, boolean>>({});
    const [memoValues, setMemoValues] = useState<Record<number, string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    // 스케줄 컬럼 생성
    const scheduleColumns = useMemo(() => generateScheduleColumns(schedules), [schedules]);

    // 메모 관련 함수들
    const setLoading = useCallback((id: number, action: string, isLoading: boolean) => {
      setLoadingStates(prev => ({
        ...prev,
        [`${id}_${action}`]: isLoading
      }));
    }, []);

    const isMemoLoading = useCallback((id: number, action: string) => {
      return loadingStates[`${id}_${action}`] || false;
    }, [loadingStates]);

    const handleStartEditMemo = useCallback((id: number, currentMemo: string = "") => {
      setEditingMemo(prev => ({ ...prev, [id]: true }));
      setMemoValues(prev => ({ ...prev, [id]: currentMemo }));
    }, []);

    const handleCancelEditMemo = useCallback((id: number) => {
      setEditingMemo(prev => ({ ...prev, [id]: false }));
      setMemoValues(prev => ({ ...prev, [id]: "" }));
    }, []);

    const handleSaveMemo = useCallback(async (id: number) => {
      const memo = memoValues[id];
      if (!memo?.trim()) return;

      setLoading(id, "memo", true);
      
      try {
        await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/dormitory/${id}/dormitory-memo`,
          { memo: memo.trim() },
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("accessToken")}`,
            },
          }
        );

        addToast({
          title: "성공",
          description: "메모가 성공적으로 저장되었습니다.",
          variant: "success",
        });

        setEditingMemo(prev => ({ ...prev, [id]: false }));
        setMemoValues(prev => ({ ...prev, [id]: "" }));
        
        // 데이터 다시 불러오기
        mutate();
      } catch (error) {
        addToast({
          title: "오류",
          description: "메모 저장에 실패했습니다.",
          variant: "destructive",
        });
        console.error("메모 저장 오류:", error);
      } finally {
        setLoading(id, "memo", false);
      }
    }, [memoValues, retreatSlug, addToast, mutate]);

    const handleDeleteMemo = useCallback(async (id: number, memoId: string) => {
      setLoading(id, "delete_memo", true);
      
      try {
        await webAxios.delete(
          `/api/v1/retreat/${retreatSlug}/dormitory/${memoId}/dormitory-memo`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("accessToken")}`,
            },
          }
        );

        addToast({
          title: "성공",
          description: "메모가 성공적으로 삭제되었습니다.",
          variant: "success",
        });
        
        // 데이터 다시 불러오기
        mutate();
      } catch (error) {
        addToast({
          title: "오류",
          description: "메모 삭제에 실패했습니다.",
          variant: "destructive",
        });
        console.error("메모 삭제 오류:", error);
      } finally {
        setLoading(id, "delete_memo", false);
      }
    }, [retreatSlug, addToast, mutate]);

    const handleConfirmDeleteMemo = useCallback((id: number, memoId?: string) => {
      if (!memoId) return;

      confirmDialog.show({
        title: "메모 삭제 확인",
        description: "정말로 이 메모를 삭제하시겠습니까?",
        onConfirm: () => handleDeleteMemo(id, memoId),
      });
    }, [confirmDialog, handleDeleteMemo]);

    // 데이터 변환 및 그룹화
    const groupedData = useMemo(() => {
      if (!dormitoryStaffData?.length || !schedules?.length) return {};

      const transformedData = dormitoryStaffData
        .filter(user => user.gender === gender) // 성별 필터링
        .map(user => {
          // 스케줄 정보 변환
          const scheduleData: Record<string, boolean> = {};
          schedules.forEach(schedule => {
            scheduleData[`schedule_${schedule.id}`] =
              user.userRetreatRegistrationScheduleIds?.includes(schedule.id) || false;
          });

          return {
            id: user.id,
            gbsNumber: user.gbsNumber || null,
            department: `${user.univGroupNumber}부`,
            gender: user.gender as Gender,
            grade: `${user.gradeNumber}학년`,
            name: user.name,
            phoneNumber: user.phoneNumber,
            isLeader: user.isLeader,
            dormitoryLocation: user.dormitoryLocation,
            univGroupNumber: user.univGroupNumber,
            gradeNumber: user.gradeNumber,
            schedule: scheduleData,
            dormitoryStaffMemo: user.dormitoryStaffMemo,
            dormitoryStaffMemoId: user.dormitoryStaffMemoId,
          };
        });

      // 검색 필터링
      const filteredData = transformedData.filter(user => {
        const matchesSearch = searchTerm.trim() === "" || 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.includes(searchTerm) ||
          user.grade.includes(searchTerm) ||
          (user.gbsNumber && String(user.gbsNumber).includes(searchTerm));

        return matchesSearch;
      });

      // GBS 번호별 그룹화
      const grouped: GroupedDormitoryData = {};
      
      filteredData.forEach(user => {
        const key = user.gbsNumber ? String(user.gbsNumber) : "unassigned";
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(user);
      });

      // GBS 번호 순으로 정렬 (미배정자는 마지막에)
      const sortedGrouped: GroupedDormitoryData = {};
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === "unassigned") return 1;
        if (b === "unassigned") return -1;
        return parseInt(a) - parseInt(b);
      });

      sortedKeys.forEach(key => {
        sortedGrouped[key] = grouped[key];
      });

      return sortedGrouped;
    }, [dormitoryStaffData, searchTerm, gender, schedules]);

    // 숙소 배정 처리
    const handleAssignDormitory = useCallback(async (
      userRetreatRegistrationId: number, 
      dormitoryId: number | null
    ) => {
      try {
        await assignDormitory.mutateAsync({
          userRetreatRegistrationId,
          dormitoryId,
        });
        
        // 숙소 배정 후 dormitory staff 데이터도 다시 불러오기
        mutate();
        
        addToast({
          title: "성공",
          description: dormitoryId === null ? "숙소 배정이 취소되었습니다." : "숙소가 성공적으로 배정되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류",
          description: "숙소 배정에 실패했습니다.",
          variant: "destructive",
        });
        console.error(error);
      }
    }, [assignDormitory, addToast, mutate]);

    // 현재 사용자의 숙소 ID 찾기 및 사용 가능한 숙소 목록 생성
    const getDormitoryOptionsForUser = useCallback((dormitoryLocation?: string) => {
      if (!availableDormitories || !allDormitories) {
        return { options: [], currentDormitoryId: null };
      }

      // 현재 배정된 숙소의 ID를 전체 숙소 목록에서 찾기
      const currentDormitoryId = dormitoryLocation 
        ? allDormitories.find(d => d.name === dormitoryLocation)?.id || null
        : null;

      // 현재 배정된 숙소가 available 목록에 있는지 확인
      const currentDormitoryInAvailableList = currentDormitoryId 
        ? availableDormitories.some(d => d.id === currentDormitoryId)
        : false;

      // 옵션 목록 생성 (현재 숙소가 available 목록에 없다면 추가)
      let options = [...availableDormitories];
      if (currentDormitoryId && !currentDormitoryInAvailableList && dormitoryLocation) {
        const currentDormitory = allDormitories.find(d => d.id === currentDormitoryId);
        if (currentDormitory) {
          options = [currentDormitory, ...options];
        }
      }

      return { options, currentDormitoryId };
    }, [availableDormitories, allDormitories]);

    if (isLoadingUsers) {
      return <div className="p-4">데이터를 불러오는 중...</div>;
    }

    return (
      <div className="space-y-4">
        {/* 검색 */}
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

        {/* 테이블 */}
        <div className="rounded-md border overflow-x-auto">
          <div className="min-w-max">
            <div className="max-h-[80vh] overflow-y-auto">
              <Table className="w-full whitespace-nowrap relative">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center px-2 py-1">GBS<br/>번호</TableHead>
                    <TableHead className="text-center px-2 py-1">부서</TableHead>
                    <TableHead className="text-center px-2 py-1">성별</TableHead>
                    <TableHead className="text-center px-2 py-1">학년</TableHead>
                    <TableHead className="text-center px-2 py-1">이름</TableHead>
                    <TableHead className="text-center px-2 py-1">전화번호</TableHead>
                    {scheduleColumns.map(scheduleCol => (
                      <TableHead
                        key={scheduleCol.key}
                        className="px-2 py-1 text-center whitespace-nowrap"
                      >
                        <span className="text-xs">{scheduleCol.label}</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center px-2 py-1">현재 숙소</TableHead>
                    <TableHead className="text-center px-2 py-1">숙소 배정</TableHead>
                    <TableHead className="text-center px-2 py-1">인원관리 간사<br/>메모</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedData).map(([gbsNum, groupRows]) => {
                    return groupRows.map((row, idx) => {
                      const isFirstInGroup = idx === 0;
                      const groupSize = groupRows.length;
                      const cellClassName = row.isLeader ? "bg-cyan-200" : "";

                      return (
                        <TableRow key={row.id}>
                          {/* GBS 번호, 전참/부분참, 남/여 - rowSpan 처리 */}
                          {isFirstInGroup && row.gbsNumber && (
                            <>
                              <TableCell
                                rowSpan={groupSize}
                                className={`align-middle font-bold text-center px-2 py-1 ${
                                  groupSize > COMPLETE_GROUP_ROW_COUNT ? "bg-rose-200" : ""
                                }`}
                              >
                                {row.gbsNumber}
                              </TableCell>
                            </>
                          )}

                          {/* GBS 번호가 없는 경우 빈 셀 3개 */}
                          {!row.gbsNumber && (
                            <>
                              <TableCell className="text-center px-2 py-1">
                                <Badge variant="destructive">미배정</Badge>
                              </TableCell>
                            </>
                          )}

                          {/* 부서 */}
                          <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
                            {row.department}
                          </TableCell>

                          {/* 성별 */}
                          <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
                            <GenderBadge gender={row.gender} />
                          </TableCell>

                          {/* 학년 */}
                          <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
                            {row.grade}
                          </TableCell>

                          {/* 이름 */}
                          <TableCell className={`text-center px-2 py-1 ${cellClassName} ${row.isLeader ? "font-bold text-base" : ""}`}>
                            {row.name}
                          </TableCell>

                          {/* 전화번호 */}
                          <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
                            {row.phoneNumber}
                          </TableCell>

                          {/* 스케줄 체크박스들 */}
                          {scheduleColumns.map(col => (
                            <TableCell
                              key={`${row.id}-${col.key}`}
                              className={`px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap ${cellClassName}`}
                            >
                              <Checkbox
                                checked={row.schedule[col.key]}
                                disabled
                                className={row.schedule[col.key] ? col.bgColorClass : ""}
                              />
                            </TableCell>
                          ))}

                          {/* 현재 숙소 */}
                          <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
                            {row.dormitoryLocation ? (
                              <Badge variant="secondary">{row.dormitoryLocation}</Badge>
                            ) : (
                              <Badge variant="outline">미배정</Badge>
                            )}
                          </TableCell>

                          {/* 숙소 배정 */}
                          <TableCell className={`text-center px-2 py-1 ${cellClassName}`}>
                            {(() => {
                              const { options, currentDormitoryId } = getDormitoryOptionsForUser(row.dormitoryLocation);

                              // 데이터가 아직 로딩 중이면 로딩 표시
                              if (!allDormitories || !availableDormitories) {
                                return (
                                  <div className="w-48 h-10 bg-gray-100 animate-pulse rounded"></div>
                                );
                              }
                              
                              return (
                                <Select
                                  disabled={assignDormitory.isPending}
                                  value={currentDormitoryId ? currentDormitoryId.toString() : "null"}
                                  onValueChange={(value) => {
                                    if (value === "null") {
                                      handleAssignDormitory(row.id, null); // null을 보내서 미배정 처리
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
                                    {options.map((dormitory) => (
                                      <SelectItem key={dormitory.id} value={dormitory.id.toString()}>
                                        {dormitory.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            })()}
                          </TableCell>

                          {/* 인원관리 간사 메모 */}
                          <TableCell className={`group-hover:bg-gray-50 text-left px-2 py-1 ${cellClassName}`}>
                            {editingMemo[row.id] ? (
                              <div className="flex flex-col gap-2 p-2">
                                <Textarea
                                  value={memoValues[row.id] || ""}
                                  onChange={e =>
                                    setMemoValues(prev => ({
                                      ...prev,
                                      [row.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="인원관리 간사 메모를 입력하세요..."
                                  className="text-sm resize-none overflow-hidden w-full"
                                  style={{
                                    height:
                                      Math.max(
                                        60,
                                        Math.min(
                                          200,
                                          (memoValues[row.id] || "").split("\n")
                                            .length *
                                            20 +
                                            20
                                        )
                                      ) + "px",
                                  }}
                                  disabled={isMemoLoading(row.id, "memo")}
                                  rows={Math.max(
                                    3,
                                    Math.min(
                                      10,
                                      (memoValues[row.id] || "").split("\n")
                                        .length + 1
                                    )
                                  )}
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
                                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                                  className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words"
                                  onClick={() =>
                                    handleStartEditMemo(row.id, row.dormitoryStaffMemo)
                                  }
                                >
                                  {row.dormitoryStaffMemo ||
                                    "인원관리 간사 메모를 추가하려면 클릭하세요"}
                                </div>
                                {row.dormitoryStaffMemo && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleConfirmDeleteMemo(row.id, row.dormitoryStaffMemoId)
                                    }
                                    disabled={isMemoLoading(row.id, "delete_memo")}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
                                  >
                                    {isMemoLoading(row.id, "delete_memo") ? (
                                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                    });
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {Object.keys(groupedData).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            조건에 맞는 데이터가 없습니다.
          </div>
        )}
      </div>
    );
  }
);

export const DormitoryStaffTable = React.memo<DormitoryStaffTableProps>(
  function DormitoryStaffTable({ retreatSlug, schedules }) {
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
              <TabsTrigger value="male" className="px-8">형제</TabsTrigger>
              <TabsTrigger value="female" className="px-8">자매</TabsTrigger>
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
  }
); 