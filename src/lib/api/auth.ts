import { IAuth, TUser } from "../types/common";
import { webAxios } from "./axios";
import qs from "qs";

const AuthAPI = {
  getUser: async (): Promise<TUser | null> => {
    try {
      const { data } = await webAxios.get("/api/v1/auth/check-auth");
      return data.user || null;
    } catch (error) {
      return null;
    }
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

  logout: async (): Promise<void> => {
    await webAxios.post("/api/v1/auth/logout");
  },

  refresh: async (): Promise<void> => {
    await webAxios.post("/api/v1/auth/refresh-token");
  },
};

export default AuthAPI;
