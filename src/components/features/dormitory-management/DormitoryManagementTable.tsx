"use client";

import { useMemo, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Upload } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VirtualizedTable } from "@/components/common/table";
import { useDormitoryManagement } from "@/hooks/dormitory/use-dormitory-management";
import { useDormitoryManagementColumns } from "@/hooks/dormitory/use-dormitory-management-columns";
import { DormitoryExcelImportModal } from "@/components/features/dormitory/DormitoryExcelImportModal";
import {
  downloadDormitoriesAsTemplate,
  DormitoryTemplateRow,
} from "@/utils/dormitory-excel/template";
import { Gender, TDormitoryManagementRow } from "@/types";

function toTemplateRow(dormitory: TDormitoryManagementRow): DormitoryTemplateRow {
  return {
    gender: dormitory.gender,
    name: dormitory.name,
    optimalCapacity: dormitory.optimalCapacity,
    maxCapacity: dormitory.maxCapacity ?? null,
    memo: dormitory.memo ?? null,
  };
}

function DormitoryGenderTable({
  rows,
  columns,
  globalFilter,
  onGlobalFilterChange,
}: {
  rows: TDormitoryManagementRow[];
  columns: ReturnType<typeof useDormitoryManagementColumns>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}) {
  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const term = String(filterValue).toLowerCase();
      const fields = [row.original.name, row.original.memo ?? ""];
      return fields.some(field => field.toLowerCase().includes(term));
    },
  });

  return (
    <VirtualizedTable
      table={table}
      estimateSize={52}
      className="max-h-[70vh]"
      emptyMessage={globalFilter ? "검색 결과가 없습니다." : "숙소가 없습니다."}
      getRowClassName={row =>
        row.isDisabled ? "bg-gray-50 text-muted-foreground" : ""
      }
    />
  );
}

export function DormitoryManagementTable({
  retreatSlug,
}: {
  retreatSlug: string;
}) {
  const { dormitories, mutate, updateDormitory, toggleDisabled, deleteDormitory } =
    useDormitoryManagement(retreatSlug);

  const columns = useDormitoryManagementColumns({
    updateDormitory,
    toggleDisabled,
    deleteDormitory,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const maleRows = useMemo(
    () => dormitories.filter(dormitory => dormitory.gender === Gender.MALE),
    [dormitories]
  );
  const femaleRows = useMemo(
    () => dormitories.filter(dormitory => dormitory.gender === Gender.FEMALE),
    [dormitories]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="숙소명 / 메모 검색"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              downloadDormitoriesAsTemplate(dormitories.map(toTemplateRow))
            }
          >
            <Download className="mr-1.5 h-4 w-4" />
            엑셀 내보내기
          </Button>
          <Button type="button" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            엑셀 가져오기
          </Button>
        </div>
      </div>

      <Tabs defaultValue="male" className="w-full">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="male" className="px-8">
            형제 ({maleRows.length})
          </TabsTrigger>
          <TabsTrigger value="female" className="px-8">
            자매 ({femaleRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="male" className="mt-4">
          <DormitoryGenderTable
            rows={maleRows}
            columns={columns}
            globalFilter={searchTerm}
            onGlobalFilterChange={setSearchTerm}
          />
        </TabsContent>

        <TabsContent value="female" className="mt-4">
          <DormitoryGenderTable
            rows={femaleRows}
            columns={columns}
            globalFilter={searchTerm}
            onGlobalFilterChange={setSearchTerm}
          />
        </TabsContent>
      </Tabs>

      <DormitoryExcelImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        retreatSlug={retreatSlug}
        onImported={() => {
          void mutate();
        }}
      />
    </div>
  );
}
