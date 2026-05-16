import { redirect } from "next/navigation";

import { getAdminNavigationServer } from "@/lib/api/server-admin-api";

import AdminDetailClient from "./AdminDetailClient";

type Props = {
  params: Promise<{ adminUserId: string }>;
};

export default async function AdminDetailPage({ params }: Props) {
  const { adminUserId } = await params;
  const navigation = await getAdminNavigationServer();
  const canManageAdmins = navigation.globalMenuItems.some(
    item => item.href === "/admins"
  );

  if (!canManageAdmins) {
    redirect("/unauthorized");
  }

  const id = Number(adminUserId);
  if (!Number.isInteger(id) || id <= 0) {
    redirect("/admins");
  }

  return <AdminDetailClient adminUserId={id} />;
}
