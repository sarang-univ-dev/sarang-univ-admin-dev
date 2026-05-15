/**
 * Admin API 클라이언트
 * 서버의 /api/v1/admin/* 엔드포인트와 통신
 */

import type {
  AddPaymentScheduleRequest,
  AddRegistrationScheduleRequest,
  AddShuttleBusRequest,
  AdminGrade,
  AdminUnivGroup,
  AdminUnivGroupWithGrades,
  CreateGradeRequest,
  CreateRetreatRequest,
  ManagedRetreat,
  ManagedRetreatDetail,
  RetreatAssetType,
  RetreatUnivGroupInformationInput,
  UpdateGradeRequest,
  UpdatePaymentScheduleRequest,
  UpdateRegistrationScheduleRequest,
  UpdateRetreatRequest,
  UpdateShuttleBusRequest,
  UploadRetreatAssetResponse,
} from "@/types/retreat-create";
import type {
  AdminNavigationResponse,
  RetreatWithMenus,
} from "@/types/sidebar";

import { webAxios } from "./axios";

/**
 * 사용자가 접근 가능한 모든 retreat + 메뉴 목록 조회 (sidebar용)
 *
 * @returns RetreatWithMenus[] - 서버에서 권한 계산된 retreat 목록
 *
 * @example
 * const retreats = await getRetreatsWithMenus();
 * // [{ id: 1, slug: '2025-winter', name: '2025 겨울수양회', menuItems: [...] }]
 */
export async function getRetreatsWithMenus(): Promise<RetreatWithMenus[]> {
  const response = await webAxios.get<{ retreats: RetreatWithMenus[] }>(
    "/api/v1/admin/retreats"
  );
  return response.data.retreats;
}

export async function getAdminNavigation(): Promise<AdminNavigationResponse> {
  const response = await webAxios.get<AdminNavigationResponse>(
    "/api/v1/admin/navigation"
  );
  return response.data;
}

export async function uploadRetreatAsset({
  assetType,
  image,
}: {
  assetType: RetreatAssetType;
  image: File;
}): Promise<UploadRetreatAssetResponse> {
  const formData = new FormData();
  formData.append("assetType", assetType);
  formData.append("image", image);

  const response = await webAxios.post<UploadRetreatAssetResponse>(
    "/api/v1/admin/retreat-assets",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function downloadRetreatAsset(
  retreatId: number,
  assetType: "poster" | "qr-template"
): Promise<{ blob: Blob; fileName: string }> {
  const response = await webAxios.get(
    `/api/v1/admin/retreats/${retreatId}/assets/${assetType}`,
    {
      responseType: "blob",
    }
  );
  const contentDisposition = response.headers["content-disposition"];
  const utf8FileName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/);
  const fileName = utf8FileName?.[1]
    ? decodeURIComponent(utf8FileName[1])
    : assetType === "poster"
      ? "poster.png"
      : "qr-template.png";

  return { blob: response.data, fileName };
}

export async function createRetreat(request: CreateRetreatRequest) {
  const response = await webAxios.post("/api/v1/admin/retreats", request);

  return response.data;
}

export async function getManagedRetreats(): Promise<ManagedRetreat[]> {
  const response = await webAxios.get<{ retreats: ManagedRetreat[] }>(
    "/api/v1/admin/retreats/manage"
  );

  return response.data.retreats;
}

export async function getManagedRetreat(
  retreatId: number
): Promise<ManagedRetreatDetail> {
  const response = await webAxios.get<{ retreat: ManagedRetreatDetail }>(
    `/api/v1/admin/retreats/${retreatId}/manage`
  );

  return response.data.retreat;
}

export async function updateRetreat(
  retreatId: number,
  request: UpdateRetreatRequest
): Promise<ManagedRetreatDetail> {
  const response = await webAxios.patch<{ retreat: ManagedRetreatDetail }>(
    `/api/v1/admin/retreats/${retreatId}`,
    request
  );

  return response.data.retreat;
}

export async function addPaymentSchedule(
  retreatId: number,
  request: AddPaymentScheduleRequest
) {
  const response = await webAxios.post(
    `/api/v1/admin/retreats/${retreatId}/payment-schedules`,
    request
  );

  return response.data;
}

export async function addShuttleBus(
  retreatId: number,
  request: AddShuttleBusRequest
) {
  const response = await webAxios.post(
    `/api/v1/admin/retreats/${retreatId}/shuttle-buses`,
    request
  );

  return response.data;
}

export async function updateUnivGroupInformation(
  retreatId: number,
  univGroupId: number,
  information: RetreatUnivGroupInformationInput
) {
  const response = await webAxios.patch(
    `/api/v1/admin/retreats/${retreatId}/univ-groups/${univGroupId}/information`,
    information
  );

  return response.data;
}

export async function updatePaymentSchedule(
  retreatId: number,
  paymentScheduleId: number,
  request: UpdatePaymentScheduleRequest
) {
  const response = await webAxios.patch(
    `/api/v1/admin/retreats/${retreatId}/payment-schedules/${paymentScheduleId}`,
    request
  );
  return response.data;
}

export async function deletePaymentSchedule(
  retreatId: number,
  paymentScheduleId: number
) {
  await webAxios.delete(
    `/api/v1/admin/retreats/${retreatId}/payment-schedules/${paymentScheduleId}`
  );
}

export async function updateShuttleBus(
  retreatId: number,
  shuttleBusId: number,
  request: UpdateShuttleBusRequest
) {
  const response = await webAxios.patch(
    `/api/v1/admin/retreats/${retreatId}/shuttle-buses/${shuttleBusId}`,
    request
  );
  return response.data;
}

export async function deleteShuttleBus(retreatId: number, shuttleBusId: number) {
  await webAxios.delete(
    `/api/v1/admin/retreats/${retreatId}/shuttle-buses/${shuttleBusId}`
  );
}

export async function addRegistrationSchedule(
  retreatId: number,
  request: AddRegistrationScheduleRequest
) {
  const response = await webAxios.post(
    `/api/v1/admin/retreats/${retreatId}/registration-schedules`,
    request
  );
  return response.data;
}

export async function updateRegistrationSchedule(
  retreatId: number,
  registrationScheduleId: number,
  request: UpdateRegistrationScheduleRequest
) {
  const response = await webAxios.patch(
    `/api/v1/admin/retreats/${retreatId}/registration-schedules/${registrationScheduleId}`,
    request
  );
  return response.data;
}

export async function deleteRegistrationSchedule(
  retreatId: number,
  registrationScheduleId: number
) {
  await webAxios.delete(
    `/api/v1/admin/retreats/${retreatId}/registration-schedules/${registrationScheduleId}`
  );
}

export async function getUnivGroups(): Promise<AdminUnivGroup[]> {
  const response = await webAxios.get<{ univGroups: AdminUnivGroup[] }>(
    "/api/v1/admin/univ-groups"
  );

  return response.data.univGroups;
}

export async function getUnivGroupsWithGrades(): Promise<
  AdminUnivGroupWithGrades[]
> {
  const response = await webAxios.get<{
    univGroups: AdminUnivGroupWithGrades[];
  }>("/api/v1/admin/univ-groups/grades");

  return response.data.univGroups;
}

export async function createGrade(
  univGroupId: number,
  request: CreateGradeRequest
): Promise<AdminGrade> {
  const response = await webAxios.post<{ grade: AdminGrade }>(
    `/api/v1/admin/univ-groups/${univGroupId}/grades`,
    request
  );

  return response.data.grade;
}

export async function promoteUnivGroupGrades(
  univGroupId: number
): Promise<AdminGrade[]> {
  const response = await webAxios.post<{ grades: AdminGrade[] }>(
    `/api/v1/admin/univ-groups/${univGroupId}/grades/promote`
  );

  return response.data.grades;
}

export async function updateGrade(
  gradeId: number,
  request: UpdateGradeRequest
): Promise<AdminGrade> {
  const response = await webAxios.patch<{ grade: AdminGrade }>(
    `/api/v1/admin/grades/${gradeId}`,
    request
  );

  return response.data.grade;
}

/**
 * 사용자가 특정 retreat의 특정 페이지에 접근 가능한지 확인
 *
 * @param retreatId - Retreat ID
 * @param pagePath - 페이지 경로 (예: '/confirm-retreat-payment')
 * @returns boolean - 접근 가능 여부
 *
 * @example
 * const canAccess = await checkPageAccess(1, '/gbs-line-up');
 * // true or false
 */
export async function checkPageAccess(
  retreatId: number,
  pagePath: string
): Promise<boolean> {
  const response = await webAxios.get<{ canAccess: boolean }>(
    `/api/v1/admin/retreats/${retreatId}/permissions`,
    { params: { pagePath } }
  );
  return response.data.canAccess;
}
