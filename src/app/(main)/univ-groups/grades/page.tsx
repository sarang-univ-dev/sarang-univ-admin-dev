import { redirect } from "next/navigation";

import {
  getAdminNavigationServer,
  getUnivGroupsWithGradesServer,
} from "@/lib/api/server-admin-api";

import GradeManagementClient from "./GradeManagementClient";

export default async function GradeManagementPage() {
  const [navigation, univGroups] = await Promise.all([
    getAdminNavigationServer(),
    getUnivGroupsWithGradesServer(),
  ]);
  const canManageGrades = navigation.globalMenuItems.some(
    item => item.href === "/univ-groups/grades"
  );

  if (!canManageGrades) {
    redirect("/unauthorized");
  }

  return <GradeManagementClient initialUnivGroups={univGroups} />;
}
