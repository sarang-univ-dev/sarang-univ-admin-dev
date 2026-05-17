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
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminPayload = {
  name: string;
  email: string;
  univGroupId: number;
};
