import {
  getAdminNavigationServer,
  getManagedRetreatsServer,
} from "@/lib/api/server-admin-api";
import config from "@/lib/constant/config";

import RetreatListClient from "./RetreatListClient";

export default async function RetreatsPage() {
  const [navigation, retreats] = await Promise.all([
    getAdminNavigationServer(),
    getManagedRetreatsServer(),
  ]);
  const canManageRetreats = navigation.globalMenuItems.some(
    item => item.href === "/retreats/new"
  );

  return (
    <RetreatListClient
      retreats={retreats}
      retreatWebHost={config.RETREAT_WEB_HOST}
      canManageRetreats={canManageRetreats}
    />
  );
}
