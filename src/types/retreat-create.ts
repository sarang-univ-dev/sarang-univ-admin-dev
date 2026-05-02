export type RetreatAssetType = "POSTER" | "QR_TEMPLATE";

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
  univGroupIds: number[];
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

export type UpdateRetreatRequest = {
  name: string;
  location: string;
  mainVerse: string;
  mainSpeaker: string;
  memo?: string;
  posterUrl?: string;
  qrTemplateImageKey?: string;
};
