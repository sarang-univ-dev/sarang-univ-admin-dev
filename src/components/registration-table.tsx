"use client";

import { useState, useEffect, useMemo, CSSProperties } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  Column,
} from "@tanstack/react-table";
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

import { GenderBadge } from "@/components/Badge";
import { StatusBadge, TypeBadge } from "@/components/common/retreat";
import { SearchBar } from "@/components/RegistrationTableSearchBar";

import {
  generateScheduleColumns,
  transformRegistrationsForTable,
} from "../utils/retreat-utils";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
  UserRetreatRegistrationType,
  Gender,
} from "@/types";
import { formatDate } from "@/utils/formatDate";
import { mutate } from "swr";
import { useToastStore } from "@/store/toast-store";
import { webAxios } from "@/lib/api/axios";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { AxiosError } from "axios";

// TanStack Table용 타입 정의
type RegistrationTableRow = {
  id: string;
  department: string;
  gender: Gender;
  grade: string;
  name: string;
  schedule: Record<string, boolean>;
  type: UserRetreatRegistrationType | null;
  amount: number;
  createdAt: string | null;
  status: UserRetreatRegistrationPaymentStatus;
  confirmedBy: string | null;
  paymentConfirmedAt: string | null;
};

// Sticky Column Helper Function (TanStack 공식 권장)
const getCommonPinningStyles = (
  column: Column<RegistrationTableRow>,
  isHeader: boolean = false
): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left');

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px rgba(0, 0, 0, 0.1) inset'
      : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    zIndex: isPinned ? 1 : 0,
    backgroundColor: isPinned ? (isHeader ? 'rgb(249 250 251)' : 'white') : undefined,
    whiteSpace: 'nowrap',
  };
};

export function RegistrationTable({
  registrations = [],
  schedules = [],
  retreatSlug,
}: {
  registrations: IUserRetreatRegistration[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const [data, setData] = useState<RegistrationTableRow[]>([]);
  const [filteredData, setFilteredData] = useState<RegistrationTableRow[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const confirmDialog = useConfirmDialogStore();

  // API 엔드포인트
  const registrationsEndpoint = `/api/v1/retreat/${retreatSlug}/account/user-retreat-registration`;

  // 일정 컬럼 생성
  const scheduleColumns = useMemo(() => generateScheduleColumns(schedules), [schedules]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (registrations.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformRegistrationsForTable(
          registrations,
          schedules
        ).filter((row): row is RegistrationTableRow => row !== null);
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
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/account/confirm-payment`,
        { userRetreatRegistrationId: id }
      );
      await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "입금이 성공적으로 확인되었습니다.",
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

  const handleConfirmPayment = (id: string) => {
    confirmDialog.show({
      title: "입금 확인",
      description: "정말로 입금 확인 처리를 하시겠습니까? 입금 확인 문자가 전송됩니다.",
      onConfirm: () => performConfirmPayment(id),
    });
  };

  const handleCompleteRefund = async (id: string) => {
    setLoading(id, "refund", true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/account/refund-complete`,
        { userRetreatRegistrationId: id }
      );
      await mutate(registrationsEndpoint);
      addToast({
        title: "성공",
        description: "환불이 성공적으로 처리되었습니다.",
        variant: "default",
      });
    } catch (error) {
      console.error("환불 처리 중 오류 발생:", error);
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
      if (messageType === "payment_request") {
        await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/account/request-payment`,
          { userRetreatRegistrationId: id }
        );
        addToast({
          title: "성공",
          description: "입금 요청 메시지가 성공적으로 전송되었습니다.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error(`${messageType} 메시지 전송 중 오류 발생:`, error);
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
        description: "정말로 입금 요청 처리를 하시겠습니까? 입금 요청 문자가 전송됩니다.",
        onConfirm: () => performSendMessage(id, messageType),
      });
    }
  };

  // 액션 버튼 렌더링
  const getActionButtons = (row: RegistrationTableRow) => {
    switch (row.status) {
      case UserRetreatRegistrationPaymentStatus.PENDING:
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
      case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
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

  // TanStack Table 컬럼 정의
  const columns = useMemo<ColumnDef<RegistrationTableRow>[]>(() => {
    const baseColumns: ColumnDef<RegistrationTableRow>[] = [
      {
        id: 'department',
        header: '부서',
        accessorKey: 'department',
        cell: ({ getValue }) => <div className="text-center">{getValue() as string}</div>,
      },
      {
        id: 'gender',
        header: '성별',
        accessorKey: 'gender',
        cell: ({ getValue }) => (
          <div className="text-center">
            <GenderBadge gender={getValue() as Gender} />
          </div>
        ),
      },
      {
        id: 'grade',
        header: '학년',
        accessorKey: 'grade',
        cell: ({ getValue }) => <div className="text-center">{getValue() as string}</div>,
      },
      {
        id: 'name',
        header: '이름',
        accessorKey: 'name',
        cell: ({ getValue }) => <div className="font-medium text-center">{getValue() as string}</div>,
      },
    ];

    // 일정 컬럼 동적 추가
    const dynamicScheduleColumns: ColumnDef<RegistrationTableRow>[] = scheduleColumns.map(col => ({
      id: col.key,
      header: col.label,
      accessorFn: (row) => row.schedule[col.key],
      cell: ({ getValue }) => (
        <div className="flex justify-center">
          <Checkbox
            checked={getValue() as boolean}
            disabled
            className={getValue() ? col.bgColorClass : ""}
          />
        </div>
      ),
    }));

    const endColumns: ColumnDef<RegistrationTableRow>[] = [
      {
        id: 'type',
        header: '타입',
        accessorKey: 'type',
        cell: ({ getValue }) => {
          const type = getValue() as UserRetreatRegistrationType | null;
          return (
            <div className="text-center">
              {type ? <TypeBadge type={type} /> : <span>-</span>}
            </div>
          );
        },
      },
      {
        id: 'amount',
        header: '금액',
        accessorKey: 'amount',
        cell: ({ getValue }) => (
          <div className="font-medium text-center">{(getValue() as number).toLocaleString()}원</div>
        ),
      },
      {
        id: 'createdAt',
        header: '신청 시각',
        accessorKey: 'createdAt',
        cell: ({ getValue }) => {
          const createdAt = getValue() as string | null;
          return (
            <div className="text-gray-600 text-sm text-center">
              {createdAt ? formatDate(createdAt) : "-"}
            </div>
          );
        },
      },
      {
        id: 'status',
        header: '입금 현황',
        accessorKey: 'status',
        cell: ({ getValue }) => (
          <div className="text-center">
            <StatusBadge status={getValue() as UserRetreatRegistrationPaymentStatus} />
          </div>
        ),
      },
      {
        id: 'actions',
        header: '액션',
        cell: ({ row }) => (
          <div className="text-center">{getActionButtons(row.original)}</div>
        ),
      },
      {
        id: 'confirmedBy',
        header: '처리자명',
        accessorKey: 'confirmedBy',
        cell: ({ getValue }) => <div className="text-center">{getValue() as string || "-"}</div>,
      },
      {
        id: 'paymentConfirmedAt',
        header: '처리 시각',
        accessorKey: 'paymentConfirmedAt',
        cell: ({ getValue }) => {
          const paymentConfirmedAt = getValue() as string | null;
          return (
            <div className="text-gray-600 text-sm text-center">
              {paymentConfirmedAt ? formatDate(paymentConfirmedAt) : "-"}
            </div>
          );
        },
      },
    ];

    return [...baseColumns, ...dynamicScheduleColumns, ...endColumns];
  }, [scheduleColumns]);

  // TanStack Table 인스턴스
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnPinning: {
        left: ['name'], // 이름 컬럼을 왼쪽에 고정
      },
    },
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div className="whitespace-nowrap">
          <CardTitle>신청 현황 및 입금 조회</CardTitle>
          <CardDescription>전체 신청자 목록</CardDescription>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setLoadingStates(prev => ({ ...prev, exportExcel: true }));
              try {
                const response = await webAxios.get(
                  `/api/v1/retreat/${retreatSlug}/registration/download-univ-group-registration-excel`,
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

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-y-auto max-h-[80vh]">
              <table
                className="w-auto relative text-sm caption-bottom"
                style={{ borderCollapse: 'separate', borderSpacing: 0 }}
              >
                <thead className="sticky top-0 z-20">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className="h-12 px-4 bg-gray-50 text-center align-middle font-medium text-muted-foreground"
                          style={{
                            ...getCommonPinningStyles(header.column, true),
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isPinned = cell.column.getIsPinned();
                        return (
                          <td
                            key={cell.id}
                            className={`p-4 align-middle ${isPinned ? 'bg-white' : 'bg-white'}`}
                            style={{
                              ...getCommonPinningStyles(cell.column, false),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
