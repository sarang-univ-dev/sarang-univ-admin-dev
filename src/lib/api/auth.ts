import { IAuth, TUser } from "../types/common";
import { webAxios } from "./axios";
import qs from "qs";

const AuthAPI = {
  getUser: async (): Promise<TUser> => {
    const {
      data: { user },
    } = await webAxios.get("/api/v1/auth/check-auth");
    return user;
  },

  googleLogin: async (code: string): Promise<IAuth | void> => {
    const { data } = await webAxios.get(
      `/api/v1/auth/google/callback?${qs.stringify({
        code,
        env: process.env.NEXT_PUBLIC_APP_ENV,
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
