"use client";

import { useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown } from "lucide-react";
import html2canvas from "html2canvas";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import { DayGroup, FormattedRow } from "@/types/retreat-schedule";
import { StatusBadge } from "@/components/Badge";
import { useIsMobile } from "@/hooks/use-media-query";
import { RetreatScheduleSummaryMobileAccordion } from "./RetreatScheduleSummaryMobileAccordion";

interface RetreatScheduleSummaryClientProps {
  formattedRows: FormattedRow[];
  dayGroups: DayGroup[];
}

/**
 * 식사 숙박 인원 집계 표 - Client Component
 *
 * @description
 * - UI 인터랙션만 담당 (collapse, download)
 * - 계산은 Server Component에서 완료된 데이터를 받음
 */
export function RetreatScheduleSummaryClient({
  formattedRows,
  dayGroups,
}: RetreatScheduleSummaryClientProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();

  const handleDownloadImage = async () => {
    if (!tableRef.current) return;

    try {
      setIsDownloading(true);
      const element = tableRef.current;
      const canvas = await html2canvas(element);
      const data = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = data;
      link.download = `식사숙박인원집계표_${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // retreat-utils.ts와 동일한 색상 시스템
  const getDayColor = (dayIndex: number) => {
    const colors = [
      "bg-rose-50 border-rose-200",
      "bg-amber-50 border-amber-200",
      "bg-teal-50 border-teal-200",
      "bg-indigo-50 border-indigo-200",
    ];
    return colors[dayIndex % colors.length];
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Unified Header for both Mobile and Desktop */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">
            식사 숙박 인원 집계 표
          </h2>
          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-1">
            수양회 식사 및 숙박 인원 현황 (
            <StatusBadge status={UserRetreatRegistrationPaymentStatus.PAID} />
            기준 집계)
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="text-xs md:text-sm"
            >
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">이미지 저장</span>
            </Button>
          )}
          {isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              aria-label={isOpen ? "접기" : "펼치기"}
            >
              <ChevronDown
                className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isMobile ? (
        /* Mobile: Collapsible Content */
        isOpen && (
          <div className="mt-3">
            <RetreatScheduleSummaryMobileAccordion
              formattedRows={formattedRows}
              dayGroups={dayGroups}
            />
          </div>
        )
      ) : (
        /* Desktop: Table Layout */
        <div ref={tableRef}>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0">
                  <TableHead
                    rowSpan={2}
                    className="sticky left-0 bg-gray-100 z-10 border-r font-semibold text-xs md:text-sm px-2 md:px-4 whitespace-nowrap"
                  >
                    부서
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="text-center bg-gray-100 font-semibold text-gray-800 border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap"
                  >
                    요약
                  </TableHead>
                  {dayGroups.map((group, index) => (
                    <TableHead
                      key={group.dayName}
                      colSpan={group.schedules.length}
                      className={`text-center font-semibold text-gray-800 border-b ${getDayColor(
                        index
                      )} border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap`}
                    >
                      {group.dayName}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow>
                  <TableHead className="text-center font-medium text-gray-700 bg-gray-100 border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap">
                    전참
                  </TableHead>
                  <TableHead className="text-center font-medium text-gray-700 bg-gray-100 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap">
                    부분참
                  </TableHead>
                  <TableHead className="text-center font-medium text-gray-700 bg-gray-100 text-xs md:text-sm px-2 md:px-4 whitespace-nowrap">
                    합계
                  </TableHead>
                  {dayGroups.map((group, groupIndex) =>
                    group.schedules.map((schedule, scheduleIndex) => {
                      const isFirstInGroup = scheduleIndex === 0;
                      return (
                        <TableHead
                          key={schedule.key}
                          className={`text-center font-medium text-gray-700 ${getDayColor(
                            groupIndex
                          )} ${isFirstInGroup ? "border-l border-l-gray-300" : ""} text-xs md:text-sm px-2 md:px-4 whitespace-nowrap`}
                        >
                          {schedule.label}
                        </TableHead>
                      );
                    })
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedRows.map(row => (
                  <TableRow
                    key={row.id}
                    className={
                      row.id === "total" ? "bg-gray-50 font-semibold" : ""
                    }
                  >
                    <TableCell className="font-medium sticky left-0 bg-gray-50 z-10 border-r px-2 md:px-4 py-2 md:py-3">
                      <span
                        className={`inline-flex px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md font-medium text-xs md:text-sm whitespace-nowrap shrink-0 ${
                          row.id === "total"
                            ? "bg-gray-200 text-gray-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {row.label}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-center border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 whitespace-nowrap ${
                        row.id === "total" ? "bg-gray-50" : ""
                      }`}
                    >
                      {row.fullParticipation}
                    </TableCell>
                    <TableCell
                      className={`text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 whitespace-nowrap ${
                        row.id === "total" ? "bg-gray-50" : ""
                      }`}
                    >
                      {row.partialParticipation}
                    </TableCell>
                    <TableCell
                      className={`text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 whitespace-nowrap ${
                        row.id === "total" ? "bg-gray-50" : ""
                      }`}
                    >
                      {row.total}
                    </TableCell>
                    {dayGroups.map((group, groupIndex) =>
                      group.schedules.map((schedule, scheduleIndex) => {
                        const isFirstInGroup = scheduleIndex === 0;
                        return (
                          <TableCell
                            key={`${row.id}-${schedule.key}`}
                            className={`text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 whitespace-nowrap ${
                              isFirstInGroup ? "border-l border-l-gray-300" : ""
                            } ${row.id === "total" ? "bg-gray-50" : ""}`}
                          >
                            {row.cells[schedule.key]}
                          </TableCell>
                        );
                      })
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
