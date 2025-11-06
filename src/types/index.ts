// #region Common Types
export type JSONValue =
    | string
    | number
    | boolean
    | null
    | { [x: string]: JSONValue }
    | Array<JSONValue>;

// #endregion

// #region Table Types
export type TUnivGroup = {
  id: number;
  name: string;
  number: number;
  createdAt: Date;
};

export type TGrade = {
  id: number;
  univGroupId: number;
  name: string;
  number: number;
  isActive: boolean;
  createdAt: Date;
};

export type TUserProfile = {
  id: number;
  name: string;
  phoneNumber: string;
  gender: Gender;
  gradeId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Position = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type QRMetadata = {
  qrPosition: Position;
  userProfilePosition: Position;
};

export type TRetreat = {
  id: number;
  slug: string;
  name: string;
  location: string;
  mainVerse: string;
  mainSpeaker: string;
  memo?: string;
  posterUrl?: string;
  qrMetadata?: QRMetadata;
  createdAt: Date;
  updatedAt: Date;
};

export type TRetreatUnivGroup = {
  retreatId: number;
  univGroupId: number;
  information?: {
    admin_staff_name?: string;
    admin_staff_phone_number?: string;
    deposit_account?: string;
    deposit_account_holder?: string;
    new_comer_staff_name?: string;
    new_comer_staff_phone_number?: string;
    soldier_staff_name?: string;
    soldier_staff_phone_number?: string;
    shuttle_bus_deposit_account?: string;
    shuttle_bus_deposit_account_holder?: string;
  };
  createdAt: Date;
};

export type TRetreatPaymentSchedule = {
  id: number;
  retreatId: number;
  name: string;
  totalPrice: number;
  partialPricePerSchedule: number;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
};

export type TRetreatRegistrationSchedule = {
  id: number;
  retreatId: number;
  time: Date;
  type: RetreatRegistrationScheduleType;
  createdAt: Date;
};

export type TUserRetreatRegistration = {
  id: number;
  retreatId: number;
  userId: number;
  userType?: UserRetreatRegistrationType;
  price: number;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  paymentConfirmedAdminUserId?: number;
  paymentConfirmedAt?: Date;
  currentLeaderName: string;
  qrUrl?: string;
  gbsId?: number;
  dormitoryId?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserRetreatRegistrationMemo = {
  id: number;
  userRetreatRegistrationId: number;
  memoType: UserRetreatRegistrationMemoType;
  memo: string;
  color?: string; // 라인업 메모에서만 일단 색깔 사용
  createdAdminUserId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type TUserRetreatRegistrationSchedule = {
  id: number;
  userRetreatRegistrationId: number;
  retreatRegistrationScheduleId: number;
  confirmedAt?: Date;
  confirmedAdminUserId?: number;
  createdAt: Date;
  deletedAt?: Date;
};

export type TUserRetreatRegistrationScheduleHistory = {
  id: number;
  userRetreatRegistrationId: number;
  beforeScheduleIds: number[];
  beforePrice: number;
  afterScheduleIds: number[];
  afterPrice: number;
  createdAdminUserId: number;
  createdAt: Date;
  resolvedAdminUserId?: number;
  resolvedAt?: Date;
};

export type TUserRetreatRegistrationHistoryMemo = {
  id: number;
  userRetreatRegistrationId: number;
  memoType: UserRetreatRegistrationHistoryMemoType;
  issuerAdminUserId: number;
  accountReviewerAdminUserId?: number;
  lineupReviewerAdminUserId?: number;
  dormitoryReviewerAdminUserId?: number;
  memo: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserRetreatRole = {
  id: number;
  userId: number;
  email: string;
  retreatId: number;
  role: UserRole;
  createdAt: Date;
};

export type TRetreatShuttleBus = {
  id: number;
  retreatId: number;
  name: string;
  direction: RetreatShuttleBusDirection;
  price: number;
  departureTime: Date;
  arrivalTime?: Date;
  adminUserIds?: number[];
  createdAt: Date;
};

export type TUserRetreatShuttleBusRegistration = {
  id: number;
  userId: number;
  retreatId: number;
  price: number;
  shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus;
  isAdminContact: boolean;
  paymentConfirmedAdminUserId?: number;
  paymentConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserRetreatShuttleBusRegistrationMemo = {
  id: number;
  userRetreatShuttleBusRegistrationId: number;
  memoType: UserRetreatShuttleBusRegistrationMemoType;
  memo: string;
  createdAdminUserId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type TUserRetreatShuttleBusRegistrationHistory = {
  id: number;
  userRetreatShuttleBusRegistrationId: number;
  beforeShuttleBusIds: number[];
  beforePrice: number;
  afterShuttleBusIds: number[];
  afterPrice: number;
  createdAdminUserId: number;
  createdAt: Date;
  resolvedAdminUserId?: number;
  resolvedAt?: Date;
};

export type TUserRetreatShuttleBusRegistrationHistoryMemo = {
  id: number;
  userRetreatShuttleBusRegistrationId: number;
  memoType: UserRetreatShuttleBusRegistrationHistoryMemoType;
  memo: string;
  createdAdminUserId: number;
  createdAt: Date;
  resolvedAdminUserId?: number;
  resolvedAt?: Date;
};

export type TUserRetreatShuttleBusRegistrationSchedule = {
  id: number;
  userRetreatShuttleBusRegistrationId: number;
  retreatShuttleBusId: number;
  confirmedAt?: Date;
  confirmedAdminUserId?: number;
  createdAt: Date;
  deletedAt?: Date;
};

export type TRetreatGBS = {
  id: number;
  retreatId: number;
  number: number| null;
  memo?: string | null;
  location?: string;
  leaderUserIds: number[];
  createdAt: Date;
};

export type TRetreatDormitory = {
  id: number;
  retreatId: number;
  name: string;
  memo?: string;
  gender: Gender;
  optimalCapacity: number;
  maxCapacity?: number;
  createdAt: Date;
};
// #endregion

// #region Server Types
export type UserInfo = {
  userId: number;
  name: string;
  phoneNumber: string;
  gender: Gender;
  gradeId: number;
  gradeNumber: number;
  univGroupId: number;
  univGroupNumber: number;
};

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

export enum UserRetreatRegistrationType {
  NEW_COMER = "NEW_COMER",
  STAFF = "STAFF",
  SOLDIER = "SOLDIER"
}

export enum RetreatRegistrationScheduleType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SLEEP = "SLEEP"
}

export enum UserRetreatRegistrationPaymentStatus {
  NEW_COMER_REQUEST = "NEW_COMER_REQUEST", // 새가족 신청 요청
  SOLDIER_REQUEST = "SOLDIER_REQUEST", // 군지체 신청 요청
  PENDING = "PENDING", // 입금 확인 대기
  PAID = "PAID", // 입금 확인 완료
  REFUND_REQUEST = "REFUND_REQUEST", // 환불 요청
  REFUNDED = "REFUNDED" // 환불 완료
}

export enum UserRetreatRegistrationMemoType {
  UNIV_GROUP_ADMIN_STAFF = "UNIV_GROUP_ADMIN_STAFF", // 부서 행정 간사
  ACCOUNT_STAFF = "ACCOUNT_STAFF", // 재정 간사
  LINEUP_STAFF = "LINEUP_STAFF", // 라인업 간사
  DORMITORY_STAFF = "DORMITORY_STAFF" // 인원관리 간사
}

export enum UserRetreatRegistrationHistoryMemoType {
  UNIV_GROUP_ADMIN_STAFF = "UNIV_GROUP_ADMIN_STAFF", // 부서 행정 간사
  DORMITORY_TEAM_MEMBER = "DORMITORY_TEAM_MEMBER", // 인원관리 팀원
  ACCOUNT_STAFF = "ACCOUNT_STAFF", // 재정 간사
  LINEUP_STAFF = "LINEUP_STAFF", // 라인업 간사
  DORMITORY_STAFF = "DORMITORY_STAFF" // 인원관리 간사
}

export enum UserRole {
  UNIV_GROUP_ADMIN_STAFF = "UNIV_GROUP_ADMIN_STAFF", // 부서 행정 간사
  UNIV_GROUP_ACCOUNT_MEMBER = "UNIV_GROUP_ACCOUNT_MEMBER", // 부서 재정 팀원
  ACCOUNT_STAFF = "ACCOUNT_STAFF", // 재정 간사
  LINEUP_STAFF = "LINEUP_STAFF", // 라인업 간사
  UNIV_GROUP_DORMITORY_MEMBER = "UNIV_GROUP_DORMITORY_MEMBER", // 부서 인원관리 팀원
  DORMITORY_STAFF = "DORMITORY_STAFF", // 인원관리 간사
  SHUTTLE_BUS_BOARDING_STAFF = "SHUTTLE_BUS_BOARDING_STAFF", // 부분참 선탑 간사
  SHUTTLE_BUS_ACCOUNT_MEMBER = "SHUTTLE_BUS_ACCOUNT_MEMBER" // 총무 팀원
}

export enum RetreatShuttleBusDirection {
  FROM_CHURCH_TO_RETREAT = "FROM_CHURCH_TO_RETREAT",
  FROM_RETREAT_TO_CHURCH = "FROM_RETREAT_TO_CHURCH"
}

export enum UserRetreatShuttleBusRegistrationMemoType {
  UNIV_GROUP_ADMIN_STAFF = "UNIV_GROUP_ADMIN_STAFF", // 부서 행정 간사
  ACCOUNT_STAFF = "ACCOUNT_STAFF", // 재정 간사
  LINEUP_STAFF = "LINEUP_STAFF", // 라인업 간사
  DORMITORY_STAFF = "DORMITORY_STAFF", // 인원관리 간사
  SHUTTLE_BUS_ACCOUNT_MEMBER = "SHUTTLE_BUS_ACCOUNT_MEMBER", // 총무 팀원
  SHUTTLE_BUS_BOARDING_STAFF = "SHUTTLE_BUS_BOARDING_STAFF" // 부분참 선탑 간사
}

export enum UserRetreatShuttleBusPaymentStatus {
  PENDING = "PENDING", // 입금 확인 대기
  PAID = "PAID", // 입금 확인 완료
  REFUND_REQUEST = "REFUND_REQUEST", // 환불 요청
  REFUNDED = "REFUNDED" // 환불 완료
}

// TODO: 셔틀 버스 명단에 없는데 탑승한 경우 메모만 생성 (SHUTTLE_BUS_STAFF에 대해)
export enum UserRetreatShuttleBusRegistrationHistoryMemoType {
  UNIV_GROUP_ADMIN_STAFF = "UNIV_GROUP_ADMIN_STAFF", // 부서 행정 간사
  SHUTTLE_BUS_BOARDING_STAFF = "SHUTTLE_BUS_BOARDING_STAFF" // 부분참 선탑 간사
}
// #endregion

// #region Module Re-exports
export * from "./univ-group-admin-staff";
export * from "./account";
export * from "./schedule-change-request";
// #endregion
