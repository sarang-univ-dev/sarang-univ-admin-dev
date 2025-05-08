import { webAxios } from "./axios";

const AuthAPI = {
  loginGoogle: async (token: string): Promise<IAuth | null> => {
    // const {
    //   data: { accessToken, refreshToken },
    // } = await webAxios.post(`/auth/oauth/token`, {
    //   token: token,
    // });
    // return { accessToken, refreshToken };
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
