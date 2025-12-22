"use client";

import { usePathname, useRouter } from "next/navigation";

import LoadingIndicator from "@/components/common/LoadingIndicator";
import { SWRConfig } from "swr";
import { useEffect } from "react";
import useUser from "@/lib/hooks/swr/useUser";

// /, /login, /login/redirect, /register, /books, /book/[id] 페이지에 관한 WHITE LIST
const WHITELIST_REGEXP = new RegExp(
  "^(/$|/login|/books|/login/redirect|/book/[a-zA-Z0-9]+)$"
);

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  // const { user, isLoading } = useUser();
  // const router = useRouter();
  // const pathname = usePathname();
  // useEffect(() => {
  //   if (isLoading) return;
  //   if (WHITELIST_REGEXP.test(pathname)) return;

  //   if (!user) {
  //     router.replace(`/login?redirect=${pathname}`);
  //     return;
  //   }

  //   // // only allow dev site access for team members
  //   // if (config.ENV !== "production" && !user.isAdmin) {
  //   //   router.replace(`/`);
  //   //   return;
  //   // }
  // }, [isLoading, router, user, pathname]);

  // // Show loading screen during initial auth check
  // if (!user && !WHITELIST_REGEXP.test(pathname)) return <LoadingIndicator />;
  return <>{children}</>;
};

interface Props {
  children: React.ReactNode;
}

const RootLayoutProvider = ({ children }: Props) => {
  return (
    <SWRConfig
      value={{
        revalidateIfStale: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateOnMount: true, // 페이지 진입 시 항상 최신 데이터 fetch
        shouldRetryOnError: false,
      }}
    >
      <AuthWrapper>{children}</AuthWrapper>
    </SWRConfig>
  );
};

export default RootLayoutProvider;
