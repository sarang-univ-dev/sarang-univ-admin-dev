import { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { mutate } from "swr";
import { AxiosError } from "axios";
import { Gender } from "@/types";

export interface GBSLineupRow {
  id: string;
  maleCount: number;
  femaleCount: number;
  fullAttendanceCount: number;
  partialAttendanceCount: number;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  phoneNumber: string;
  schedule: Record<string, boolean>;
  type: any;
  isLeader: boolean;
  isFullAttendance: boolean;
  currentLeader: string;
  gbsNumber: number | null;
  gbsMemo: string;
  lineupMemo: string;
  lineupMemoId?: string;
  lineupMemocolor?: string;
  unresolvedLineupHistoryMemo?: string;
  adminMemo?: string;
  memoError?: boolean;
  gbsNumberError?: boolean;
}

export const useGBSLineup = (retreatSlug: string, registrations: any[], schedules: any[]) => {
  const addToast = useToastStore(state => state.add);
  const [data, setData] = useState<GBSLineupRow[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [includedSchedules, setIncludedSchedules] = useState<string[]>([]);
  const [excludedSchedules, setExcludedSchedules] = useState<string[]>([]);

  // 편집 상태
  const [editingMemo, setEditingMemo] = useState<Record<string, boolean>>({});
  const [memoValues, setMemoValues] = useState<Record<string, string>>({});
  const [gbsNumberInputs, setGbsNumberInputs] = useState<Record<string, string>>({});
  const [memoBgColors, setMemoBgColors] = useState<Record<string, string>>({});
  const [editingScheduleMemo, setEditingScheduleMemo] = useState<Record<string, boolean>>({});
  const [scheduleMemoValues, setScheduleMemoValues] = useState<Record<string, string>>({});

  const lineupEndpoint = `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`;

  // 데이터 변환
  const transformedData = useMemo(() => {
    if (!registrations.length || !schedules.length) return [];

    return registrations.map(registration => {
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach(schedule => {
        scheduleData[`schedule_${schedule.id}`] =
          registration.userRetreatRegistrationScheduleIds?.includes(schedule.id) || false;
      });

      return {
        id: registration.id,
        maleCount: registration.maleCount,
        femaleCount: registration.femaleCount,
        fullAttendanceCount: registration.fullAttendanceCount,
        partialAttendanceCount: registration.partialAttendanceCount,
        department: `${registration.univGroupNumber}부`,
        gender: registration.gender,
        grade: `${registration.gradeNumber}학년`,
        name: registration.name,
        phoneNumber: registration.phoneNumber,
        schedule: scheduleData,
        type: registration.userType,
        isLeader: registration.isLeader,
        isFullAttendance: registration.isFullAttendance,
        currentLeader: registration.currentLeader,
        gbsNumber: registration.gbsNumber,
        gbsMemo: registration.gbsMemo,
        lineupMemo: registration.lineupMemo,
        lineupMemoId: registration.lineupMemoId,
        lineupMemocolor: registration.lineupMemocolor,
        unresolvedLineupHistoryMemo: registration.unresolvedLineupHistoryMemo,
        adminMemo: registration.adminMemo,
      };
    });
  }, [registrations, schedules]);

  useEffect(() => {
    if (transformedData.length > 0) {
      setData(transformedData);
    }
  }, [transformedData]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let temp = data;

    if (showOnlyUnassigned) {
      temp = temp.filter(row => !row.gbsNumber || row.gbsNumber === null);
    }

    if (selectedDepartments.length > 0) {
      temp = temp.filter(row => selectedDepartments.includes(row.department));
    }

    if (includedSchedules.length > 0 || excludedSchedules.length > 0) {
      temp = temp.filter(row => {
        const hasAllIncludedSchedules = includedSchedules.length === 0 ||
          includedSchedules.every(scheduleKey => row.schedule[scheduleKey] === true);

        const hasNoExcludedSchedules = excludedSchedules.length === 0 ||
          excludedSchedules.every(scheduleKey => row.schedule[scheduleKey] === false);

        return hasAllIncludedSchedules && hasNoExcludedSchedules;
      });
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      temp = temp.filter(row =>
        String(row.gbsNumber ?? "").includes(lower) ||
        (row.name?.toLowerCase().includes(lower) ?? false) ||
        (row.lineupMemo?.toLowerCase().includes(lower) ?? false) ||
        (row.department?.toLowerCase().includes(lower) ?? false) ||
        (row.grade?.toLowerCase().includes(lower) ?? false) ||
        (row.type?.toLowerCase().includes(lower) ?? false)
      );
    }

    return temp;
  }, [data, showOnlyUnassigned, searchTerm, selectedDepartments, includedSchedules, excludedSchedules]);

  // 그룹화된 데이터
  const groupedData = useMemo(() => {
    const group: Record<string, GBSLineupRow[]> = {};

    filteredData.forEach(row => {
      const key = row.gbsNumber?.toString() || "null";
      if (!group[key]) {
        group[key] = [];
      }
      group[key].push(row);
    });

    Object.keys(group).forEach(gbsNumStr => {
      group[gbsNumStr].sort((a, b) => {
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        if (b.grade !== a.grade) return parseInt(b.grade) - parseInt(a.grade);
        return a.name.localeCompare(b.name, "ko");
      });
    });

    return group;
  }, [filteredData]);

  // 부서 목록
  const departmentOptions = useMemo(() => {
    const departments = Array.from(new Set(data.map(row => row.department).filter(Boolean)));
    return departments.sort((a, b) => {
      const aNum = parseInt(a.replace('부', ''));
      const bNum = parseInt(b.replace('부', ''));
      return aNum - bNum;
    });
  }, [data]);

  // 로딩 상태 관리
  const setLoading = useCallback((id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((id: string, action: string) => {
    return loadingStates[`${id}_${action}`];
  }, [loadingStates]);

  // Debounced 메모 업데이트
  const debouncedUpdateMemo = useCallback(
    debounce((id: string, value: string) => {
      setMemoValues(prev => ({ ...prev, [id]: value }));
    }, 100),
    []
  );

  // GBS 번호 저장
  const handleSaveGbsNumber = useCallback(async (row: GBSLineupRow) => {
    const newGbsNumber = gbsNumberInputs[row.id] ?? String(row.gbsNumber);
    setLoading(row.id, "gbsNumber", true);

    try {
      await webAxios.post(`/api/v1/retreat/${retreatSlug}/line-up/assign-gbs`, {
        userRetreatRegistrationId: row.id,
        gbsNumber: newGbsNumber,
      });

      setData(prev =>
        prev.map(r =>
          r.id === row.id
            ? { ...r, gbsNumber: parseInt(newGbsNumber), gbsNumberError: false }
            : r
        )
      );

      addToast({
        title: "성공",
        description: "GBS가 배정되었습니다.",
        variant: "success",
      });

      const updatedData = await mutate(lineupEndpoint);

      if (updatedData) {
        const targetGbsNumber = parseInt(newGbsNumber);
        const gbsGroup = updatedData.filter((r: any) => r.gbsNumber === targetGbsNumber);

        if (gbsGroup.length >= 7) {
          setTimeout(() => {
            addToast({
              title: "⚠️ GBS 인원 초과 알림",
              description: `배정된 GBS 인원이 ${gbsGroup.length}명입니다! 권장 인원을 초과했습니다.`,
              variant: "warning",
            });
          }, 500);
        }
      }
    } catch (error) {
      setData(prev =>
        prev.map(r => (r.id === row.id ? { ...r, gbsNumberError: true } : r))
      );

      addToast({
        title: "오류 발생",
        description: "GBS번호 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(row.id, "gbsNumber", false);
    }
  }, [gbsNumberInputs, retreatSlug, lineupEndpoint, setLoading, addToast]);

  // 메모 저장
  const handleSaveMemo = useCallback(async (id: string) => {
    const memo = memoValues[id];
    const color = memoBgColors[id];
    const currentRow = data.find(row => row.id === id);
    const memoId = currentRow?.lineupMemoId;

    setLoading(id, "memo", true);

    try {
      if ((memo && memo.trim()) || color !== undefined) {
        const processedColor = color === "" ? null : (color ? color.trim() : undefined);

        if (memoId) {
          await webAxios.put(
            `/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`,
            { memo: memo.trim(), color: processedColor }
          );
        } else {
          await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`,
            { memo: memo.trim(), color: processedColor }
          );
        }
      }

      setData(prev =>
        prev.map(row =>
          row.id === id
            ? { ...row, lineupMemo: memo, lineupMemoId: memoId ?? row.lineupMemoId, memoError: false }
            : row
        )
      );

      setEditingMemo(prev => ({ ...prev, [id]: false }));
      setMemoValues(prev => ({ ...prev, [id]: "" }));

      addToast({
        title: "성공",
        description: memoId ? "메모가 성공적으로 수정되었습니다." : "메모가 성공적으로 저장되었습니다.",
        variant: "success",
      });
    } catch (error) {
      setData(prev =>
        prev.map(row => (row.id === id ? { ...row, memoError: true } : row))
      );

      addToast({
        title: "오류 발생",
        description: error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "memo", false);
    }
  }, [memoValues, memoBgColors, data, retreatSlug, setLoading, addToast]);

  // 메모 삭제
  const handleDeleteMemo = useCallback(async (id: string) => {
    const currentRow = data.find(row => row.id === id);
    const memoId = currentRow?.lineupMemoId;

    setLoading(id, "delete_memo", true);

    try {
      await webAxios.delete(`/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`);

      setData(prev =>
        prev.map(row =>
          row.id === id
            ? { ...row, lineupMemo: "", lineupMemoId: undefined, memoError: false }
            : row
        )
      );

      addToast({
        title: "성공",
        description: "메모가 성공적으로 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      setData(prev =>
        prev.map(row => (row.id === id ? { ...row, memoError: true } : row))
      );

      addToast({
        title: "오류 발생",
        description: "메모 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "delete_memo", false);
    }
  }, [data, retreatSlug, setLoading, addToast]);

  return {
    // 데이터
    data,
    filteredData,
    groupedData,
    departmentOptions,

    // 상태
    searchTerm,
    setSearchTerm,
    showOnlyUnassigned,
    setShowOnlyUnassigned,
    selectedDepartments,
    setSelectedDepartments,
    includedSchedules,
    setIncludedSchedules,
    excludedSchedules,
    setExcludedSchedules,

    // 편집 상태
    editingMemo,
    setEditingMemo,
    memoValues,
    setMemoValues,
    gbsNumberInputs,
    setGbsNumberInputs,
    memoBgColors,
    setMemoBgColors,
    editingScheduleMemo,
    setEditingScheduleMemo,
    scheduleMemoValues,
    setScheduleMemoValues,

    // 함수들
    isLoading,
    setLoading,
    debouncedUpdateMemo,
    handleSaveGbsNumber,
    handleSaveMemo,
    handleDeleteMemo,
  };
};
