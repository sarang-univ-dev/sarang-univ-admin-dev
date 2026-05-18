import { notFound, redirect } from "next/navigation";

import {
  getAdminNavigationServer,
  getManagedRetreatServer,
} from "@/lib/api/server-admin-api";

import RetreatEditForm from "./RetreatEditForm";

type RetreatEditPageProps = {
  params: {
    retreatSlug: string;
  };
};

export default async function RetreatEditPage({
  params,
}: RetreatEditPageProps) {
  const retreatSlug = params.retreatSlug.trim();

  if (!retreatSlug) {
    notFound();
  }

  const [navigation, retreat] = await Promise.all([
    getAdminNavigationServer(),
    getManagedRetreatServer(retreatSlug),
  ]);
  const canManageRetreats = navigation.globalMenuItems.some(
    item => item.href === "/retreats/new"
  );

  if (!canManageRetreats) {
    redirect("/unauthorized");
  }

  if (!retreat) {
    notFound();
  }

  return (
    <RetreatEditForm retreat={retreat} canManageRetreats={canManageRetreats} />
  );
}
