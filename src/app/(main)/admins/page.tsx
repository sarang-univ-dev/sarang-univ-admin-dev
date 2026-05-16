import { redirect } from "next/navigation";

import { getAdminNavigationServer } from "@/lib/api/server-admin-api";

import AdminListClient from "./AdminListClient";

export default async function AdminsPage() {
  const navigation = await getAdminNavigationServer();
  const canManageAdmins = navigation.globalMenuItems.some(
    item => item.href === "/admins"
  );

  if (!canManageAdmins) {
    redirect("/unauthorized");
  }

  return <AdminListClient />;
}
