import Axios from "axios";
import config from "../constant/config";

export const webAxios = Axios.create({
  baseURL: config.API_HOST,
  withCredentials: true, // ✅ 쿠키 자동 전송
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ❌ 제거: Authorization 헤더 interceptor (쿠키 자동 전송)
// webAxios.interceptors.request.use(...)

// ✅ Response interceptor (401 에러 처리)
webAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 && 아직 재시도 안 함
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token 시도
        await webAxios.post("/api/v1/auth/refresh-token");

        // 원래 요청 재시도
        return webAxios(originalRequest);
      } catch (refreshError) {
        // Refresh 실패 → 로그인 페이지
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
