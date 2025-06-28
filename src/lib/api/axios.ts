import Axios from "axios";
import config from "../constant/config";
import Cookies from "js-cookie";

export const webAxios = Axios.create({
  baseURL: config.API_HOST,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Request 인터셉터 추가 - 모든 요청에 Authorization 헤더 자동 설정
webAxios.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
