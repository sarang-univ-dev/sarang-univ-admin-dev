"use client";

import { useToastStore } from "@/store/toast-store";
import {
  ToastProvider,
  ToastViewport,
  Toast as ToastPrimitive,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/radix/toast";

const Toast = () => {
  const { toasts, remove } = useToastStore();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, open, variant }) => (
        <ToastPrimitive
          key={id}
          open={open}
          onOpenChange={open => !open && remove(id)}
          variant={variant ?? "success"}
        >
          <div>
            <ToastTitle>{title}</ToastTitle>
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </ToastPrimitive>
      ))}

      <ToastViewport />
    </ToastProvider>
  );
};

export default Toast;
