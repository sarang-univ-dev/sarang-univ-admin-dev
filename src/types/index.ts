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

export type TRetreat = {
  id: number;
  slug: string;
  name: string;
  location: string;
  mainVerse: string;
  mainSpeaker: string;
  memo?: string;
  posterUrl?: string;
  qrMetadata?: { width: number; height: number; x: number; y: number };
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
  paymentConfirmedUserId?: number;
  paymentConfirmedAt?: Date;
  currentLeaderName: string;
  qrUrl?: string;
  gbsId?: number;
  dormitoryId?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserRetreatRegistrationSchedule = {
  id: number;
  userRetreatRegistrationId: number;
  retreatRegistrationScheduleId: number;
  confirmedAt?: Date;
  confirmedUserId?: number;
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
  createdUserId: number;
  createdAt: Date;
  resolvedUserId?: number;
  resolvedAt?: Date;
};

export type TUserRetreatRegistrationHistoryMemo = {
  id: number;
  userRetreatRegistrationId: number;
  memoType: UserRetreatRegistrationHistoryMemoType;
  issuerId: number;
  accountReviewerId?: number;
  lineupReviewerId?: number;
  dormitoryReviewerId?: number;
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
  paymentConfirmedUserId?: number;
  paymentConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserRetreatShuttleBusRegistrationHistory = {
  id: number;
  userRetreatShuttleBusRegistrationId: number;
  beforeShuttleBusIds: number[];
  beforePrice: number;
  afterShuttleBusIds: number[];
  afterPrice: number;
  createdUserId: number;
  createdAt: Date;
  resolvedUserId?: number;
  resolvedAt?: Date;
};

export type TUserRetreatShuttleBusRegistrationHistoryMemo = {
  id: number;
  userRetreatShuttleBusRegistrationId: number;
  memoType: UserRetreatShuttleBusRegistrationHistoryMemoType;
  memo: string;
  createdUserId: number;
  createdAt: Date;
  resolvedUserId?: number;
  resolvedAt?: Date;
};

export type TUserRetreatShuttleBusRegistrationSchedule = {
  id: number;
  userRetreatShuttleBusRegistrationId: number;
  retreatShuttleBusId: number;
  confirmedAt?: Date;
  confirmedUserId?: number;
  createdAt: Date;
  deletedAt?: Date;
};

export type TRetreatGBS = {
  id: number;
  retreatId: number;
  name: string;
  memo?: string;
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
  NEW_COMER_REQUEST = "NEW_COMER_REQUEST",
  SOLDIER_REQUEST = "SOLDIER_REQUEST",
  PENDING = "PENDING",
  PAID = "PAID",
  REFUND_REQUEST = "REFUND_REQUEST",
  REFUNDED = "REFUNDED"
}

export enum UserRetreatRegistrationHistoryMemoType {
  UNIV_GROUP_STAFF = "UNIV_GROUP_STAFF",
  DORMITORY_TEAM_MEMBER = "DORMITORY_TEAM_MEMBER",
  ACCOUNT_STAFF = "ACCOUNT_STAFF",
  LINEUP_STAFF = "LINEUP_STAFF",
  DORMITORY_STAFF = "DORMITORY_STAFF"
}

export enum UserRole {
  UNIV_GROUP_ADMIN_STAFF = "UNIV_GROUP_ADMIN_STAFF",
  UNIV_GROUP_ACCOUNT_MEMBER = "UNIV_GROUP_ACCOUNT_MEMBER",
  ACCOUNT_STAFF = "ACCOUNT_STAFF",
  UNIV_GROUP_LINEUP_MEMBER = "UNIV_GROUP_LINEUP_MEMBER",
  LINEUP_STAFF = "LINEUP_STAFF",
  UNIV_GROUP_DORMITORY_MEMBER = "UNIV_GROUP_DORMITORY_MEMBER",
  DORMITORY_STAFF = "DORMITORY_STAFF",
  SHUTTLE_BUS_BOARDING_STAFF = "SHUTTLE_BUS_BOARDING_STAFF"
}

export enum RetreatShuttleBusDirection {
  FROM_CHURCH_TO_RETREAT = "FROM_CHURCH_TO_RETREAT",
  FROM_RETREAT_TO_CHURCH = "FROM_RETREAT_TO_CHURCH"
}

export enum UserRetreatShuttleBusPaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  REFUND_REQUEST = "REFUND_REQUEST",
  REFUNDED = "REFUNDED"
}

// TODO: 셔틀 버스 명단에 없는데 탑승한 경우 메모만 생성 (SHUTTLE_BUS_STAFF에 대해)
export enum UserRetreatShuttleBusRegistrationHistoryMemoType {
  UNIV_GROUP_STAFF = "UNIV_GROUP_STAFF",
  SHUTTLE_BUS_BOARDING_STAFF = "SHUTTLE_BUS_BOARDING_STAFF"
}
// #endregion
