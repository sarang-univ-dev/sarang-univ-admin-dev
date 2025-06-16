import { create } from "zustand";

export type ToastVariant = "default" | "destructive" | "success" | "warning";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  open: boolean;
  variant?: ToastVariant;
};

interface ToastStore {
  toasts: Toast[];
  add: (
    toast: Omit<Toast, "id" | "open"> & { variant?: ToastVariant }
  ) => string;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  add: toast => {
    const id = crypto.randomUUID();
    set(state => ({
      toasts: [{ ...toast, id, open: true }, ...state.toasts].slice(0, 3),
    }));
    return id;
  },
  dismiss: id => {
    set(state => ({
      toasts: state.toasts.map(t => (t.id === id ? { ...t, open: false } : t)),
    }));
  },
  remove: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },
}));
