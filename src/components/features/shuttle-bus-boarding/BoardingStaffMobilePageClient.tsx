"use client";

import { AxiosError } from "axios";
import {
  Check,
  FileText,
  Loader2,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { DirectBusRegistrationModal } from "@/components/features/shuttle-bus-payment-confirmation/DirectBusRegistrationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/hooks/use-confirm";
import { webAxios } from "@/lib/api/axios";
import { ShuttleBusAPI } from "@/lib/api/shuttle-bus-api";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import {
  Gender,
  RetreatShuttleBusDirection,
  TRetreatShuttleBus,
  UserRetreatShuttleBusRegistrationHistoryMemoType,
  UserRetreatShuttleBusPaymentStatus,
} from "@/types";
import {
  IBoardingStaffBus,
  IBoardingStaffPassenger,
} from "@/types/shuttle-bus-boarding";
import { formatDate } from "@/utils/formatDate";

interface BoardingStaffMobilePageClientProps {
  retreatSlug: string;
}

const CHURCH_LOCATION = "서초 사랑의교회 참나리길";

type UnivGroupAndGrade = {
  univGroupId: number;
  univGroupName: string;
  univGroupNumber: number;
  grades: {
    gradeId: number;
    gradeName: string;
    gradeNumber: number;
  }[];
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? "작업 중 오류가 발생했습니다.";
  }

  return "작업 중 오류가 발생했습니다.";
}

function getGenderLabel(gender: Gender) {
  return gender === Gender.MALE ? "남" : "여";
}

function getPaymentStatusLabel(status: UserRetreatShuttleBusPaymentStatus) {
  return status === UserRetreatShuttleBusPaymentStatus.PAID
    ? "입금 완료"
    : "입금 대기";
}

function toRegistrationSchedule(bus: IBoardingStaffBus): TRetreatShuttleBus {
  return {
    ...bus,
    departureTime: new Date(bus.departureTime),
    arrivalTime: bus.arrivalTime ? new Date(bus.arrivalTime) : undefined,
    createdAt: new Date(bus.createdAt),
  };
}

export function BoardingStaffMobilePageClient({
  retreatSlug,
}: BoardingStaffMobilePageClientProps) {
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirm();
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [operatingPassengerId, setOperatingPassengerId] = useState<
    number | null
  >(null);
  const [phonePassenger, setPhonePassenger] =
    useState<IBoardingStaffPassenger | null>(null);
  const [memoDialog, setMemoDialog] = useState<{
    passenger: IBoardingStaffPassenger;
    memo: string;
  } | null>(null);
  const [isMemoSaving, setIsMemoSaving] = useState(false);
  const [isAddRegistrationOpen, setIsAddRegistrationOpen] = useState(false);

  const {
    data: assignedBuses = [],
    error: busesError,
    isLoading: isBusesLoading,
  } = useSWR(
    `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses`,
    () => ShuttleBusAPI.getBoardingStaffBuses(retreatSlug)
  );

  const {
    data: passengersData,
    error: passengersError,
    isLoading: isPassengersLoading,
    mutate: mutatePassengers,
  } = useSWR(
    selectedBusId
      ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses/${selectedBusId}/passengers`
      : null,
    () => ShuttleBusAPI.getBoardingStaffPassengers(retreatSlug, selectedBusId!)
  );

  const { data: retreatInfo, isLoading: isRetreatInfoLoading } = useSWR<{
    retreatLocation: string;
    univGroupAndGrade: UnivGroupAndGrade[];
  }>(`/api/v1/retreat/${retreatSlug}/info`, async () => {
    const response = await webAxios.get(`/api/v1/retreat/${retreatSlug}/info`);
    return {
      retreatLocation: response.data.retreatInfo.retreat.location,
      univGroupAndGrade: response.data.retreatInfo.univGroupAndGrade ?? [],
    };
  });
  const retreatLocation = retreatInfo?.retreatLocation;
  const univGroupAndGrade = retreatInfo?.univGroupAndGrade ?? [];

  useEffect(() => {
    if (assignedBuses.length === 0) {
      setSelectedBusId(null);
      return;
    }

    const hasSelectedBus = assignedBuses.some(bus => bus.id === selectedBusId);
    if (!hasSelectedBus) {
      setSelectedBusId(assignedBuses[0].id);
    }
  }, [assignedBuses, selectedBusId]);

  const selectedBus = useMemo(
    () => assignedBuses.find(bus => bus.id === selectedBusId) ?? null,
    [assignedBuses, selectedBusId]
  );
  const selectedBusDirectionLabel =
    selectedBus && retreatLocation
      ? selectedBus.direction ===
        RetreatShuttleBusDirection.FROM_CHURCH_TO_RETREAT
        ? `${CHURCH_LOCATION} → ${retreatLocation}`
        : `${retreatLocation} → ${CHURCH_LOCATION}`
      : "";

  const registrationSchedules = useMemo(
    () => assignedBuses.map(toRegistrationSchedule),
    [assignedBuses]
  );

  const defaultBusIds = useMemo(
    () => (selectedBusId ? [selectedBusId] : []),
    [selectedBusId]
  );

  const filteredPassengers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const passengers = passengersData?.passengers ?? [];

    if (!normalizedSearch) {
      return passengers;
    }

    return passengers.filter(passenger =>
      [
        `${passenger.univGroupNumber}부`,
        `${passenger.gradeNumber}학년`,
        passenger.name,
        passenger.phoneNumber,
        getGenderLabel(passenger.gender),
      ].some(value => value.toLowerCase().includes(normalizedSearch))
    );
  }, [passengersData?.passengers, search]);

  const summary = passengersData?.summary ?? {
    totalRegistered: 0,
    totalConfirmed: 0,
    confirmedRate: 0,
  };

  const handleConfirm = (passenger: IBoardingStaffPassenger) => {
    if (!selectedBusId) return;

    void confirmDialog.open({
      title: "탑승 확인",
      description: `${passenger.name}님의 탑승을 확인 처리합니다.`,
      onConfirm: async () => {
        setOperatingPassengerId(passenger.id);
        try {
          await ShuttleBusAPI.confirmBoardingStaffPassenger(
            retreatSlug,
            selectedBusId,
            passenger.id
          );
          await mutatePassengers();
          addToast({
            title: "탑승 확인 완료",
            description: "탑승 상태가 저장되었습니다.",
            variant: "success",
          });
        } catch (error) {
          addToast({
            title: "탑승 확인 실패",
            description: getErrorMessage(error),
            variant: "destructive",
          });
          throw error;
        } finally {
          setOperatingPassengerId(null);
        }
      },
      closeOnConfirmError: false,
    });
  };

  const handleCancel = (passenger: IBoardingStaffPassenger) => {
    if (!selectedBusId) return;

    void confirmDialog.open({
      title: "탑승 취소",
      description: `${passenger.name}님의 탑승 확인을 취소합니다.`,
      confirmText: "취소 처리",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setOperatingPassengerId(passenger.id);
        try {
          await ShuttleBusAPI.cancelBoardingStaffPassenger(
            retreatSlug,
            selectedBusId,
            passenger.id
          );
          await mutatePassengers();
          addToast({
            title: "탑승 취소 완료",
            description: "탑승 확인이 취소되었습니다.",
            variant: "success",
          });
        } catch (error) {
          addToast({
            title: "탑승 취소 실패",
            description: getErrorMessage(error),
            variant: "destructive",
          });
          throw error;
        } finally {
          setOperatingPassengerId(null);
        }
      },
      closeOnConfirmError: false,
    });
  };

  const handleSaveMemo = async () => {
    if (!selectedBusId || !memoDialog) return;

    const memo = memoDialog.memo.trim();
    if (!memo) {
      addToast({
        title: "메모 저장 실패",
        description: "메모 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsMemoSaving(true);
    try {
      await ShuttleBusAPI.saveBoardingStaffScheduleChangeMemo(
        retreatSlug,
        selectedBusId,
        memoDialog.passenger.id,
        memo
      );
      await mutatePassengers();
      setMemoDialog(null);
      addToast({
        title: "메모 저장 완료",
        description: "일정 변경 요청 메모가 저장되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "메모 저장 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsMemoSaving(false);
    }
  };

  const handleDeleteMemo = async () => {
    if (!selectedBusId || !memoDialog?.passenger.boardingStaffMemoId) return;

    setIsMemoSaving(true);
    try {
      await ShuttleBusAPI.deleteBoardingStaffScheduleChangeMemo(
        retreatSlug,
        selectedBusId,
        memoDialog.passenger.id
      );
      await mutatePassengers();
      setMemoDialog(null);
      addToast({
        title: "메모 삭제 완료",
        description: "일정 변경 요청 메모가 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "메모 삭제 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsMemoSaving(false);
    }
  };

  const hasError = busesError || passengersError;
  const canEditCurrentMemo =
    !memoDialog?.passenger.boardingStaffMemoId ||
    memoDialog.passenger.boardingStaffMemoType ===
      UserRetreatShuttleBusRegistrationHistoryMemoType.SHUTTLE_BUS_BOARDING_STAFF;

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl space-y-4 bg-white px-3 py-4 sm:px-5">
      <div className="space-y-3 rounded-md border bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">부분참 선탑 확인</h1>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {selectedBus
                ? selectedBusDirectionLabel
                  ? `${selectedBus.name} · ${selectedBusDirectionLabel}`
                  : selectedBus.name
                : "배정된 셔틀버스가 없습니다."}
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            disabled={
              !selectedBusId ||
              isRetreatInfoLoading ||
              registrationSchedules.length === 0
            }
            onClick={() => setIsAddRegistrationOpen(true)}
          >
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </div>

        {assignedBuses.length > 1 ? (
          <Select
            value={selectedBusId ? selectedBusId.toString() : undefined}
            onValueChange={value => setSelectedBusId(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="셔틀버스 선택" />
            </SelectTrigger>
            <SelectContent>
              {assignedBuses.map(bus => (
                <SelectItem key={bus.id} value={bus.id.toString()}>
                  {bus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">확인 진행률</span>
            <span className="text-muted-foreground">
              {summary.totalConfirmed} / {summary.totalRegistered}
            </span>
          </div>
          <Progress value={summary.confirmedRate} className="h-2.5" />
          <p className="text-xs text-muted-foreground">
            탑승 확인 또는 일정 변경 요청 메모가 있으면 확인됨으로 집계됩니다.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="이름, 전화번호, 부서 검색"
          className="h-10 pl-8"
        />
      </div>

      <div className="overflow-hidden rounded-md border bg-white">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[51%] px-2 py-2 text-xs">
                탑승자
              </TableHead>
              <TableHead className="w-[13%] px-1 py-2 text-center text-xs">
                전화
              </TableHead>
              <TableHead className="w-[17%] px-1 py-2 text-center text-xs">
                확인
              </TableHead>
              <TableHead className="w-[19%] px-1 py-2 text-center text-xs">
                메모
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isBusesLoading || isPassengersLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-sm">
                  불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : hasError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-sm">
                  데이터를 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : assignedBuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-sm">
                  배정된 셔틀버스가 없습니다.
                </TableCell>
              </TableRow>
            ) : filteredPassengers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-28 text-center text-sm">
                  표시할 탑승자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredPassengers.map(passenger => {
                const isBoarded = Boolean(passenger.confirmedAt);
                const hasMemo = Boolean(passenger.boardingStaffMemo);
                const isConfirmed = isBoarded || hasMemo;
                const isOperating = operatingPassengerId === passenger.id;

                return (
                  <TableRow
                    key={passenger.shuttleBusRegistrationScheduleId}
                    className={cn(
                      isConfirmed && "bg-slate-50 text-muted-foreground"
                    )}
                  >
                    <TableCell className="px-2 py-2 align-top">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {passenger.name}
                          </span>
                          {hasMemo ? (
                            <Badge
                              variant="outline"
                              className="shrink-0 px-1.5 py-0 text-[10px]"
                            >
                              메모
                            </Badge>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>{passenger.univGroupNumber}부</span>
                          <span>{passenger.gradeNumber}학년</span>
                          <span>{getGenderLabel(passenger.gender)}</span>
                          <span>
                            {getPaymentStatusLabel(
                              passenger.shuttleBusPaymentStatus
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-center align-top">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setPhonePassenger(passenger)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-center align-top">
                      <Button
                        size="icon"
                        variant={isBoarded ? "outline" : "default"}
                        className="h-8 w-8"
                        disabled={isOperating}
                        onClick={() =>
                          isBoarded
                            ? handleCancel(passenger)
                            : handleConfirm(passenger)
                        }
                      >
                        {isOperating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isBoarded ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-center align-top">
                      <Button
                        size="icon"
                        variant={hasMemo ? "secondary" : "outline"}
                        className="h-8 w-8"
                        onClick={() =>
                          setMemoDialog({
                            passenger,
                            memo: passenger.boardingStaffMemo ?? "",
                          })
                        }
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DirectBusRegistrationModal
        open={isAddRegistrationOpen}
        onOpenChange={setIsAddRegistrationOpen}
        retreatSlug={retreatSlug}
        univGroupAndGrade={univGroupAndGrade}
        schedules={registrationSchedules}
        submitPath={`/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/register`}
        defaultBusIds={defaultBusIds}
        onSuccess={() => {
          void mutatePassengers();
        }}
      />

      <Dialog
        open={!!phonePassenger}
        onOpenChange={open => !open && setPhonePassenger(null)}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{phonePassenger?.name ?? "전화 연결"}</DialogTitle>
            <DialogDescription>
              전화번호를 확인하고 연결합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-slate-50 p-4 text-center text-lg font-semibold">
            {phonePassenger?.phoneNumber}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhonePassenger(null)}>
              닫기
            </Button>
            {phonePassenger ? (
              <Button asChild>
                <a href={`tel:${phonePassenger.phoneNumber}`}>
                  <Phone className="h-4 w-4" />
                  전화
                </a>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!memoDialog}
        onOpenChange={open => !open && setMemoDialog(null)}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {memoDialog?.passenger.name ?? "일정 변경 요청 메모"}
            </DialogTitle>
            <DialogDescription>
              {canEditCurrentMemo
                ? "탑승하지 않는 경우 버스 간사에게 전달될 메모를 남깁니다."
                : "이미 등록된 일정 변경 요청 메모입니다."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={memoDialog?.memo ?? ""}
            onChange={event =>
              setMemoDialog(current =>
                current ? { ...current, memo: event.target.value } : current
              )
            }
            placeholder="예: 개별 이동으로 셔틀버스 탑승하지 않습니다."
            className="min-h-32"
            disabled={isMemoSaving || !canEditCurrentMemo}
          />
          {memoDialog?.passenger.boardingStaffMemoCreatedAdminUserName ? (
            <p className="text-xs text-muted-foreground">
              작성자:{" "}
              {memoDialog.passenger.boardingStaffMemoCreatedAdminUserName}
              {memoDialog.passenger.boardingStaffMemoCreatedAt
                ? ` · ${formatDate(memoDialog.passenger.boardingStaffMemoCreatedAt)}`
                : ""}
            </p>
          ) : null}
          <DialogFooter className="gap-2">
            {canEditCurrentMemo && memoDialog?.passenger.boardingStaffMemoId ? (
              <Button
                variant="destructive"
                onClick={handleDeleteMemo}
                disabled={isMemoSaving}
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => setMemoDialog(null)}
              disabled={isMemoSaving}
            >
              닫기
            </Button>
            {canEditCurrentMemo ? (
              <Button onClick={handleSaveMemo} disabled={isMemoSaving}>
                {isMemoSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                저장
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
