import { notFound, redirect } from "next/navigation";

import {
  getAdminNavigationServer,
  getManagedRetreatServer,
} from "@/lib/api/server-admin-api";

import RetreatEditForm from "./RetreatEditForm";

type RetreatEditPageProps = {
  params: {
    retreatId: string;
  };
};

export default async function RetreatEditPage({
  params,
}: RetreatEditPageProps) {
  const retreatId = Number(params.retreatId);

  if (!Number.isInteger(retreatId) || retreatId <= 0) {
    notFound();
  }

  const [navigation, retreat] = await Promise.all([
    getAdminNavigationServer(),
    getManagedRetreatServer(retreatId),
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

  return <RetreatEditForm retreat={retreat} />;
}
