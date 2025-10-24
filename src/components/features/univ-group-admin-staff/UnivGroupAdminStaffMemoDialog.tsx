"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useUnivGroupAdminStaffActions } from "@/hooks/univ-group-admin-staff/use-univ-group-admin-staff-actions";

interface UnivGroupAdminStaffMemoDialogProps {
  retreatSlug: string;
}

/**
 * 일정 변경 요청 메모 다이얼로그
 * - CustomEvent로 열기/닫기
 * - 메모 작성 및 저장
 */
export function UnivGroupAdminStaffMemoDialog({
  retreatSlug,
}: UnivGroupAdminStaffMemoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRowId, setCurrentRowId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");

  const { loading, handleSaveScheduleMemo } =
    useUnivGroupAdminStaffActions(retreatSlug);

  useEffect(() => {
    const handleOpenDialog = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      setCurrentRowId(customEvent.detail.id);
      setMemoText("");
      setIsOpen(true);
    };

    window.addEventListener("open-memo-dialog", handleOpenDialog);

    return () => {
      window.removeEventListener("open-memo-dialog", handleOpenDialog);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setMemoText("");
    setCurrentRowId(null);
  };

  const handleSubmit = async () => {
    if (!currentRowId || !memoText.trim()) return;

    await handleSaveScheduleMemo(currentRowId, memoText.trim());
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all duration-300 ease-out scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">일정 변경 요청 메모 작성</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <textarea
          className="w-full border rounded-md p-2 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="메모를 입력하세요... ex) 전참 → 금숙 ~ 토점"
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!memoText.trim() || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : null}
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
