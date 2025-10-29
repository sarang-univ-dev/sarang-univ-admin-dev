import { webAxios } from "./axios";
import { UserRetreatMapping } from "../types/common";

const UserAPI = {
  getUserRole: async (slug: string): Promise<UserRetreatMapping[]> => {
    const {
      data: { userRole },
    } = await webAxios.get<{ userRole: UserRetreatMapping[] }>(
      `/api/v1/retreat/${slug}/user-role`
    );
    return userRole;
  },
  getUserRetreatSlug: async (): Promise<string> => {
    const {
      data: { retreatSlug },
    } = await webAxios.get<{ retreatSlug: string }>(`/api/v1/auth/slug`);

    return retreatSlug;
  },
};

export default UserAPI;
