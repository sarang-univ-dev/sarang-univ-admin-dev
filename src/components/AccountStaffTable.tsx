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
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  CheckCircle2,
  RotateCcw,
  Edit,
  Save,
  X,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { SearchBar } from "@/components/RegistrationTableSearchBar";

import {
  generateScheduleColumns,
  transformRegistrationsForTable,
} from "../utils/retreat-utils";
import { IRetreatRegistration } from "@/hooks/use-account-staff";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";
import { formatDate } from "@/utils/formatDate";
import useSWR, { mutate } from "swr";
import { useToastStore } from "@/store/toast-store";
import { webAxios } from "@/lib/api/axios";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";

export function AccountStaffTable({
  registrations = [],
  schedules = [],
  retreatSlug,
}: {
  registrations: IRetreatRegistration[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [editingMemo, setEditingMemo] = useState<Record<string, boolean>>({});
  const [memoValues, setMemoValues] = useState<Record<string, string>>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const confirmDialog = useConfirmDialogStore();

  // API 엔드포인트
  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/account/retreat-registrations`;

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (registrations.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformRegistrationsForAccountStaff(
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

  // IRetreatRegistration을 테이블 데이터로 변환하는 함수
  const transformRegistrationsForAccountStaff = (
    registrations: IRetreatRegistration[],
    schedules: TRetreatRegistrationSchedule[]
  ) => {
    return registrations.map(registration => {
      // 스케줄 정보 변환
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach(schedule => {
        scheduleData[`schedule_${schedule.id}`] =
          registration.userRetreatRegistrationScheduleIds?.includes(
            schedule.id
          ) || false;
      });

      return {
        id: registration.id,
        department: `${registration.univGroupNumber}부`,
        gender: registration.gender,
        grade: `${registration.gradeNumber}학년`,
        name: registration.name,
        phoneNumber: registration.phoneNumber,
        schedule: scheduleData,
        type: registration.userType,
        amount: registration.price,
        status: registration.paymentStatus,
        createdAt: registration.createdAt,
        confirmedBy: registration.paymentConfirmUserName,
        paymentConfirmedAt: registration.paymentConfirmedAt,
        accountMemo: registration.accountMemo,
        accountMemoId: registration.accountMemoId,
      };
    });
  };

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
  const performAssignStaff = async (id: string) => {
    setLoading(id, "assign", true);
    try {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/account/assign-staff`,
        {
          userRetreatRegistrationId: id,
        }
      );

      await mutate(registrationsEndpoint);

      addToast({
        title: "성공",
        description: "간사 배정이 성공적으로 처리되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("간사 배정 중 오류 발생:", error);

      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "간사 배정 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "assign", false);
    }
  };

  // 입금 확인 완료 처리 함수
  const performConfirmPayment = async (id: string) => {
    setLoading(id, "confirm", true);
    try {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/account/confirm-payment`,
        {
          userRetreatRegistrationId: id,
        }
      );

      await mutate(registrationsEndpoint);

      addToast({
        title: "성공",
        description: "입금 확인이 성공적으로 처리되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("입금 확인 중 오류 발생:", error);

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

  // 간사 배정 처리 함수
  const handleAssignStaff = (id: string) => {
    confirmDialog.show({
      title: "간사 배정",
      description: "정말로 간사 배정 처리를 하시겠습니까?",
      onConfirm: () => performAssignStaff(id),
    });
  };

  // 입금 확인 완료 처리 함수
  const handleConfirmPayment = (id: string) => {
    confirmDialog.show({
      title: "입금 확인 완료",
      description: "정말로 입금 확인 완료 처리를 하시겠습니까?",
      onConfirm: () => performConfirmPayment(id),
    });
  };

  // 환불 처리 함수 (임시 구현)
  const handleRefundProcess = (id: string) => {
    alert("환불 처리 기능은 구현이 필요합니다");
  };

  // 메모 편집 시작
  const handleStartEditMemo = (id: string, currentMemo: string) => {
    setEditingMemo(prev => ({ ...prev, [id]: true }));
    setMemoValues(prev => ({ ...prev, [id]: currentMemo || "" }));
  };

  // 메모 편집 취소
  const handleCancelEditMemo = (id: string) => {
    setEditingMemo(prev => ({ ...prev, [id]: false }));
    setMemoValues(prev => ({ ...prev, [id]: "" }));
  };

  // 메모 저장
  const handleSaveMemo = async (id: string) => {
    const memo = memoValues[id];
    const currentRow = filteredData.find(row => row.id === id);
    const hasExistingMemo =
      currentRow?.accountMemo && currentRow.accountMemo.trim();
    const memoId = currentRow?.accountMemoId;

    setLoading(id, "memo", true);

    try {
      if (memo && memo.trim()) {
        if (hasExistingMemo && memoId) {
          // 기존 메모가 있는 경우 - PUT 요청으로 수정
          const response = await webAxios.put(
            `/api/v1/retreat/${retreatSlug}/account/${memoId}/account-memo`,
            {
              memo: memo.trim(),
            }
          );
        } else {
          // 새 메모 생성 - POST 요청
          const response = await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/account/${id}/account-memo`,
            {
              memo: memo.trim(),
            }
          );
        }
      }

      await mutate(registrationsEndpoint);

      setEditingMemo(prev => ({ ...prev, [id]: false }));
      setMemoValues(prev => ({ ...prev, [id]: "" }));

      addToast({
        title: "성공",
        description: hasExistingMemo
          ? "메모가 성공적으로 수정되었습니다."
          : "메모가 성공적으로 저장되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("메모 저장 중 오류 발생:", error);

      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "memo", false);
    }
  };

  // 메모 삭제
  const handleDeleteMemo = async (id: string) => {
    const currentRow = filteredData.find(row => row.id === id);
    const memoId = currentRow?.accountMemoId;

    setLoading(id, "delete_memo", true);

    try {
      const response = await webAxios.delete(
        `/api/v1/retreat/${retreatSlug}/account/${memoId}/account-memo`
      );

      await mutate(registrationsEndpoint);

      addToast({
        title: "성공",
        description: "메모가 성공적으로 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("메모 삭제 중 오류 발생:", error);

      addToast({
        title: "오류 발생",
        description:
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : error instanceof Error
              ? error.message
              : "메모 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(id, "delete_memo", false);
    }
  };

  // 메모 삭제 확인
  const handleConfirmDeleteMemo = (id: string) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: () => handleDeleteMemo(id),
    });
  };

  // 액션 버튼 렌더링
  const getActionButtons = (row: any) => {
    switch (row.status) {
      case UserRetreatRegistrationPaymentStatus.PENDING:
        return (
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConfirmPayment(row.id)}
              disabled={isLoading(row.id, "confirm")}
              className="flex items-center gap-1.5 hover:bg-green-600 hover:text-white transition-colors"
            >
              {isLoading(row.id, "confirm") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>입금 확인 완료</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAssignStaff(row.id)}
              disabled={isLoading(row.id, "assign")}
              className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
            >
              {isLoading(row.id, "assign") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>간사 배정</span>
            </Button>
          </div>
        );
      case UserRetreatRegistrationPaymentStatus.PAID:
        return (
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRefundProcess(row.id)}
              disabled={isLoading(row.id, "refund")}
              className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
            >
              {isLoading(row.id, "refund") ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              <span>환불 처리</span>
            </Button>
          </div>
        );
      case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
        return null;
      case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
        return null;
      case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
        return null;
      default:
        return null;
    }
  };

  // 일정 체크박스 컬럼 정의
  const scheduleColumns = generateScheduleColumns(schedules);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div className="whitespace-nowrap">
          <CardTitle>재정 간사 조회</CardTitle>
          <CardDescription>대학부 전체 신청자 목록 조회</CardDescription>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setLoadingStates(prev => ({ ...prev, exportExcel: true }));
              try {
                const response = await webAxios.get(
                  `/api/v1/retreat/${retreatSlug}/account/download-retreat-registration-excel`,
                  { responseType: 'blob' }
                );
                
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `수양회_신청현황_${formatDate(new Date().toISOString())}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                
                addToast({
                  title: "성공",
                  description: "엑셀 파일이 다운로드되었습니다.",
                  variant: "success",
                });
              } catch (error) {
                console.error("엑셀 다운로드 중 오류 발생:", error);
                addToast({
                  title: "오류 발생",
                  description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
                  variant: "destructive",
                });
              } finally {
                setLoadingStates(prev => ({ ...prev, exportExcel: false }));
              }
            }}
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

          <div className="rounded-md border overflow-x-auto">
            <div className="min-w-max">
              <div className="max-h-[80vh] overflow-y-auto">
                <Table className="w-full whitespace-nowrap relative">
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>부서</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>성별</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>학년</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="sticky left-0 bg-gray-50 z-20 text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>이름</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>전화번호</span>
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="whitespace-nowrap px-2 py-1"
                      >
                        <div className="text-center">수양회 신청 일정</div>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>타입</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>금액</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>신청 시각</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>입금 현황</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        액션
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>처리자명</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>처리 시각</span>
                      </TableHead>
                      <TableHead
                        rowSpan={2}
                        className="text-center whitespace-nowrap px-2 py-1"
                      >
                        <span>회계 메모</span>
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumns.map(scheduleCol => (
                        <TableHead
                          key={scheduleCol.key}
                          className="px-2 py-1 text-center whitespace-nowrap"
                        >
                          <span className="text-xs">{scheduleCol.label}</span>
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
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {row.department}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          <GenderBadge gender={row.gender} />
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {row.grade}
                        </TableCell>
                        <TableCell className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center whitespace-nowrap px-2 py-1">
                          {row.name}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {row.phoneNumber}
                        </TableCell>
                        {scheduleColumns.map(col => (
                          <TableCell
                            key={`${row.id}-${col.key}`}
                            className="px-2 py-1 text-center group-hover:bg-gray-50 whitespace-nowrap"
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
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          <TypeBadge type={row.type} />
                        </TableCell>
                        <TableCell className="font-medium group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {row.amount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {row.createdAt ? formatDate(row.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {getActionButtons(row)}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {row.confirmedBy || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap px-2 py-1">
                          {formatDate(row.paymentConfirmedAt)}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-left px-2 py-1">
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
                                placeholder="메모를 입력하세요..."
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
                                disabled={isLoading(row.id, "memo")}
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
                                  disabled={isLoading(row.id, "memo")}
                                  className="h-7 px-2"
                                >
                                  {isLoading(row.id, "memo") ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelEditMemo(row.id)}
                                  disabled={isLoading(row.id, "memo")}
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
                                  handleStartEditMemo(row.id, row.accountMemo)
                                }
                              >
                                {row.accountMemo ||
                                  "메모를 추가하려면 클릭하세요"}
                              </div>
                              {row.accountMemo && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleConfirmDeleteMemo(row.id)
                                  }
                                  disabled={isLoading(row.id, "delete_memo")}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
                                >
                                  {isLoading(row.id, "delete_memo") ? (
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
