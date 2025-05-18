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

const ConfirmModal = () => {
  const { isOpen, title, description, onConfirm, close } =
    useConfirmDialogStore();

  return (
    <AlertDialog open={isOpen} onOpenChange={open => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={close}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              close();
            }}
          >
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmModal;
