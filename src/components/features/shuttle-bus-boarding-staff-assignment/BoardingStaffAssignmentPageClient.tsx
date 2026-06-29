"use client";

import { AxiosError } from "axios";
import { BusFront, Save, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { webAxios } from "@/lib/api/axios";
import { ShuttleBusAPI } from "@/lib/api/shuttle-bus-api";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import { RetreatShuttleBusDirection } from "@/types";
import {
  IBoardingStaffAssignmentBus,
  IBoardingStaffCandidate,
} from "@/types/shuttle-bus-boarding";
import { formatDate } from "@/utils/formatDate";

const CHURCH_LOCATION = "서초 사랑의교회 참나리길";
const DEFAULT_RETREAT_LOCATION = "수양회장";

interface BoardingStaffAssignmentPageClientProps {
  retreatSlug: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? "작업 중 오류가 발생했습니다.";
  }

  return "작업 중 오류가 발생했습니다.";
}

export function BoardingStaffAssignmentPageClient({
  retreatSlug,
}: BoardingStaffAssignmentPageClientProps) {
  const addToast = useToastStore(state => state.add);
  const [editingBus, setEditingBus] =
    useState<IBoardingStaffAssignmentBus | null>(null);
  const [selectedAdminUserIds, setSelectedAdminUserIds] = useState<number[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: buses = [],
    error: busesError,
    isLoading: isBusesLoading,
    mutate: mutateBuses,
  } = useSWR(
    `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff-assignments`,
    () => ShuttleBusAPI.getBoardingStaffAssignmentBuses(retreatSlug)
  );

  const {
    data: candidates = [],
    error: candidatesError,
    isLoading: isCandidatesLoading,
  } = useSWR(
    `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff-candidates`,
    () => ShuttleBusAPI.getBoardingStaffCandidates(retreatSlug)
  );

  const { data: retreatLocation = DEFAULT_RETREAT_LOCATION } = useSWR(
    `/api/v1/retreat/${retreatSlug}/info`,
    async () => {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/info`
      );
      return (
        response.data.retreatInfo.retreat?.location ?? DEFAULT_RETREAT_LOCATION
      );
    }
  );

  useEffect(() => {
    if (editingBus) {
      setSelectedAdminUserIds(editingBus.adminUserIds);
      setSearch("");
    }
  }, [editingBus]);

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return candidates;
    }

    return candidates.filter(candidate =>
      [
        candidate.name,
        candidate.email,
        `${candidate.univGroupNumber}부`,
        candidate.univGroupName,
      ].some(value => value.toLowerCase().includes(normalizedSearch))
    );
  }, [candidates, search]);

  const toggleCandidate = (candidate: IBoardingStaffCandidate) => {
    setSelectedAdminUserIds(prev =>
      prev.includes(candidate.id)
        ? prev.filter(id => id !== candidate.id)
        : [...prev, candidate.id]
    );
  };

  const handleSave = async () => {
    if (!editingBus) return;

    setIsSaving(true);
    try {
      await ShuttleBusAPI.replaceBoardingStaffAssignment(
        retreatSlug,
        editingBus.id,
        selectedAdminUserIds
      );
      await mutateBuses();
      setEditingBus(null);
      addToast({
        title: "저장 완료",
        description: "선탑 간사 배정을 저장했습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "저장 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasError = busesError || candidatesError;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            부분참 선탑 간사 배정
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            셔틀버스 {buses.length}개 · 후보 {candidates.length}명
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[34%]">셔틀</TableHead>
              <TableHead className="w-[22%]">출발</TableHead>
              <TableHead>배정 간사</TableHead>
              <TableHead className="w-[96px] text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isBusesLoading || isCandidatesLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : hasError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  데이터를 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : buses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  등록된 셔틀버스가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              buses.map(bus => (
                <TableRow key={bus.id}>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <BusFront className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{bus.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {bus.direction ===
                          RetreatShuttleBusDirection.FROM_CHURCH_TO_RETREAT
                            ? `${CHURCH_LOCATION} → ${retreatLocation}`
                            : `${retreatLocation} → ${CHURCH_LOCATION}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(bus.departureTime)}
                  </TableCell>
                  <TableCell>
                    {bus.assignedStaff.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {bus.assignedStaff.map(staff => (
                          <span
                            key={staff.id}
                            className={cn(
                              "inline-flex items-center rounded-md border px-2 py-1 text-xs",
                              staff.isActive
                                ? "bg-slate-50 text-slate-700"
                                : "bg-red-50 text-red-700"
                            )}
                          >
                            {staff.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingBus(bus)}
                    >
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      배정
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingBus}
        onOpenChange={open => !open && setEditingBus(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingBus?.name ?? "선탑 간사 배정"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="이름, 이메일, 부서 검색"
                className="pl-8"
              />
            </div>

            <div className="max-h-[52vh] space-y-2 overflow-y-auto rounded-md border p-2">
              {filteredCandidates.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  후보 간사가 없습니다.
                </div>
              ) : (
                filteredCandidates.map(candidate => (
                  <label
                    key={candidate.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedAdminUserIds.includes(candidate.id)}
                      onCheckedChange={() => toggleCandidate(candidate)}
                      disabled={isSaving}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {candidate.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {candidate.univGroupNumber}부 · {candidate.email}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingBus(null)}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-1.5 h-4 w-4" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
