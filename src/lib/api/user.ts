import Cookies from "js-cookie";
import { webAxios } from "./axios";
import { UserRetreatMapping } from "../types/common";

const UserAPI = {
  getUserRole: async (slug: string): Promise<UserRetreatMapping[]> => {
    const accessToken = Cookies.get("accessToken");
    const {
      data: { userRole },
    } = await webAxios.get<{ userRole: UserRetreatMapping[] }>(
      `/api/v1/retreat/${slug}/user-role`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return userRole;
  },
  getUserRetreatSlug: async (): Promise<string> => {
    const accessToken = Cookies.get("accessToken");
    const {
      data: { retreatSlug },
    } = await webAxios.get<{ retreatSlug: string }>(`/api/v1/auth/slug`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return retreatSlug;
  },
};

export default UserAPI;
