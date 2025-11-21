// File: src/app/login/layout.tsx
import type { Metadata } from "next";

import Toast from "@/components/common/layout/Toast";
import ConfirmModal from "@/components/common/layout/ConfirmModal";

export const metadata: Metadata = {
  title: "로그인 - 사랑의교회 대학부",
  description: "로그인 페이지입니다.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toast />
      <ConfirmModal />
    </>
  );
}
