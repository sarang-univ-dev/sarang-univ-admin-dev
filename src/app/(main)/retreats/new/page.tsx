import { redirect } from "next/navigation";

import { getAdminNavigationServer } from "@/lib/api/server-admin-api";

import CreateRetreatForm from "./CreateRetreatForm";

export default async function NewRetreatPage() {
  const navigation = await getAdminNavigationServer();
  const canCreateRetreat = navigation.globalMenuItems.some(
    item => item.href === "/retreats/new"
  );

  if (!canCreateRetreat) {
    redirect("/unauthorized");
  }

  return <CreateRetreatForm />;
}
