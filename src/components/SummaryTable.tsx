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
import { Download } from "lucide-react";
import html2canvas from "html2canvas";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {downloadable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadImage}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            이미지 저장
          </Button>
        )}
      </div>
      <div ref={tableRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sticky left-0 bg-gray-100 z-10 font-semibold text-gray-800"></TableHead>
                {columns.map(column => (
                  <TableHead
                    key={column.id}
                    className="bg-gray-100 font-semibold text-gray-800"
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium sticky left-0 bg-gray-50 z-10 border-r">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                      {row.label}
                    </span>
                  </TableCell>
                  {columns.map(column => (
                    <TableCell key={`${row.id}-${column.id}`}>
                      {row.cells[column.id] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
