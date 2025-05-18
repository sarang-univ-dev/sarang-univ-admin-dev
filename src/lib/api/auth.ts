import { webAxios } from "./axios";

const AuthAPI = {
  getUser: async (): Promise<TUser> => {
    const {
      data: { user },
    } = await webAxios.get("/auth/check");
    return user;
  },

  logout: async (token: string) => {
    await webAxios.get(`/auth/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  refresh: async (token: string): Promise<IAuth | null> => {
    const {
      data: { accessToken, refreshToken },
    } = await webAxios.post(`/auth/refresh`, {
      refreshToken: token,
    });

    return { accessToken, refreshToken };
  },
};

export default AuthAPI;
