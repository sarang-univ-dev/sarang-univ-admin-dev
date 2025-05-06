"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"

interface MealData {
  department: string
  counts: {
    [key: string]: number
  }
}

export function MealSummaryCalendar() {
  const [activeView, setActiveView] = useState<"all" | "department">("all")
  const [activeDepartment, setActiveDepartment] = useState("1")
  const tableRef = React.useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Sample data
  const mealData: MealData[] = [
    {
      department: "1부",
      counts: {
        wed_breakfast: 45,
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
        wed_breakfast: 38,
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
        wed_breakfast: 42,
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
        wed_breakfast: 35,
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
        wed_breakfast: 37,
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
        wed_breakfast: 30,
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
        wed_breakfast: 36,
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
        wed_breakfast: 25,
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

  // Calculate totals
  const totals = {
    wed_breakfast: mealData.reduce((sum, dept) => sum + dept.counts.wed_breakfast, 0),
    wed_lunch: mealData.reduce((sum, dept) => sum + dept.counts.wed_lunch, 0),
    wed_dinner: mealData.reduce((sum, dept) => sum + dept.counts.wed_dinner, 0),
    wed_accommodation: mealData.reduce((sum, dept) => sum + dept.counts.wed_accommodation, 0),
    thu_breakfast: mealData.reduce((sum, dept) => sum + dept.counts.thu_breakfast, 0),
    thu_lunch: mealData.reduce((sum, dept) => sum + dept.counts.thu_lunch, 0),
    thu_dinner: mealData.reduce((sum, dept) => sum + dept.counts.thu_dinner, 0),
    thu_accommodation: mealData.reduce((sum, dept) => sum + dept.counts.thu_accommodation, 0),
    fri_breakfast: mealData.reduce((sum, dept) => sum + dept.counts.fri_breakfast, 0),
    fri_lunch: mealData.reduce((sum, dept) => sum + dept.counts.fri_lunch, 0),
    fri_dinner: mealData.reduce((sum, dept) => sum + dept.counts.fri_dinner, 0),
    fri_accommodation: mealData.reduce((sum, dept) => sum + dept.counts.fri_accommodation, 0),
    sat_breakfast: mealData.reduce((sum, dept) => sum + dept.counts.sat_breakfast, 0),
    sat_lunch: mealData.reduce((sum, dept) => sum + dept.counts.sat_lunch, 0),
  }

  const handleDownloadImage = async () => {
    if (!tableRef.current) return

    try {
      setIsDownloading(true)
      const element = tableRef.current
      const canvas = await html2canvas(element)
      const data = canvas.toDataURL("image/png")

      const link = document.createElement("a")
      link.href = data
      link.download = `식수인원집계표_${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading image:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Component for rendering department label with consistent styling
  const DepartmentLabel = ({ department }: { department: string }) => (
    <span className="text-sm font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{department}</span>
  )

  // Component for rendering count value with consistent styling
  const CountValue = ({ count }: { count: number }) => <span className="text-sm font-semibold">{count}명</span>

  // Component for rendering meal section header with consistent styling
  const MealHeader = ({ title }: { title: string }) => (
    <div className="text-sm font-medium text-gray-700 mb-2 pb-1 border-b border-gray-100">{title}</div>
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div>
          <CardTitle className="text-lg">식사 숙박 인원 집계 표</CardTitle>
          <CardDescription>수양회 식사 및 숙박 인원 현황</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "all" | "department")}>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="all" className="font-medium">
                전체 보기
              </TabsTrigger>
              <TabsTrigger value="department" className="font-medium">
                부서별 보기
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>이미지 저장</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4" ref={tableRef}>
        {activeView === "all" ? (
          <div className="space-y-6">
            {/* Calendar View for All Departments */}
            <div className="grid grid-cols-1 gap-4">
              {/* Wednesday */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">수요일</div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y">
                  <div className="p-4">
                    <MealHeader title="아침 (수점)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div
                          key={`wed_breakfast_${dept.department}`}
                          className="flex justify-between items-center py-1"
                        >
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.wed_breakfast} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.wed_breakfast}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <MealHeader title="점심 (수저)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div key={`wed_lunch_${dept.department}`} className="flex justify-between items-center py-1">
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.wed_lunch} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.wed_lunch}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <MealHeader title="저녁 (수숙)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div key={`wed_dinner_${dept.department}`} className="flex justify-between items-center py-1">
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.wed_dinner} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.wed_dinner}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <MealHeader title="숙박" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div
                          key={`wed_accommodation_${dept.department}`}
                          className="flex justify-between items-center py-1"
                        >
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.wed_accommodation} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.wed_accommodation}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thursday */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">목요일</div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y">
                  <div className="p-4">
                    <MealHeader title="아침 (목아)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div
                          key={`thu_breakfast_${dept.department}`}
                          className="flex justify-between items-center py-1"
                        >
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.thu_breakfast} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.thu_breakfast}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <MealHeader title="점심 (목점)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div key={`thu_lunch_${dept.department}`} className="flex justify-between items-center py-1">
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.thu_lunch} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.thu_lunch}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <MealHeader title="저녁 (목저)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div key={`thu_dinner_${dept.department}`} className="flex justify-between items-center py-1">
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.thu_dinner} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.thu_dinner}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <MealHeader title="숙박" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div
                          key={`thu_accommodation_${dept.department}`}
                          className="flex justify-between items-center py-1"
                        >
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.thu_accommodation} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.thu_accommodation}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Friday */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">금요일</div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y">
                  <div className="p-4">
                    <MealHeader title="아침 (금아)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div
                          key={`fri_breakfast_${dept.department}`}
                          className="flex justify-between items-center py-1"
                        >
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.fri_breakfast} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.fri_breakfast}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <MealHeader title="점심 (금점)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div key={`fri_lunch_${dept.department}`} className="flex justify-between items-center py-1">
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.fri_lunch} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.fri_lunch}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <MealHeader title="저녁 (금저)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div key={`fri_dinner_${dept.department}`} className="flex justify-between items-center py-1">
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.fri_dinner} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.fri_dinner}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <MealHeader title="숙박" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div
                          key={`fri_accommodation_${dept.department}`}
                          className="flex justify-between items-center py-1"
                        >
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.fri_accommodation} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.fri_accommodation}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saturday */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">토요일</div>
                <div className="grid grid-cols-2 divide-x">
                  <div className="p-4">
                    <MealHeader title="아침 (토아)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div
                          key={`sat_breakfast_${dept.department}`}
                          className="flex justify-between items-center py-1"
                        >
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.sat_breakfast} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.sat_breakfast}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <MealHeader title="점심 (토점)" />
                    <div className="grid grid-cols-2 gap-2">
                      {mealData.map((dept) => (
                        <div key={`sat_lunch_${dept.department}`} className="flex justify-between items-center py-1">
                          <DepartmentLabel department={dept.department} />
                          <CountValue count={dept.counts.sat_lunch} />
                        </div>
                      ))}
                      <div className="col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">합계</span>
                        <span className="text-base font-bold text-black">{totals.sat_lunch}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Department Selection */}
            <div className="flex justify-center mb-4">
              <Tabs value={activeDepartment} onValueChange={setActiveDepartment}>
                <TabsList className="grid grid-cols-8 w-full">
                  <TabsTrigger value="1" className="font-medium">
                    1부
                  </TabsTrigger>
                  <TabsTrigger value="2" className="font-medium">
                    2부
                  </TabsTrigger>
                  <TabsTrigger value="3" className="font-medium">
                    3부
                  </TabsTrigger>
                  <TabsTrigger value="4" className="font-medium">
                    4부
                  </TabsTrigger>
                  <TabsTrigger value="5" className="font-medium">
                    5부
                  </TabsTrigger>
                  <TabsTrigger value="6" className="font-medium">
                    6부
                  </TabsTrigger>
                  <TabsTrigger value="7" className="font-medium">
                    7부
                  </TabsTrigger>
                  <TabsTrigger value="8" className="font-medium">
                    8부
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Department View */}
            {mealData.map((dept, index) => {
              if (Number(activeDepartment) !== index + 1) return null
              return (
                <div key={dept.department} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Wednesday */}
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">수요일</div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">아침 (수점)</span>
                          <span className="font-semibold text-black">{dept.counts.wed_breakfast}명</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">점심 (수저)</span>
                          <span className="font-semibold text-black">{dept.counts.wed_lunch}명</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">저녁 (수숙)</span>
                          <span className="font-semibold text-black">{dept.counts.wed_dinner}명</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium text-gray-700">숙박</span>
                          <span className="font-semibold text-black">{dept.counts.wed_accommodation}명</span>
                        </div>
                      </div>
                    </div>

                    {/* Thursday */}
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">목요일</div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">아침 (목아)</span>
                          <span className="font-semibold text-black">{dept.counts.thu_breakfast}명</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">점심 (목점)</span>
                          <span className="font-semibold text-black">{dept.counts.thu_lunch}명</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">저녁 (목저)</span>
                          <span className="font-semibold text-black">{dept.counts.thu_dinner}명</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium text-gray-700">숙박</span>
                          <span className="font-semibold text-black">{dept.counts.thu_accommodation}명</span>
                        </div>
                      </div>
                    </div>

                    {/* Friday */}
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">금요일</div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">아침 (금아)</span>
                          <span className="font-semibold text-black">{dept.counts.fri_breakfast}명</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">점심 (금점)</span>
                          <span className="font-semibold text-black">{dept.counts.fri_lunch}명</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">저녁 (금저)</span>
                          <span className="font-semibold text-black">{dept.counts.fri_dinner}명</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium text-gray-700">숙박</span>
                          <span className="font-semibold text-black">{dept.counts.fri_accommodation}명</span>
                        </div>
                      </div>
                    </div>

                    {/* Saturday */}
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">토요일</div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">아침 (토아)</span>
                          <span className="font-semibold text-black">{dept.counts.sat_breakfast}명</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">점심 (토점)</span>
                          <span className="font-semibold text-black">{dept.counts.sat_lunch}명</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary for this department */}
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-800 border-b">전체 요약</div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-sm font-medium text-gray-600">총 식사 인원</div>
                          <div className="text-xl font-bold mt-1 text-black">
                            {Object.entries(dept.counts)
                              .filter(([key]) => !key.includes("accommodation"))
                              .reduce((sum, [_, value]) => sum + value, 0)}
                            명
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-sm font-medium text-gray-600">총 숙박 인원</div>
                          <div className="text-xl font-bold mt-1 text-black">
                            {Object.entries(dept.counts)
                              .filter(([key]) => key.includes("accommodation"))
                              .reduce((sum, [_, value]) => sum + value, 0)}
                            명
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
