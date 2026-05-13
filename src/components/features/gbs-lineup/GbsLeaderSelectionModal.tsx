"use client";

import { useState, useMemo, useEffect } from "react";
import debounce from "lodash/debounce";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check } from "lucide-react";
import { VirtualizedTable } from "@/components/common/table";
import { GenderBadge } from "@/components/Badge";
import { useGbsLeaderCandidates, useGbsLineupManagement } from "@/hooks/gbs-lineup";
import { GbsLeaderCandidate } from "@/types/gbs-lineup";

const columnHelper = createColumnHelper<GbsLeaderCandidate>();

interface GbsLeaderSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gbsNumber: number | null;
  retreatSlug: string;
}

export function GbsLeaderSelectionModal({
  open,
  onOpenChange,
  gbsNumber,
  retreatSlug,
}: GbsLeaderSelectionModalProps) {
  const { candidates, isLoading } = useGbsLeaderCandidates(retreatSlug);
  const { assignLeaders } = useGbsLineupManagement(retreatSlug);

  const [selectedLeaders, setSelectedLeaders] = useState<GbsLeaderCandidate[]>(
    []
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 디바운싱된 검색 (300ms)
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchTerm(value);
      }, 300),
    []
  );

  // 컴포넌트 언마운트 시 디바운스 취소
  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // 선택 토글
  const toggleSelection = (candidate: GbsLeaderCandidate) => {
    setSelectedLeaders((prev) => {
      const isSelected = prev.some((l) => l.id === candidate.id);
      if (isSelected) {
        return prev.filter((l) => l.id !== candidate.id);
      }
      return [...prev, candidate];
    });
  };

  // 선택 여부 체크
  const isSelected = (id: number) =>
    selectedLeaders.some((l) => l.id === id);

  // 컬럼 정의
  const columns = useMemo(
    () => [
      columnHelper.accessor("univGroupNumber", {
        id: "univGroupNumber",
        header: () => <div className="text-center text-sm">부서</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1">{info.getValue()}부</div>
        ),
        size: 70,
      }),
      columnHelper.accessor("gender", {
        id: "gender",
        header: () => <div className="text-center text-sm">성별</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
        size: 70,
      }),
      columnHelper.accessor("gradeNumber", {
        id: "gradeNumber",
        header: () => <div className="text-center text-sm">학년</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1">{info.getValue()}학년</div>
        ),
        size: 70,
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: () => <div className="text-center text-sm">이름</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1 font-medium">
            {info.getValue()}
          </div>
        ),
        size: 100,
      }),
      columnHelper.accessor("phoneNumber", {
        id: "phoneNumber",
        header: () => <div className="text-center text-sm">전화번호</div>,
        cell: (info) => (
          <div className="text-center px-2 py-1">{info.getValue() || "-"}</div>
        ),
        size: 120,
      }),
      columnHelper.display({
        id: "status",
        header: () => <div className="text-center text-sm">상태</div>,
        cell: (props) => {
          const row = props.row.original;
          const selected = isSelected(row.id);
          return (
            <div className="text-center px-2 py-1">
              {selected ? (
                <span className="text-blue-600 font-bold">선택됨</span>
              ) : (
                <span className="text-green-600">가능</span>
              )}
            </div>
          );
        },
        size: 80,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center text-sm">선택</div>,
        cell: (props) => {
          const row = props.row.original;
          const selected = isSelected(row.id);
          return (
            <div className="text-center px-2 py-1">
              <Button
                size="sm"
                variant={selected ? "secondary" : "default"}
                onClick={() => toggleSelection(row)}
                className="h-7 px-3"
              >
                {selected ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    선택됨
                  </>
                ) : (
                  "선택"
                )}
              </Button>
            </div>
          );
        },
        size: 100,
      }),
    ],
    [selectedLeaders]
  );

  // TanStack Table 설정
  const table = useReactTable({
    data: candidates,
    columns,
    state: {
      globalFilter: debouncedSearchTerm,
    },
    onGlobalFilterChange: setDebouncedSearchTerm,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchFields = [
        row.original.name,
        row.original.phoneNumber,
        String(row.original.univGroupNumber),
        String(row.original.gradeNumber),
      ];
      return searchFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // 리더 배정 실행
  const handleAssign = async () => {
    if (!gbsNumber || selectedLeaders.length === 0) return;

    setIsSubmitting(true);
    try {
      await assignLeaders(
        gbsNumber,
        selectedLeaders.map((l) => l.userId)
      );
      handleClose();
    } catch (error) {
      // 에러는 훅에서 처리됨
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 및 상태 초기화
  const handleClose = () => {
    onOpenChange(false);
    setSelectedLeaders([]);
    setSearchInput("");
    setDebouncedSearchTerm("");
  };

  // gbsNumber가 null이면 모달을 렌더링하지 않음
  if (!gbsNumber) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>리더 선택 (GBS {gbsNumber})</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="이름, 전화번호, 부서, 학년 검색"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSetSearch(e.target.value);
              }}
              className="pl-8"
            />
          </div>
          {selectedLeaders.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedLeaders.length}명 선택됨
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : (
            <VirtualizedTable
              table={table}
              estimateSize={44}
              overscan={10}
              className="max-h-[50vh]"
              emptyMessage="검색 결과가 없습니다."
            />
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedLeaders.length === 0 || isSubmitting}
          >
            {isSubmitting ? "배정 중..." : `완료 (${selectedLeaders.length}명)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
