import { IAuth, TUser } from "../types/common";
import { webAxios } from "./axios";
import qs from "qs";
import Cookies from "js-cookie";

const AuthAPI = {
  getUser: async (): Promise<TUser | null> => {
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      return null;
    }
    const {
      data: { user },
    } = await webAxios.get("/api/v1/auth/check-auth", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return user;
  },

  googleLogin: async (code: string): Promise<IAuth | void> => {
    const { data } = await webAxios.get(
      `/api/v1/auth/google/callback?${qs.stringify({
        code,
        env: process.env.NEXT_PUBLIC_SARANG_ENV,
      })}`
    );
    return data;
  },

  logout: async (token: string) => {
    await webAxios.get(`/api/v1/auth/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  refresh: async (token: string): Promise<IAuth | null> => {
    const {
      data: { accessToken, refreshToken },
    } = await webAxios.post(`/api/v1/auth/refresh-token`, {
      refreshToken: token,
    });

    return { accessToken, refreshToken };
  },
};

export default AuthAPI;
