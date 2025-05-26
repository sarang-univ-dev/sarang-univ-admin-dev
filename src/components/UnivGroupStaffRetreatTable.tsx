"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Download,
  CheckCircle2,
  RotateCcw,
  Send,
  Search,
  X,
  QrCode,
  CheckSquare,
  XSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { SearchBar } from "@/components/RegistrationTableSearchBar";

import { generateScheduleColumns } from "../utils/retreat-utils";
import { IUnivGroupStaffRetreat } from "@/hooks/use-univ-group-staff-retreat";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
  Gender,
  UserRetreatRegistrationType,
} from "@/types";
import { formatDate } from "@/utils/formatDate";
import { mutate } from "swr";
import { useToastStore } from "@/store/toast-store";
import { webAxios } from "@/lib/api/axios";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";

const transformStaffRegistrationsForTable = (
  registrations: IUnivGroupStaffRetreat[],
  schedules: TRetreatRegistrationSchedule[]
) => {
  return registrations.map(reg => ({
    id: reg.id.toString(),
    department: `${reg.univGroupNumber}부`,
    gender: reg.gender,
    grade: `${reg.gradeNumber}학년`,
    name: reg.name,
    phone: reg.userPhoneNumber,
    schedule: schedules.reduce((acc, cur) => {
      acc[`schedule_${cur.id}`] = (
        reg.userRetreatRegistrationScheduleIds || []
      ).includes(cur.id);
      return acc;
    }, {} as Record<string, boolean>),
    type: reg.userType,
    amount: reg.price,
    createdAt: reg.createdAt,
    status: reg.paymentStatus,
    confirmedBy: reg.paymentConfirmUserName,
    paymentConfirmedAt: reg.paymentConfirmedAt,
    gbs: reg.gbsName,
    accommodation: reg.dormitoryName,
    memo: reg.univGroupStaffScheduleHistoryMemo,
    memoBy: reg.univGroupStaffScheduleHistoryResolvedUserName,
    memoAt: reg.univGroupStaffScheduleHistoryResolvedAt,
  }));
};

export function UnivGroupStaffRetreatTable({
  registrations: initialRegistrations = [],
  schedules = [],
  retreatSlug,
}: {
  registrations: IUnivGroupStaffRetreat[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirmDialogStore();
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [currentRowId, setCurrentRowId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  const registrationsEndpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`
    : null;

  useEffect(() => {
    if (initialRegistrations.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformStaffRegistrationsForTable(
          initialRegistrations,
          schedules
        );
        setAllData(transformedData);
      } catch (error) {
        console.error("데이터 변환 중 오류 발생:", error);
        addToast({
          title: "오류",
          description:
            error instanceof AxiosError
              ? error.response?.data?.message || error.message
              : error instanceof Error
              ? error.message
              : "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } else {
      setAllData([]);
    }
  }, [initialRegistrations, schedules, addToast]);

  useEffect(() => {
    let dataToFilter = [...allData];

    if (searchTerm) {
      dataToFilter = dataToFilter.filter(row =>
        [
          row.name,
          row.department,
          row.grade?.toString(),
          row.type?.toString(),
          row.phone?.toString(),
          row.gbs?.toString(),
          row.accommodation?.toString(),
        ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredData(dataToFilter);
  }, [allData, searchTerm]);

  const setLoading = (id: string, action: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${id}_${action}`]: isLoading,
    }));
  };

  const isLoading = (id: string, action: string) => {
    return !!loadingStates[`${id}_${action}`];
  };

  // 실제 환불 처리 함수
  const performCompleteRefund = async (id: string) => {
    setLoading(id, "refund", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/account/refund-complete`,
        { userRetreatRegistrationId: id }
      );
      if (registrationsEndpoint) await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "환불이 성공적으로 처리되었습니다.",
      });
    } catch (error) {
      console.error("환불 처리 중 오류 발생:", error);
      addToast({
        title: "오류",
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

  // 환불 처리 함수
  const handleCompleteRefund = (id: string) => {
    confirmDialog.show({
      title: "환불 처리",
      description: "정말로 환불 처리를 완료하시겠습니까?",
      onConfirm: () => performCompleteRefund(id),
    });
  };

  // 실제 새가족 신청 처리 함수
  const performNewFamilyRequest = async (id: string, approve: boolean) => {
    setLoading(id, "newFamily", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/registration/${id}/assign-user-type`,
        {
          userType: approve ? "NEW_COMER" : null,
        }
      );
      if (registrationsEndpoint) await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: `새가족 신청이 성공적으로 ${
          approve ? "승인" : "거절"
        }되었습니다.`,
      });
    } catch (error) {
      console.error("새가족 신청 처리 중 오류 발생:", error);
      addToast({
        title: "오류",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "새가족 신청 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "newFamily", false);
    }
  };

  // 새가족 신청 처리 함수
  const handleNewFamilyRequest = (id: string, approve: boolean) => {
    confirmDialog.show({
      title: approve ? "새가족 신청 승인" : "새가족 신청 거절",
      description: approve
        ? "정말로 새가족 신청을 승인하시겠습니까? 새가족으로 입금 안내 문자가 전송됩니다."
        : "정말로 새가족 신청을 거절하시겠습니까? 일반 지체로 입금 안내 문자가 전송됩니다.",
      onConfirm: () => performNewFamilyRequest(id, approve),
    });
  };

  // 실제 군지체 신청 처리 함수
  const performMilitaryRequest = async (id: string, approve: boolean) => {
    setLoading(id, "military", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/registration/${id}/assign-user-type`,
        {
          userType: approve ? "SOLDIER" : null,
        }
      );
      if (registrationsEndpoint) await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: `군지체 신청이 성공적으로 ${
          approve ? "승인" : "거절"
        }되었습니다.`,
      });
    } catch (error) {
      console.error("군지체 신청 처리 중 오류 발생:", error);
      addToast({
        title: "오류",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "군지체 신청 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "military", false);
    }
  };

  // 군지체 신청 처리 함수
  const handleMilitaryRequest = (id: string, approve: boolean) => {
    confirmDialog.show({
      title: approve ? "군지체 신청 승인" : "군지체 신청 거절",
      description: approve
        ? "정말로 군지체 신청을 승인하시겠습니까? 군지체로 입금 안내 문자가 전송됩니다."
        : "정말로 군지체 신청을 거절하시겠습니까? 일반 지체로 입금 안내 문자가 전송됩니다.",
      onConfirm: () => performMilitaryRequest(id, approve),
    });
  };

  const handleSendMessage = async (id: string, messageType: string) => {
    setLoading(id, messageType, true);
    try {
      if (messageType === "payment_request") {
        await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/account/request-payment`,
          { userRetreatRegistrationId: id }
        );
        addToast({
          title: "성공",
          description: "입금 요청 메시지가 성공적으로 전송되었습니다.",
        });
      }
    } catch (error) {
      console.error(`${messageType} 메시지 전송 중 오류 발생:`, error);
      addToast({
        title: "오류",
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

  const handleSubmitMemo = async () => {
    if (!currentRowId || !memoText.trim()) return;
    setLoading(currentRowId, "memo", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/registration/${currentRowId}/schedule-change-request-memo`,
        {
          memo: memoText,
        }
      );
      if (registrationsEndpoint) await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "메모가 성공적으로 저장되었습니다.",
      });
      setMemoDialogOpen(false);
      setMemoText("");
      setCurrentRowId(null);
    } catch (error) {
      console.error("메모 저장 중 오류 발생:", error);
      addToast({
        title: "오류",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      if (currentRowId) setLoading(currentRowId, "memo", false);
    }
  };

  const handleOpenMemoDialog = (id: string) => {
    setCurrentRowId(id);
    const currentRow = filteredData.find(row => row.id === id);
    setMemoText(currentRow?.memo || "");
    setMemoDialogOpen(true);
  };

  const handleCloseMemoDialog = () => {
    setMemoDialogOpen(false);
    setMemoText("");
    setCurrentRowId(null);
  };

  const handleDownloadQR = async (id: string, name: string) => {
    setLoading(id, "qrDownload", true);
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/univ-group-staff/${id}/qr-code`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${name}_QR.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast({ title: "성공", description: "QR 코드가 다운로드되었습니다." });
    } catch (error) {
      console.error("QR 코드 다운로드 중 오류 발생:", error);
      addToast({
        title: "오류",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : "QR 코드 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "qrDownload", false);
    }
  };

  const getActionButtons = (row: any) => {
    switch (row.status) {
      case UserRetreatRegistrationPaymentStatus.PENDING:
        return null;
      case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
        return (
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
        );
      case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
        return (
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleNewFamilyRequest(row.id, true)}
              disabled={isLoading(row.id, "newFamily")}
              className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors"
            >
              {isLoading(row.id, "newFamily") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckSquare className="h-3.5 w-3.5" />
              )}
              <span>새가족 신청 승인</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleNewFamilyRequest(row.id, false)}
              disabled={isLoading(row.id, "newFamily")}
              className="flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-colors"
            >
              {isLoading(row.id, "newFamily") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <XSquare className="h-3.5 w-3.5" />
              )}
              <span>새가족 신청 거절</span>
            </Button>
          </div>
        );
      case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
        return (
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMilitaryRequest(row.id, true)}
              disabled={isLoading(row.id, "military")}
              className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors"
            >
              {isLoading(row.id, "military") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckSquare className="h-3.5 w-3.5" />
              )}
              <span>군지체 신청 승인</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMilitaryRequest(row.id, false)}
              disabled={isLoading(row.id, "military")}
              className="flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-colors"
            >
              {isLoading(row.id, "military") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <XSquare className="h-3.5 w-3.5" />
              )}
              <span>군지체 신청 거절</span>
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const scheduleColumns = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  const exportToExcel = () => {
    alert("엑셀 내보내기 기능은 구현이 필요합니다.");
    // Consider using a library like 'xlsx' or a server-side export.
    // Example using 'xlsx' (needs installation: npm install xlsx)
    /*
    if (typeof window !== 'undefined') { // Ensure this runs client-side
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(filteredData.map(row => ({
        // Map row data to desired Excel column headers
        '부서': row.department,
        '성별': row.gender,
        '학년': row.grade,
        '이름': row.name,
        '전화번호': row.phone,
        // Add schedule columns dynamically if needed
        '타입': row.type,
        '금액': row.amount,
        '신청시각': formatDate(row.createdAt),
        '입금현황': statusOptions.find(s => s.value === row.status)?.label || row.status,
        '처리자명': row.confirmedBy,
        '처리시각': formatDate(row.paymentConfirmedAt),
        'GBS': row.gbs,
        '숙소': row.accommodation,
        '메모': row.memo,
        '메모 처리자명': row.memoBy,
        '메모 처리 시각': formatDate(row.memoAt),
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, "스태프_수양회_신청현황.xlsx");
    }
    */
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b px-4 py-3">
        <div>
          <CardTitle className="text-lg">부서 현황 및 입금 조회</CardTitle>
          <CardDescription className="text-sm">
            부서 신청자 목록
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={isLoading("excelExport", "export")}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
          >
            {isLoading("excelExport", "export") ? (
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
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="통합 검색 (이름, 부서, 학년, 타입, GBS, 숙소 등)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            className="rounded-md border overflow-hidden"
            ref={tableContainerRef}
          >
            <div className="overflow-x-auto">
              <div className="max-h-[80vh] overflow-y-auto">
                <Table className="min-w-full whitespace-nowrap relative text-sm">
                  <TableHeader className="bg-gray-100 sticky top-0 z-10 select-none">
                    <TableRow>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>부서</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>성별</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>학년</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="sticky left-0 bg-gray-100 z-20 px-3 py-2.5"
                        rowSpan={2}
                      >
                        <div className="flex items-center space-x-1 justify-center">
                          <span>이름</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>전화번호</span>
                        </div>
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="text-center px-3 py-2.5"
                      >
                        수양회 신청 일정
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>타입</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>금액</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>신청시각</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>입금 현황</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-3 py-2.5 text-center"
                        rowSpan={2}
                      >
                        액션
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>처리자명</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>처리시각</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>GBS</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>숙소</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>일정 변동 요청 메모</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-3 py-2.5 text-center"
                        rowSpan={2}
                      >
                        메모 관리
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>메모 처리자</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>메모 처리시각</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-3 py-2.5 text-center"
                        rowSpan={2}
                      >
                        QR
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumns.map(scheduleCol => (
                        <TableHead
                          key={scheduleCol.key}
                          className="p-2 text-center"
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-xs whitespace-normal">
                              {scheduleCol.label}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={18 + scheduleColumns.length}
                          className="text-center py-10 text-gray-500"
                        >
                          {allData.length > 0
                            ? "검색 결과가 없습니다."
                            : "표시할 데이터가 없습니다."}
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredData.map(row => (
                      <TableRow
                        key={row.id}
                        className="group hover:bg-gray-50 transition-colors duration-150"
                      >
                        <TableCell className="text-center px-3 py-2.5">
                          {row.department}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          <GenderBadge gender={row.gender} />
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          {row.grade}
                        </TableCell>
                        <TableCell className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center px-3 py-2.5">
                          {row.name}
                        </TableCell>
                        <TableCell className="font-medium text-center px-3 py-2.5">
                          {row.phone || "-"}
                        </TableCell>
                        {scheduleColumns.map(col => (
                          <TableCell
                            key={`${row.id}-${col.key}`}
                            className="p-2 text-center"
                          >
                            <Checkbox
                              checked={!!row.schedule[col.key]}
                              disabled
                              className={
                                row.schedule[col.key] ? col.bgColorClass : ""
                              }
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center px-3 py-2.5">
                          <TypeBadge type={row.type} />
                        </TableCell>
                        <TableCell className="font-medium text-center px-3 py-2.5">
                          {row.amount?.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-gray-600 text-xs text-center whitespace-nowrap px-3 py-2.5">
                          {formatDate(row.createdAt)}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="min-w-[150px] text-center px-3 py-2.5">
                          {getActionButtons(row)}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          {row.confirmedBy || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600 text-xs text-center whitespace-nowrap px-3 py-2.5">
                          {formatDate(row.paymentConfirmedAt)}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          {row.gbs || "-"}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          {row.accommodation || "-"}
                        </TableCell>
                        <TableCell
                          className="text-center min-w-[200px] max-w-[300px] whitespace-pre-wrap break-words px-3 py-2.5"
                          title={row.memo}
                        >
                          {row.memo || "-"}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          {row.memo ? (
                            <span className="text-gray-600 text-sm">-</span>
                          ) : row.status ===
                            UserRetreatRegistrationPaymentStatus.PAID ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMemoDialog(row.id)}
                              className="flex items-center gap-1.5 text-xs h-7"
                            >
                              <span>작성</span>
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          {row.memoBy || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600 text-xs text-center whitespace-nowrap px-3 py-2.5">
                          {formatDate(row.memoAt)}
                        </TableCell>
                        <TableCell className="text-center px-3 py-2.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadQR(row.id, row.name)}
                            disabled={isLoading(row.id, "qrDownload")}
                            className="flex items-center gap-1.5 text-xs h-7"
                          >
                            {isLoading(row.id, "qrDownload") ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <QrCode className="h-3 w-3" />
                            )}
                            <span>QR</span>
                          </Button>
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
      {memoDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all duration-300 ease-out scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">메모 작성</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseMemoDialog}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              className="w-full border rounded-md p-2 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="메모를 입력하세요... ex) 전참 → 금숙 ~ 토점"
              value={memoText}
              onChange={e => setMemoText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCloseMemoDialog}>
                취소
              </Button>
              <Button
                onClick={handleSubmitMemo}
                disabled={
                  !memoText.trim() || isLoading(currentRowId || "", "memo")
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading(currentRowId || "", "memo") ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : null}
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
