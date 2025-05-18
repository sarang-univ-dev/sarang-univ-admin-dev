// File: src/app/login/layout.tsx
import { Inter } from "next/font/google";
import type { Metadata } from "next";

import "@/styles/global.css";
import "@/app/globals.css";

import Toast from "@/components/common/layout/Toast";
import ConfirmModal from "@/components/common/layout/ConfirmModal";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toast />
        <ConfirmModal />
      </body>
    </html>
  );
}
