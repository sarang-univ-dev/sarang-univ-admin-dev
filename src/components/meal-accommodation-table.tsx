"use client"

import { useState, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"

interface MealData {
  department: string
  counts: {
    [key: string]: number
  }
}

export function MealAccommodationTable() {
  const tableRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Sample data
  const mealData: MealData[] = [
    {
      department: "1부",
      counts: {
        wed_lunch: 52,
        wed_dinner: 50,
        wed_accommodation: 48,
        thu_breakfast: 48,
        thu_lunch: 47,
        thu_dinner: 46,
        thu_accommodation: 45,
        fri_breakfast: 44,
        fri_lunch: 48,
        fri_dinner: 47,
        fri_accommodation: 44,
        sat_breakfast: 42,
        sat_lunch: 40,
      },
    },
    {
      department: "2부",
      counts: {
        wed_lunch: 42,
        wed_dinner: 40,
        wed_accommodation: 39,
        thu_breakfast: 39,
        thu_lunch: 41,
        thu_dinner: 38,
        thu_accommodation: 38,
        fri_breakfast: 37,
        fri_lunch: 40,
        fri_dinner: 39,
        fri_accommodation: 36,
        sat_breakfast: 35,
        sat_lunch: 33,
      },
    },
    {
      department: "3부",
      counts: {
        wed_lunch: 45,
        wed_dinner: 44,
        wed_accommodation: 43,
        thu_breakfast: 43,
        thu_lunch: 42,
        thu_dinner: 41,
        thu_accommodation: 40,
        fri_breakfast: 40,
        fri_lunch: 43,
        fri_dinner: 42,
        fri_accommodation: 39,
        sat_breakfast: 38,
        sat_lunch: 36,
      },
    },
    {
      department: "4부",
      counts: {
        wed_lunch: 38,
        wed_dinner: 37,
        wed_accommodation: 36,
        thu_breakfast: 36,
        thu_lunch: 35,
        thu_dinner: 34,
        thu_accommodation: 33,
        fri_breakfast: 33,
        fri_lunch: 36,
        fri_dinner: 35,
        fri_accommodation: 32,
        sat_breakfast: 31,
        sat_lunch: 29,
      },
    },
    {
      department: "5부",
      counts: {
        wed_lunch: 40,
        wed_dinner: 39,
        wed_accommodation: 38,
        thu_breakfast: 38,
        thu_lunch: 37,
        thu_dinner: 36,
        thu_accommodation: 35,
        fri_breakfast: 35,
        fri_lunch: 38,
        fri_dinner: 37,
        fri_accommodation: 34,
        sat_breakfast: 33,
        sat_lunch: 31,
      },
    },
    {
      department: "6부",
      counts: {
        wed_lunch: 33,
        wed_dinner: 32,
        wed_accommodation: 31,
        thu_breakfast: 31,
        thu_lunch: 30,
        thu_dinner: 29,
        thu_accommodation: 28,
        fri_breakfast: 28,
        fri_lunch: 31,
        fri_dinner: 30,
        fri_accommodation: 27,
        sat_breakfast: 26,
        sat_lunch: 24,
      },
    },
    {
      department: "7부",
      counts: {
        wed_lunch: 39,
        wed_dinner: 38,
        wed_accommodation: 37,
        thu_breakfast: 37,
        thu_lunch: 36,
        thu_dinner: 35,
        thu_accommodation: 34,
        fri_breakfast: 34,
        fri_lunch: 37,
        fri_dinner: 36,
        fri_accommodation: 33,
        sat_breakfast: 32,
        sat_lunch: 30,
      },
    },
    {
      department: "8부",
      counts: {
        wed_lunch: 28,
        wed_dinner: 27,
        wed_accommodation: 26,
        thu_breakfast: 26,
        thu_lunch: 25,
        thu_dinner: 24,
        thu_accommodation: 23,
        fri_breakfast: 23,
        fri_lunch: 26,
        fri_dinner: 25,
        fri_accommodation: 22,
        sat_breakfast: 21,
        sat_lunch: 19,
      },
    },
  ]

  // Define column structure - removed wed_breakfast
  const columns = [
    { id: "wed_lunch", label: "점심", group: "수요일" },
    { id: "wed_dinner", label: "저녁", group: "수요일" },
    { id: "wed_accommodation", label: "숙박", group: "수요일" },
    { id: "thu_breakfast", label: "아침", group: "목요일" },
    { id: "thu_lunch", label: "점심", group: "목요일" },
    { id: "thu_dinner", label: "저녁", group: "목요일" },
    { id: "thu_accommodation", label: "숙박", group: "목요일" },
    { id: "fri_breakfast", label: "아침", group: "금요일" },
    { id: "fri_lunch", label: "점심", group: "금요일" },
    { id: "fri_dinner", label: "저녁", group: "금요일" },
    { id: "fri_accommodation", label: "숙박", group: "금요일" },
    { id: "sat_breakfast", label: "아침", group: "토요일" },
    { id: "sat_lunch", label: "점심", group: "토요일" },
  ]

  // Calculate column totals
  const columnTotals: Record<string, number> = {}
  columns.forEach((column) => {
    columnTotals[column.id] = mealData.reduce((sum, dept) => sum + dept.counts[column.id], 0)
  })

  // Calculate row totals
  const rowTotals = mealData.map((dept) => {
    return {
      department: dept.department,
      total: Object.values(dept.counts).reduce((sum, count) => sum + count, 0),
    }
  })

  // Calculate grand total
  const grandTotal = rowTotals.reduce((sum, row) => sum + row.total, 0)

  const handleDownloadImage = async () => {
    if (!tableRef.current) return

    try {
      setIsDownloading(true)
      const element = tableRef.current
      const canvas = await html2canvas(element)
      const data = canvas.toDataURL("image/png")

      const link = document.createElement("a")
      link.href = data
      link.download = `식사숙박인원집계표_${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading image:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Group columns by day
  const columnGroups = Array.from(new Set(columns.map((col) => col.group)))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>식사 숙박 인원 집계 표</CardTitle>
          <CardDescription>수양회 식사 및 숙박 인원 현황</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadImage} disabled={isDownloading}>
          <Download className="h-4 w-4 mr-2" />
          이미지 저장
        </Button>
      </CardHeader>
      <CardContent ref={tableRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead rowSpan={2} className="sticky left-0 bg-gray-100 z-10 border-r"></TableHead>
                {columnGroups.map((group, index) => (
                  <TableHead
                    key={group}
                    colSpan={columns.filter((col) => col.group === group).length}
                    className={`text-center bg-gray-100 font-semibold text-gray-800 border-b ${
                      index > 0 ? "border-l border-l-gray-300" : ""
                    }`}
                  >
                    {group}
                  </TableHead>
                ))}
                <TableHead rowSpan={2} className="text-center bg-gray-100 font-semibold text-gray-800">
                  합계
                </TableHead>
              </TableRow>
              <TableRow>
                {columns.map((column, index) => {
                  // Check if this is the first column of a day group
                  const isFirstInGroup = index === 0 || columns[index - 1].group !== column.group

                  return (
                    <TableHead
                      key={column.id}
                      className={`text-center bg-gray-100 font-medium text-gray-700 ${
                        isFirstInGroup && index > 0 ? "border-l border-l-gray-300" : ""
                      }`}
                    >
                      {column.label}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {mealData.map((dept) => (
                <TableRow key={dept.department}>
                  <TableCell className="font-medium sticky left-0 bg-gray-50 z-10 border-r">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                      {dept.department}
                    </span>
                  </TableCell>
                  {columns.map((column, index) => {
                    // Check if this is the first column of a day group
                    const isFirstInGroup = index === 0 || columns[index - 1].group !== column.group

                    return (
                      <TableCell
                        key={`${dept.department}-${column.id}`}
                        className={`text-center ${isFirstInGroup && index > 0 ? "border-l border-l-gray-300" : ""}`}
                      >
                        {dept.counts[column.id]}명
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center font-semibold bg-gray-50">
                    {rowTotals.find((row) => row.department === dept.department)?.total}명
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell className="sticky left-0 bg-gray-100 z-10 border-r">합계</TableCell>
                {columns.map((column, index) => {
                  // Check if this is the first column of a day group
                  const isFirstInGroup = index === 0 || columns[index - 1].group !== column.group

                  return (
                    <TableCell
                      key={`total-${column.id}`}
                      className={`text-center ${isFirstInGroup && index > 0 ? "border-l border-l-gray-300" : ""}`}
                    >
                      {columnTotals[column.id]}명
                    </TableCell>
                  )
                })}
                <TableCell className="text-center font-bold bg-gray-100">{grandTotal}명</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
