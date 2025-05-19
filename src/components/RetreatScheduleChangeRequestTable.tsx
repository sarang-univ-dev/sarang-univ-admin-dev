"use client";

import { useState, useEffect, useRef } from "react";
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
import { Download, Search, ArrowUpDown, X, PenLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import {
  generateScheduleColumns,
  transformRegistrationsForTable,
} from "../utils/retreat-utils";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";
import { formatDate } from "@/utils/formatDate";
import { IUserScheduleChangeRetreat } from "@/hooks/user-schedule-change-retreat-request";

const transformScheduleChangeRequestForTable = (
  requests: IUserScheduleChangeRetreat[],
  schedules: TRetreatRegistrationSchedule[]
) => {
  return requests.map(req => ({
    id: req.userRetreatRegistrationId.toString(),
    department: `${req.univGroupNumber}부`,
    grade: `${req.gradeNumber}학년`,
    name: req.userName,
    schedule: schedules.reduce(
      (acc, cur) => {
        acc[cur.id.toString()] = (
          req.userRetreatRegistrationScheduleIds || []
        ).includes(cur.id);
        return acc;
      },
      {} as Record<string, boolean>
    ),
    type: req.userType,
    amount: req.price,
    createdAt: req.createdAt,
    status: req.paymentStatus,
    confirmedBy: req.issuerName,
    paymentConfirmedAt: req.paymentConfirmedAt,
    memo: req.memo,
    memoCreatedAt: req.memoCreatedAt,
  }));
};

export function RetreatScheduleChangeRequestTable({
  registrations = [],
  schedules = [],
}: {
  registrations: IUserScheduleChangeRetreat[];
  schedules: TRetreatRegistrationSchedule[];
}) {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (registrations.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformScheduleChangeRequestForTable(
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

  useEffect(() => {
    let dataToFilter = [...data];

    if (searchTerm) {
      dataToFilter = dataToFilter.filter(row =>
        [
          row.name,
          row.department,
          row.grade?.toString(),
          row.type?.toString(),
          row.confirmedBy?.toString(),
          row.memo?.toString(),
        ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (sortConfig !== null) {
      dataToFilter.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (
          sortConfig.key === "amount" ||
          sortConfig.key === "grade" ||
          sortConfig.key === "department"
        ) {
          valA = parseFloat(valA?.replace(/[^\d.-]/g, "")) || 0;
          valB = parseFloat(valB?.replace(/[^\d.-]/g, "")) || 0;
        } else if (typeof valA === "string") {
          valA = valA.toLowerCase();
        }
        if (typeof valB === "string") {
          valB = valB.toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    setFilteredData(dataToFilter);
  }, [data, searchTerm, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    }
    return sortConfig.direction === "ascending" ? "🔼" : "🔽";
  };

  const handleProcessSchedule = (row: any) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  const handleConfirmScheduleChange = () => {
    // 여기에 실제 API 호출 로직 구현
    console.log("일정 변경 확인:", selectedRow);

    // 성공 후 모달 닫기
    handleCloseModal();
  };

  const scheduleColumns = generateScheduleColumns(schedules);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div className="whitespace-nowrap">
          <CardTitle>일정 변경 요청 조회</CardTitle>
          <CardDescription>일정 변경 요청 목록</CardDescription>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("엑셀로 내보지기 함수가 구현되어야합니다.")}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>엑셀로 내보내기</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="검색 (이름, 부서, 학년, 타입, 처리자 등)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            className="rounded-md border h-[calc(100vh-300px)]"
            ref={tableContainerRef}
          >
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="w-full whitespace-nowrap relative">
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>부서</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("department")}
                        >
                          {getSortIndicator("department")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>학년</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("grade")}
                        >
                          {getSortIndicator("grade")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>이름</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("name")}
                        >
                          {getSortIndicator("name")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      colSpan={scheduleColumns.length}
                      className="whitespace-nowrap"
                    >
                      <div className="text-center">수양회 신청 일정</div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>타입</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("type")}
                        >
                          {getSortIndicator("type")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>금액</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("amount")}
                        >
                          {getSortIndicator("amount")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>신청 시각</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("createdAt")}
                        >
                          {getSortIndicator("createdAt")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>입금 현황</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("status")}
                        >
                          {getSortIndicator("status")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <span>액션</span>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>처리자명</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("confirmedBy")}
                        >
                          {getSortIndicator("confirmedBy")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>처리 시각</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("paymentConfirmedAt")}
                        >
                          {getSortIndicator("paymentConfirmedAt")}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1 justify-center">
                        <span>메모</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => requestSort("memo")}
                        >
                          {getSortIndicator("memo")}
                        </Button>
                      </div>
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    {scheduleColumns.map(scheduleCol => (
                      <TableHead
                        key={scheduleCol.key}
                        className="p-2 text-center whitespace-nowrap"
                      >
                        <span className="text-xs">{scheduleCol.label}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12 + scheduleColumns.length}
                        className="text-center py-8 text-gray-500"
                      >
                        데이터가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map(row => (
                      <TableRow key={row.id} className="group">
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.department}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.grade}
                        </TableCell>
                        <TableCell className="font-medium group-hover:bg-gray-50 text-center whitespace-nowrap">
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
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          <TypeBadge type={row.type} />
                        </TableCell>
                        <TableCell className="font-medium group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.amount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.createdAt ? formatDate(row.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessSchedule(row)}
                            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            <span>일정 처리</span>
                          </Button>
                        </TableCell>
                        <TableCell className="group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {row.confirmedBy || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm group-hover:bg-gray-50 text-center whitespace-nowrap">
                          {formatDate(row.paymentConfirmedAt)}
                        </TableCell>
                        <TableCell
                          className="group-hover:bg-gray-50 text-center whitespace-nowrap max-w-[150px] truncate"
                          title={row.memo}
                        >
                          {row.memo || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>

      {isModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all duration-300 ease-out scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">일정 변경 처리</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-4">
              <p className="mb-2">
                <span className="font-medium">참가자:</span> {selectedRow.name}
              </p>
              <p className="mb-2">
                <span className="font-medium">부서:</span>{" "}
                {selectedRow.department}
              </p>
              <p className="mb-2">
                <span className="font-medium">학년:</span> {selectedRow.grade}
              </p>
              <div className="mt-4">
                <h4 className="font-medium mb-2">신청 일정:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {scheduleColumns.map(col => (
                    <div key={col.key} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedRow.schedule[col.key]}
                        disabled
                        className={
                          selectedRow.schedule[col.key] ? col.bgColorClass : ""
                        }
                      />
                      <span className="text-sm">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                취소
              </Button>
              <Button onClick={handleConfirmScheduleChange}>
                일정 변경 확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
