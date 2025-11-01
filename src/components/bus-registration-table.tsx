"use client";

import { TableHeader } from "@/components/ui/table";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, CheckCircle2, RotateCcw, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { GenderBadge, StatusBadge } from "@/components/Badge";
import { SearchBar } from "@/components/RegistrationTableSearchBar";
import {
  generateShuttleBusScheduleColumns,
  transformRegistrationsForTable,
} from "../utils/bus-utils";
import { IUserBusRegistration } from "@/hooks/use-user-bus-registration";
import {
  TRetreatShuttleBus,
  UserRetreatShuttleBusPaymentStatus,
} from "@/types";
import { formatDate } from "@/utils/formatDate";
import useSWR, { mutate } from "swr";
import { useToastStore } from "@/store/toast-store";
import { webAxios } from "@/lib/api/axios";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";

export function RegistrationTable({
  registrations = [],
  schedules = [],
  retreatSlug,
}: {
  registrations: IUserBusRegistration[];
  schedules: TRetreatShuttleBus[];
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const confirmDialog = useConfirmDialogStore();

  // API 엔드포인트
  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`;

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (registrations.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformRegistrationsForTable(
          registrations,
          schedules
        );
        setData(transformedData);
        setFilteredData(transformedData);
      } catch (error) {
        console.error("데이터 변환 중 오류 발생:", error);
      }
    }
  }, [registrations, schedules]);

  // 검색 결과 처리 함수
  const handleSearchResults = (results: any[], searchTerm: string) => {
    setFilteredData(results);
  };

  // 로딩 상태 설정 함수
  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  // 로딩 상태 확인 함수
  const isLoading = (id: string, action: string) => {
    return !!loadingStates[`${id}_${action}`];
  };

  // 액션 처리 함수들
  const performConfirmPayment = async (id: string) => {
    setLoading(id, "confirm", true);
    try {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/confirm-payment`
      );

      // SWR 캐시 업데이트
      await mutate(registrationsEndpoint);

      // 성공 토스트 메시지
      addToast({
        title: "성공",
        description: "입금이 성공적으로 확인되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("입금 확인 중 오류 발생:", error);

      // 실패 토스트 메시지
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "입금 확인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "confirm", false);
    }
  };

  const handleConfirmPayment = (id: string) => {
    confirmDialog.show({
      title: "입금 확인",
      description:
        "정말로 입금 확인 처리를 하시겠습니까? 입금 확인 문자가 전송됩니다.",
      onConfirm: () => performConfirmPayment(id),
    });
  };

  const handleCompleteRefund = async (id: string) => {
    setLoading(id, "refund", true);
    try {
      // TODO once api is made
      // const response = await webAxios.post(
      //   `/api/v1/retreat/${retreatSlug}/shuttle-bus/${id}/refund-complete`,
      //   {
      //     userRetreatShuttleBusRegistrationId: id,
      //   }
      // );

      // SWR 캐시 업데이트
      await mutate(registrationsEndpoint);

      // 성공 토스트 메시지
      addToast({
        title: "성공",
        description: "환불이 성공적으로 처리되었습니다.",
        variant: "default",
      });
    } catch (error) {
      console.error("환불 처리 중 오류 발생:", error);

      // 실패 토스트 메시지
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "환불 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "refund", false);
    }
  };

  const performSendMessage = async (id: string, messageType: string) => {
    setLoading(id, messageType, true);
    try {
      // TODO once api is  made
      if (messageType === "payment_request") {
        const response = await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/shuttle-bus/request-payment`,
          {
            userRetreatShuttleBusRegistrationId: parseInt(id),
          }
        );

        // 성공 토스트 메시지
        addToast({
          title: "성공",
          description: "입금 요청 메시지가 성공적으로 전송되었습니다.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error(`${messageType} 메시지 전송 중 오류 발생:`, error);

      // 실패 토스트 메시지
      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, messageType, false);
    }
  };

  const handleSendMessage = (id: string, messageType: string) => {
    if (messageType === "payment_request") {
      confirmDialog.show({
        title: "입금 요청",
        description:
          "정말로 입금 요청 처리를 하시겠습니까? 입금 요청 문자가 전송됩니다.",
        onConfirm: () => performSendMessage(id, messageType),
      });
    }
  };

  // 액션 버튼 렌더링
  const getActionButtons = (row: any) => {
    switch (row.status) {
      case UserRetreatShuttleBusPaymentStatus.PENDING:
        return (
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConfirmPayment(row.id)}
              disabled={isLoading(row.id, "confirm")}
              className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
            >
              {isLoading(row.id, "confirm") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>입금 확인</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage(row.id, "payment_request")}
              disabled={isLoading(row.id, "payment_request")}
              className="flex items-center gap-1.5"
            >
              {isLoading(row.id, "payment_request") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>입금 요청</span>
            </Button>
          </div>
        );
      case UserRetreatShuttleBusPaymentStatus.REFUND_REQUEST:
        return (
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCompleteRefund(row.id)}
              disabled={isLoading(row.id, "refund")}
              className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
            >
              {isLoading(row.id, "refund") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              <span>환불 처리 완료</span>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // 일정 체크박스 컬럼 정의
  const scheduleColumns = generateShuttleBusScheduleColumns(schedules);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div className="whitespace-nowrap">
          <CardTitle>버스 신청 현황 및 입금 조회</CardTitle>
          <CardDescription>전체 버스 신청자 목록</CardDescription>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("엑셀로 내보내기 함수가 구현되어야합니다.")}
            disabled={loadingStates.exportExcel}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
          >
            {loadingStates.exportExcel ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>엑셀로 내보내기</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <SearchBar onSearch={handleSearchResults} data={data} />

          <div className="rounded-md border">
            <div className="min-w-max">
              <div className="max-h-[80vh] overflow-y-auto">
                <Table className="w-full whitespace-nowrap relative">
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>부서</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>성별</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>학년</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="sticky left-0 bg-gray-50 z-20 text-center whitespace-nowrap px-3 py-2.5"
                      >
                        <span>이름</span>
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="whitespace-nowrap"
                      >
                        <div className="text-center">버스 신청 일정</div>
                      </TableHead>

                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>금액</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>신청 시각</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>입금 현황</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        액션
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>처리자명</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap"
                      >
                        <span>처리 시각</span>
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumns.map(scheduleCol => (
                        <TableHead
                          key={scheduleCol.key}
                          className="p-2 text-center"
                        >
                          <span className="text-xs whitespace-pre-line">
                            {scheduleCol.label}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map(row => (
                      <TableRow
                        key={row.id}
                        className="group transition-colors duration-150 hover:bg-gray-50"
                      >
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.department}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          <GenderBadge gender={row.gender} />
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.grade}
                        </TableCell>
                        <TableCell className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center whitespace-nowrap px-3 py-2.5">
                          {row.name}
                        </TableCell>
                        {scheduleColumns.map(col => (
                          <TableCell
                            key={`${row.id}-${col.key}`}
                            className="p-2 text-center group-hover:bg-gray-50 whitespace-nowrap"
                          >
                            <Checkbox
                              checked={row.schedule[col.key]}
                              disabled
                              className={
                                row.schedule[col.key] ? col.bgColorClass : ""
                              }
                            />
                          </TableCell>
                        ))}

                        <TableCell className="font-medium group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.amount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.createdAt ? formatDate(row.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="min-w-[180px] group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {getActionButtons(row)}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.confirmedBy || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {formatDate(row.paymentConfirmedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
