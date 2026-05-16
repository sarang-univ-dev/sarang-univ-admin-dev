/**
 * Admin user 관리 API 응답/요청 타입 (superuser 전용)
 */

export type AdminListRow = {
  id: number;
  univGroupId: number;
  univGroupNumber: number | null;
  univGroupName: string | null;
  name: string;
  email: string;
  isActive: boolean;
  isSuperuser: boolean;
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminAssignment = {
  assignmentId: number;
  retreatId: number;
  retreatSlug: string;
  retreatName: string;
  roleName: string;
  roleDisplayName: string;
  startDate: string;
  endDate: string | null;
};

export type AdminDetail = {
  admin: AdminListRow;
  assignments: AdminAssignment[];
};

export type CreateAdminPayload = {
  name: string;
  email: string;
  univGroupId: number;
  isSuperuser?: boolean;
};

export type UpdateAdminPayload = {
  name?: string;
  univGroupId?: number;
  isActive?: boolean;
  isSuperuser?: boolean;
};
