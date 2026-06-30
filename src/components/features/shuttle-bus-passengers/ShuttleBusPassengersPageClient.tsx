"use client";

import { AxiosError } from "axios";
import {
  AlertTriangle,
  BusFront,
  CheckCircle2,
  Download,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { StatusBadge } from "@/components/Badge-bus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ShuttleBusAPI } from "@/lib/api/shuttle-bus-api";
import { useToastStore } from "@/store/toast-store";
import { Gender, RetreatShuttleBusDirection } from "@/types";
import { IBoardingStaffPassenger } from "@/types/shuttle-bus-boarding";
import { formatDate } from "@/utils/formatDate";

interface ShuttleBusPassengersPageClientProps {
  retreatSlug: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? "작업 중 오류가 발생했습니다.";
  }

  return "작업 중 오류가 발생했습니다.";
}

function BoardingStatusBadge({
  passenger,
}: {
  passenger: IBoardingStaffPassenger;
}) {
  if (passenger.confirmedAt) {
    return (
      <Badge className="gap-1.5 border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
        <CheckCircle2 className="h-3.5 w-3.5" />
        탑승 확인
      </Badge>
    );
  }

  if (passenger.boardingStaffMemo) {
    return (
      <Badge className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
        <AlertTriangle className="h-3.5 w-3.5" />
        일정 확인 필요
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-slate-200 text-slate-600">
      미확인
    </Badge>
  );
}

export function ShuttleBusPassengersPageClient({
  retreatSlug,
}: ShuttleBusPassengersPageClientProps) {
  const addToast = useToastStore(state => state.add);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: buses = [],
    error: busesError,
    isLoading: isBusesLoading,
  } = useSWR(
    `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff-assignments`,
    () => ShuttleBusAPI.getBoardingStaffAssignmentBuses(retreatSlug)
  );

  useEffect(() => {
    if (buses.length === 0) {
      setSelectedBusId(null);
      return;
    }

    if (!selectedBusId || !buses.some(bus => bus.id === selectedBusId)) {
      setSelectedBusId(buses[0].id);
    }
  }, [buses, selectedBusId]);

  const {
    data: passengerResponse,
    error: passengersError,
    isLoading: isPassengersLoading,
  } = useSWR(
    selectedBusId
      ? `/api/v1/retreat/${retreatSlug}/shuttle-bus/admin/buses/${selectedBusId}/passengers`
      : null,
    () => ShuttleBusAPI.getAdminShuttleBusPassengers(retreatSlug, selectedBusId!)
  );

  const passengers = passengerResponse?.passengers ?? [];
  const selectedBus =
    passengerResponse?.shuttleBus ?? buses.find(bus => bus.id === selectedBusId);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredPassengers = useMemo(() => {
    if (!normalizedSearch) {
      return passengers;
    }

    return passengers.filter(passenger =>
      [
        passenger.name,
        passenger.phoneNumber,
        `${passenger.univGroupNumber}부`,
        passenger.univGroupName,
        `${passenger.gradeNumber}학년`,
        passenger.boardingStaffMemo ?? "",
        passenger.confirmedAdminUserName ?? "",
      ].some(value => value.toLowerCase().includes(normalizedSearch))
    );
  }, [normalizedSearch, passengers]);
  const confirmedCount = passengers.filter(passenger => passenger.confirmedAt)
    .length;
  const reviewRequiredCount = passengers.filter(
    passenger => !passenger.confirmedAt && passenger.boardingStaffMemo
  ).length;
  const notConfirmedCount =
    passengers.length - confirmedCount - reviewRequiredCount;
  const hasError = busesError || passengersError;

  const handleDownloadExcel = async () => {
    if (!selectedBusId) {
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await ShuttleBusAPI.downloadAdminShuttleBusPassengersExcel(
        retreatSlug,
        selectedBusId,
        filteredPassengers.map(passenger => passenger.id)
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `셔틀버스_탑승자_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "다운로드 완료",
        description: "현재 검색 조건이 적용된 엑셀 파일을 다운로드했습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "다운로드 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            셔틀버스 탑승 인원 조회
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            셔틀버스 {buses.length}개
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={selectedBusId ? String(selectedBusId) : undefined}
            onValueChange={value => {
              setSelectedBusId(Number(value));
              setSearch("");
            }}
            disabled={isBusesLoading || buses.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[360px]">
              <SelectValue placeholder="셔틀버스를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {buses.map(bus => (
                <SelectItem key={bus.id} value={String(bus.id)}>
                  {bus.name} · {formatDate(bus.departureTime)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleDownloadExcel}
            disabled={
              !selectedBusId ||
              isDownloading ||
              isPassengersLoading ||
              filteredPassengers.length === 0
            }
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            엑셀 다운로드
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border bg-white p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            전체 인원
          </div>
          <div className="mt-2 text-2xl font-semibold">{passengers.length}</div>
        </div>
        <div className="rounded-md border bg-white p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            탑승 확인
          </div>
          <div className="mt-2 text-2xl font-semibold">{confirmedCount}</div>
        </div>
        <div className="rounded-md border bg-white p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            일정 확인 필요
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {reviewRequiredCount}
          </div>
        </div>
        <div className="rounded-md border bg-white p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BusFront className="h-4 w-4" />
            미확인
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {notConfirmedCount}
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <BusFront className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {selectedBus?.name ?? "셔틀버스"}
              </span>
              {selectedBus ? (
                <Badge variant="outline">
                  {selectedBus.direction ===
                  RetreatShuttleBusDirection.FROM_CHURCH_TO_RETREAT
                    ? "교회 → 수양회"
                    : "수양회 → 교회"}
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {selectedBus ? formatDate(selectedBus.departureTime) : "-"}
            </div>
          </div>

          <div className="relative w-full lg:w-[360px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="이름, 전화번호, 부서, 메모 검색"
              className="pl-8"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px] text-center">NO</TableHead>
              <TableHead className="w-[130px]">탑승 상태</TableHead>
              <TableHead className="min-w-[120px]">이름</TableHead>
              <TableHead className="w-[80px]">성별</TableHead>
              <TableHead className="w-[120px]">부서</TableHead>
              <TableHead className="w-[80px]">학년</TableHead>
              <TableHead className="w-[150px]">전화번호</TableHead>
              <TableHead className="w-[150px]">입금상태</TableHead>
              <TableHead className="min-w-[220px]">확인자 / 메모</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isBusesLoading || isPassengersLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-28 text-center">
                  불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : hasError ? (
              <TableRow>
                <TableCell colSpan={9} className="h-28 text-center">
                  데이터를 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : buses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-28 text-center">
                  등록된 셔틀버스가 없습니다.
                </TableCell>
              </TableRow>
            ) : filteredPassengers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-28 text-center">
                  표시할 탑승자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredPassengers.map((passenger, index) => (
                <TableRow key={passenger.shuttleBusRegistrationScheduleId}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <BoardingStatusBadge passenger={passenger} />
                  </TableCell>
                  <TableCell className="font-medium">{passenger.name}</TableCell>
                  <TableCell>
                    {passenger.gender === Gender.MALE ? "남" : "여"}
                  </TableCell>
                  <TableCell>
                    {passenger.univGroupNumber}부 {passenger.univGroupName}
                  </TableCell>
                  <TableCell>{passenger.gradeNumber}학년</TableCell>
                  <TableCell className="font-mono text-xs">
                    {passenger.phoneNumber}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={passenger.shuttleBusPaymentStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {passenger.confirmedAdminUserName || "-"}
                      </div>
                      {passenger.confirmedAt ? (
                        <div className="text-xs text-muted-foreground">
                          {formatDate(passenger.confirmedAt)}
                        </div>
                      ) : null}
                      {passenger.boardingStaffMemo ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                          {passenger.boardingStaffMemo}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
