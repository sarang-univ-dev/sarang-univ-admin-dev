"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"

interface SummaryTableColumn {
  id: string
  header: React.ReactNode
}

interface SummaryTableRow {
  id: string
  label: string
  cells: Record<string, React.ReactNode>
}

interface SummaryTableProps {
  title: string
  description?: string
  columns: SummaryTableColumn[]
  rows: SummaryTableRow[]
  downloadable?: boolean
}

export function SummaryTable({ title, description, columns, rows, downloadable = true }: SummaryTableProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadImage = async () => {
    if (!tableRef.current) return

    try {
      setIsDownloading(true)
      const element = tableRef.current
      const canvas = await html2canvas(element)
      const data = canvas.toDataURL("image/png")

      const link = document.createElement("a")
      link.href = data
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading image:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {downloadable && (
          <Button variant="outline" size="sm" onClick={handleDownloadImage} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-2" />
            이미지 저장
          </Button>
        )}
      </CardHeader>
      <CardContent ref={tableRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sticky left-0 bg-gray-100 z-10 font-semibold text-gray-800"></TableHead>
                {columns.map((column) => (
                  <TableHead key={column.id} className="bg-gray-100 font-semibold text-gray-800">
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium sticky left-0 bg-gray-50 z-10 border-r">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">
                      {row.label}
                    </span>
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={`${row.id}-${column.id}`}>{row.cells[column.id] || "-"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
