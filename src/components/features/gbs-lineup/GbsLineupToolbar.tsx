"use client";

import { useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { GbsCreateModal } from "./GbsCreateModal";
import { GbsLineupTableData } from "@/types/gbs-lineup";

interface GbsLineupToolbarProps {
  table: Table<GbsLineupTableData>;
  retreatSlug: string;
}

export function GbsLineupToolbar({
  table,
  retreatSlug,
}: GbsLineupToolbarProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const globalFilter = table.getState().globalFilter ?? "";

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="GBS번호, 리더, 메모 검색..."
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          GBS 생성
        </Button>
      </div>

      <GbsCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        retreatSlug={retreatSlug}
      />
    </>
  );
}
