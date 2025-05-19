import { webAxios } from "./axios";
import qs from "qs";

export interface IAuth {
  accessToken: string;
  refreshToken: string;
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export type TUser = {
  id: number;
  name: string;
  phoneNumber: string;
  gender: Gender;
  gradeId: number;
  createdAt: Date;
  updatedAt: Date;
};

const AuthAPI = {
  getUser: async (): Promise<TUser> => {
    const {
      data: { user },
    } = await webAxios.get("/api/v1/auth/check-auth");
    return user;
  },

  googleLogin: async (code: string): Promise<IAuth | void> => {
    const { data } = await webAxios.get(
      `/api/v1/auth/google/callback?${qs.stringify({ code })}`
    );
    console.log("✅ 구글 로그인 응답 데이터:", data);
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
