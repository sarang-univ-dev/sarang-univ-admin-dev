"use client";

import type React from "react";

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
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import html2canvas from "html2canvas";
import { useIsMobile } from "@/hooks/use-media-query";
import { SummaryTableMobileCard } from "./SummaryTableMobileCard";

interface SummaryTableColumn {
  id: string;
  header: React.ReactNode;
}

interface SummaryTableRow {
  id: string;
  label: string;
  cells: Record<string, React.ReactNode>;
}

interface SummaryTableProps {
  title: string;
  description?: string;
  columns: SummaryTableColumn[];
  rows: SummaryTableRow[];
  downloadable?: boolean;
}

export function SummaryTable({
  title,
  description,
  columns,
  rows,
  downloadable = true,
}: SummaryTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();

  const handleDownloadImage = async () => {
    if (!tableRef.current) return;

    try {
      setIsDownloading(true);
      const element = tableRef.current;
      const canvas = await html2canvas(element, {
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        scale: 2, // 해상도를 높이기 위해 스케일 값 증가
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (document, element) => {
          // 클론된 요소에서 모든 고정 위치 요소의 스타일을 조정하여 이미지에 포함되도록 함
          const fixedElements = element.querySelectorAll(".sticky");
          fixedElements.forEach(el => {
            const fixedEl = el as HTMLElement;
            fixedEl.style.position = "relative";
          });
        },
      });

      const data = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = data;
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Unified Header for both Mobile and Desktop */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isMobile && downloadable && (
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
            <SummaryTableMobileCard columns={columns} rows={rows} />
          </div>
        )
      ) : (
        /* Desktop: Table Layout */
        <div ref={tableRef}>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px] md:w-[100px] sticky left-0 bg-gray-100 z-10 font-semibold text-gray-800 text-xs md:text-sm"></TableHead>
                  {columns.map(column => (
                    <TableHead
                      key={column.id}
                      className="bg-gray-100 font-semibold text-gray-800 text-xs md:text-sm px-2 md:px-4"
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium sticky left-0 bg-gray-50 z-10 border-r px-2 md:px-4 py-2 md:py-3">
                      <span className="inline-flex px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md bg-gray-100 text-gray-700 font-medium text-xs md:text-sm whitespace-nowrap shrink-0">
                        {row.label}
                      </span>
                    </TableCell>
                    {columns.map(column => (
                      <TableCell key={`${row.id}-${column.id}`} className="text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                        {row.cells[column.id] || "-"}
                      </TableCell>
                    ))}
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
