"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/radix/alert-dialog";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";

/**
 * 전역 확인 다이얼로그
 *
 * 중첩 다이얼로그 문제 방지를 위해 확인 시 즉시 닫고,
 * async 작업은 호출자(예: ScheduleChangeModal)가 처리합니다.
 */
const ConfirmModal = () => {
  const { isOpen, title, description, onConfirm, close } =
    useConfirmDialogStore();

  const handleConfirm = () => {
    close(); // 먼저 닫기 (중첩 다이얼로그 문제 방지)
    onConfirm(); // async 작업은 호출자가 처리
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={close}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmModal;
