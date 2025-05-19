"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import useUser from "@/lib/hooks/swr/useUser";

const Redirect = () => {
  // const { user, mutate } = useUser();
  const router = useRouter();
  const [error, setError] = useState(false);

  const handleLogin = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const googleToken = urlParams.get("code");

      if (!googleToken) {
        //NOTE - 로그인 토큰없음
        return;
      }

      const response = await fetch(`/api/auth/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleToken }),
        credentials: "include",
      });
      //   console.log(response);
      if (!response.ok) {
        //NOTE - 사용자 정보 없음 or 오류
        setError(true);
        return;
      }

      //   await mutate();

      //   router.replace("/");
      //   router.refresh();
    } catch (error) {
      //NOTE - 오류
      setError(true);
    }
  };

  handleLogin();
  //   useEffect(() => {
  //     if (!user) {
  //       handleLogin();
  //     } else {
  //     //   router.replace("/");
  //     //   router.refresh();
  //     }
  //   }, [user, router]);

  //   if (error) return <div>에러</div>;
  //   return <div>로딩</div>;
};

export default Redirect;
