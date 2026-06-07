"use client";

import { useOverlay } from "@toss/use-overlay";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/radix/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm?: () => void | Promise<void>;
  onConfirmError?: (error: unknown) => void;
  closeOnConfirmError?: boolean;
};

type ConfirmDialogProps = {
  isOpen: boolean;
  close: () => void;
  exit: () => void;
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
};

function ConfirmDialog({
  isOpen,
  close,
  exit,
  options,
  resolve,
}: ConfirmDialogProps) {
  const resultRef = useRef<boolean | null>(null);
  const completedRef = useRef(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const requestClose = (confirmed: boolean) => {
    if (resultRef.current === null) {
      resultRef.current = confirmed;
    }

    close();
  };

  const completeClose = () => {
    if (resultRef.current === null || completedRef.current) return;

    completedRef.current = true;
    exit();
    resolve(resultRef.current);
  };

  const handleContentAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.currentTarget.dataset.state === "closed") {
      completeClose();
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) requestClose(false);
      }}
    >
      <AlertDialogContent onAnimationEnd={handleContentAnimationEnd}>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          {options.description ? (
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => requestClose(false)}>
            {options.cancelText ?? "취소"}
          </Button>
          <Button
            variant={options.confirmVariant}
            disabled={isConfirming}
            onClick={async () => {
              setIsConfirming(true);

              try {
                await options.onConfirm?.();
                requestClose(true);
              } catch (error) {
                options.onConfirmError?.(error);

                if (options.closeOnConfirmError !== false) {
                  requestClose(false);
                  return;
                }

                setIsConfirming(false);
              }
            }}
          >
            {options.confirmText ?? "확인"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useConfirm() {
  const overlay = useOverlay();

  const open = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>(resolve => {
        overlay.open(({ isOpen, close, exit }) => (
          <ConfirmDialog
            isOpen={isOpen}
            close={close}
            exit={exit}
            options={options}
            resolve={resolve}
          />
        ));
      }),
    [overlay]
  );

  return useMemo(
    () => ({
      open,
      close: overlay.close,
    }),
    [open, overlay.close]
  );
}
