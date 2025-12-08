import { create } from "zustand";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  show: (options: {
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }) => void;
  close: () => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>(set => ({
  isOpen: false,
  title: "",
  description: "",
  onConfirm: () => {},
  show: ({ title, description, onConfirm }) =>
    set({
      isOpen: true,
      title,
      description,
      onConfirm,
    }),
  close: () =>
    set({
      isOpen: false,
      title: "",
      description: "",
      onConfirm: () => {},
    }),
}));
