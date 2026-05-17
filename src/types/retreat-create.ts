export type RetreatAssetType = "POSTER" | "QR_TEMPLATE";

export type RetreatUnivGroupInformation = {
  adminStaffName: string;
  adminStaffPhoneNumber: string;
  depositAccount: string;
  depositAccountHolder: string;
  shuttleBusDepositAccount: string;
  shuttleBusDepositAccountHolder: string;
};

export type RetreatUnivGroupInformationInput =
  Partial<RetreatUnivGroupInformation>;

export type RetreatUnivGroupRequest = {
  univGroupId: number;
  information?: RetreatUnivGroupInformationInput;
};

export type AddPaymentScheduleRequest = {
  name: string;
  totalPrice: number;
  partialPricePerSchedule: number;
  startAt: string;
  endAt: string;
};

export type AddShuttleBusRequest = {
  name: string;
  direction: "FROM_CHURCH_TO_RETREAT" | "FROM_RETREAT_TO_CHURCH";
  price: number;
  departureTime: string;
  arrivalTime?: string;
};

export type CreateRetreatRequest = {
  retreat: {
    slug: string;
    name: string;
    location: string;
    mainVerse: string;
    mainSpeaker: string;
    memo?: string;
    posterUrl?: string;
    qrTemplateImageKey?: string;
  };
  univGroups: RetreatUnivGroupRequest[];
  registrationSchedules: {
    date: string;
    type: "BREAKFAST" | "LUNCH" | "DINNER" | "SLEEP";
  }[];
  paymentSchedules: {
    name: string;
    totalPrice: number;
    partialPricePerSchedule: number;
    startAt: string;
    endAt: string;
  }[];
  shuttleBuses: {
    name: string;
    direction: "FROM_CHURCH_TO_RETREAT" | "FROM_RETREAT_TO_CHURCH";
    price: number;
    departureTime: string;
    arrivalTime?: string;
  }[];
};

export type UploadRetreatAssetResponse =
  | {
      assetType: "POSTER";
      posterUrl: string;
    }
  | {
      assetType: "QR_TEMPLATE";
      qrTemplateImageKey: string;
    };

export type AdminUnivGroup = {
  id: number;
  name: string;
  number: number;
};

export type AdminGrade = {
  id: number;
  univGroupId: number;
  name: string;
  number: number;
  isActive: boolean;
};

export type AdminUnivGroupWithGrades = AdminUnivGroup & {
  grades: AdminGrade[];
};

export type CreateGradeRequest = {
  name: string;
  number: number;
};

export type UpdateGradeRequest = {
  name?: string;
  number?: number;
  isActive?: boolean;
};

export type ManagedRetreat = {
  id: number;
  slug: string;
  name: string;
  location: string;
  mainVerse: string;
  mainSpeaker: string;
  memo?: string | null;
  posterUrl?: string | null;
  qrTemplateImageKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedRetreatPaymentSchedule = {
  id: number;
  retreatId: number;
  name: string;
  totalPrice: number;
  partialPricePerSchedule: number;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export type ManagedRetreatShuttleBus = {
  id: number;
  retreatId: number;
  name: string;
  direction: "FROM_CHURCH_TO_RETREAT" | "FROM_RETREAT_TO_CHURCH";
  price: number;
  departureTime: string;
  arrivalTime?: string | null;
  createdAt: string;
};

export type ManagedRetreatRegistrationSchedule = {
  id: number;
  retreatId: number;
  time: string;
  type: "BREAKFAST" | "LUNCH" | "DINNER" | "SLEEP";
  createdAt: string;
};

export type RetreatAdminRoleOption = {
  id: number;
  name: string;
  displayName: string;
};

export type RetreatAdminAssignmentOptions = {
  roles: RetreatAdminRoleOption[];
  univGroups: AdminUnivGroup[];
};

export type RetreatAdminAssignment = {
  assignmentId: number;
  adminUserId: number;
  adminName: string;
  adminEmail: string;
  adminIsActive: boolean;
  univGroupId: number;
  univGroupName: string;
  univGroupNumber: number;
  roleId: number;
  roleName: string;
  roleDisplayName: string;
  startDate: string;
  endDate: string | null;
};

export type CreateRetreatAdminAssignmentRequest = {
  univGroupId: number;
  name: string;
  email: string;
  roleId: number;
  startDate: string;
  endDate?: string | null;
};

export type UpdatePaymentScheduleRequest = Partial<AddPaymentScheduleRequest>;
export type UpdateShuttleBusRequest = Partial<
  Omit<AddShuttleBusRequest, "arrivalTime">
> & { arrivalTime?: string | null };

export type AddRegistrationScheduleRequest = {
  date: string;
  type: ManagedRetreatRegistrationSchedule["type"];
};
export type UpdateRegistrationScheduleRequest =
  Partial<AddRegistrationScheduleRequest>;

export type ManagedRetreatDetail = ManagedRetreat & {
  univGroups: (AdminUnivGroup & {
    information: RetreatUnivGroupInformation;
  })[];
  paymentSchedules: ManagedRetreatPaymentSchedule[];
  shuttleBuses: ManagedRetreatShuttleBus[];
  registrationSchedules: ManagedRetreatRegistrationSchedule[];
};

export type UpdateRetreatRequest = {
  name: string;
  location: string;
  mainVerse: string;
  mainSpeaker: string;
  memo?: string;
  posterUrl?: string;
  qrTemplateImageKey?: string;
  univGroups: RetreatUnivGroupRequest[];
};
