"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * 사유를 입력하고 거절을 확정했을 때 호출됩니다.
   */
  onConfirm: (reason: string) => Promise<void> | void;
  title?: string;
  description?: string;
  placeholder?: string;
  loading?: boolean;
  /**
   * 사유 입력을 필수로 할지 여부 (기본값: true)
   */
  required?: boolean;
}

/**
 * 사유 입력 거절 다이얼로그
 *
 * @description
 * - confirm-dialog-store 에는 사유 입력란이 없어 별도로 제공하는 textarea 다이얼로그
 * - MemoDialog 의 textarea 패턴을 그대로 따른다 (controlled 버전)
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "거절 사유 입력",
  description = "거절 사유를 입력해 주세요. 입력한 내용은 요청자에게 전달됩니다.",
  placeholder = "거절 사유를 입력하세요...",
  loading = false,
  required = true,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");

  // 다이얼로그가 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const isDisabled = loading || (required && !reason.trim());

  const handleConfirm = async () => {
    if (required && !reason.trim()) return;
    await onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Textarea
          className="min-h-[120px]"
          placeholder={placeholder}
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDisabled}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : null}
            거절
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
