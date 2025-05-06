"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SearchBar, type FilterOption } from "./search-bar"
import { Check, Download, CheckCircle2, RotateCcw, Clock, CheckCheck, RefreshCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import * as XLSX from "xlsx"

// 부서별 Mock 데이터 생성
const generateMockDataForDepartment = (department: number) => {
  // 각 부서별로 다른 데이터 생성
  const baseData = [
    {
      id: 1,
      department: `${department}부`,
      gender: "남",
      grade: "8",
      name: `박희서_${department}`,
      schedule: [true, true, true, true, true],
      type: "",
      amount: 55000,
      status: "waiting",
      paymentConfirmedAt: null,
      confirmedBy: null,
    },
    {
      id: 2,
      department: `${department}부`,
      gender: "여",
      grade: "7",
      name: `김민지_${department}`,
      schedule: [true, true, true, true, true],
      type: "",
      amount: 55000,
      status: "confirmed",
      paymentConfirmedAt: "2023-05-21T20:21:00",
      confirmedBy: "김재정",
    },
    {
      id: 3,
      department: `${department}부`,
      gender: "남",
      grade: "9",
      name: `이준호_${department}`,
      schedule: [true, true, true, false, false],
      type: "",
      amount: 35000,
      status: "waiting",
      paymentConfirmedAt: null,
      confirmedBy: null,
    },
    {
      id: 4,
      department: `${department}부`,
      gender: "여",
      grade: "8",
      name: `정수아_${department}`,
      schedule: [true, true, true, true, true],
      type: "새가족",
      amount: 27500,
      status: "confirmed",
      paymentConfirmedAt: "2023-05-22T14:30:00",
      confirmedBy: "박회계",
    },
  ]

  // 부서별로 추가 데이터 생성
  if (department % 2 === 0) {
    // 짝수 부서에는 환불 케이스 추가
    baseData.push({
      id: 5,
      department: `${department}부`,
      gender: "남",
      grade: "7",
      name: `최동현_${department}`,
      schedule: [true, true, true, true, true],
      type: "",
      amount: 55000,
      status: "refund_requested",
      paymentConfirmedAt: "2023-05-21T20:21:00",
      confirmedBy: "김재정",
    })
  } else {
    // 홀수 부서에는 군지체 케이스 추가
    baseData.push({
      id: 5,
      department: `${department}부`,
      gender: "남",
      grade: "9",
      name: `강민수_${department}`,
      schedule: [true, true, true, true, true],
      type: "군지체",
      amount: 27500,
      status: "confirmed",
      paymentConfirmedAt: "2023-05-23T09:15:00",
      confirmedBy: "이간사",
    })
  }

  // 모든 부서에 환불 완료 케이스 추가
  baseData.push({
    id: 6,
    department: `${department}부`,
    gender: "여",
    grade: "8",
    name: `한지은_${department}`,
    schedule: [true, true, true, true, true],
    type: "",
    amount: 55000,
    status: "refund_completed",
    paymentConfirmedAt: "2023-05-24T11:45:00",
    confirmedBy: "박회계",
  })

  return baseData
}

export function RegistrationTable({ department }: { department: number }) {
  const [data, setData] = useState<any[]>([])
  const [filters, setFilters] = useState({})

  // 부서가 변경될 때마다 데이터 업데이트
  useEffect(() => {
    setData(generateMockDataForDepartment(department))
  }, [department])

  // 검색 필터 옵션 정의
  const filterOptions: FilterOption[] = [
    {
      id: "name",
      label: "이름",
      type: "input",
      placeholder: "이름 검색...",
    },
    {
      id: "grade",
      label: "학년",
      type: "select",
      options: [
        { value: "7", label: "7학년" },
        { value: "8", label: "8학년" },
        { value: "9", label: "9학년" },
        { value: "10", label: "10학년" },
        { value: "11", label: "11학년" },
        { value: "12", label: "12학년" },
      ],
    },
    {
      id: "gender",
      label: "성별",
      type: "select",
      options: [
        { value: "male", label: "남" },
        { value: "female", label: "여" },
      ],
    },
    {
      id: "status",
      label: "입금 상태",
      type: "select",
      options: [
        { value: "waiting", label: "입금 확인 대기" },
        { value: "confirmed", label: "입금 확인 완료" },
        { value: "refund_requested", label: "환불 처리 대기" },
        { value: "refund_completed", label: "환불 처리 완료" },
      ],
    },
    {
      id: "type",
      label: "타입",
      type: "select",
      options: [
        { value: "normal", label: "일반" },
        { value: "new_family", label: "새가족" },
        { value: "military", label: "군지체" },
      ],
    },
    {
      id: "date",
      label: "신청일",
      type: "date",
    },
  ]

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters)
    // In a real app, you would filter the data based on the filters
    console.log("Applied filters:", newFilters)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return `${date.getMonth() + 1}월 ${date.getDate()}일 오후 ${date.getHours()}시 ${date.getMinutes()}분`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
            <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5" />
            <span className="text-xs font-medium text-yellow-700">입금 확인 대기</span>
          </div>
        )
      case "confirmed":
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
            <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5" />
            <span className="text-xs font-medium text-green-700">입금 확인 완료</span>
          </div>
        )
      case "refund_requested":
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
            <RefreshCcw className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
            <span className="text-xs font-medium text-blue-700">환불 처리 대기</span>
          </div>
        )
      case "refund_completed":
        return (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
            <RotateCcw className="h-3.5 w-3.5 text-purple-500 mr-1.5" />
            <span className="text-xs font-medium text-purple-700">환불 처리 완료</span>
          </div>
        )
      default:
        return null
    }
  }

  const handleConfirmPayment = (id: number) => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            status: "confirmed",
            paymentConfirmedAt: new Date().toISOString(),
            confirmedBy: "현재 사용자", // 실제 앱에서는 로그인한 사용자 정보를 사용
          }
        }
        return row
      }),
    )
  }

  const handleCompleteRefund = (id: number) => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            status: "refund_completed",
            paymentConfirmedAt: new Date().toISOString(),
            confirmedBy: "현재 사용자", // 실제 앱에서는 로그인한 사용자 정보를 사용
          }
        }
        return row
      }),
    )
  }

  const getActionButton = (row: any) => {
    switch (row.status) {
      case "waiting":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConfirmPayment(row.id)}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>입금 확인</span>
          </Button>
        )
      case "refund_requested":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCompleteRefund(row.id)}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>환불 처리</span>
          </Button>
        )
      default:
        return null
    }
  }

  const exportToExcel = () => {
    // 엑셀로 변환할 데이터 준비
    const exportData = data.map((row) => ({
      부서: row.department,
      성별: row.gender,
      학년: row.grade,
      이름: row.name,
      일정: row.schedule.map((day: boolean) => (day ? "O" : "X")).join(" "),
      타입: row.type || "-",
      금액: `${row.amount.toLocaleString()}원`,
      입금현황:
        row.status === "waiting"
          ? "입금 확인 대기"
          : row.status === "confirmed"
            ? "입금 확인 완료"
            : row.status === "refund_requested"
              ? "환불 처리 대기"
              : "환불 처리 완료",
      입금확인자명: row.confirmedBy || "-",
      입금확인일시: row.paymentConfirmedAt ? formatDate(row.paymentConfirmedAt) : "-",
    }))

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(exportData)

    // 워크북 생성 및 워크시트 추가
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "신청현황및입금조회")

    // 엑셀 파일 다운로드
    XLSX.writeFile(wb, `신청현황및입금조회_${department}부_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div>
          <CardTitle>신청 현황 및 입금 조회</CardTitle>
          <CardDescription>{department}부 신청자 목록</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToExcel}
          className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>엑셀로 내보내기</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <SearchBar onSearch={handleSearch} filterOptions={filterOptions} />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>부서</TableHead>
                  <TableHead>성별</TableHead>
                  <TableHead>학년</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>수양회 신청 일정</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>입금 현황</TableHead>
                  <TableHead>액션</TableHead>
                  <TableHead>입금 확인자명</TableHead>
                  <TableHead>입금 확인 일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.gender}</TableCell>
                    <TableCell>{row.grade}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {row.schedule.map((day: boolean, i: number) =>
                          day ? <Check key={i} className="h-4 w-4 text-green-600" /> : null,
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{row.type || "-"}</TableCell>
                    <TableCell className="font-medium">{row.amount.toLocaleString()}원</TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                    <TableCell>{getActionButton(row)}</TableCell>
                    <TableCell>{row.confirmedBy || "-"}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{formatDate(row.paymentConfirmedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
