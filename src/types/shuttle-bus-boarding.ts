import {
  Gender,
  RetreatShuttleBusDirection,
  UserRetreatShuttleBusRegistrationHistoryMemoType,
  UserRetreatShuttleBusPaymentStatus,
} from "@/types";

export interface IBoardingStaffCandidate {
  id: number;
  name: string;
  email: string;
  univGroupId: number;
  univGroupName: string;
  univGroupNumber: number;
}

export interface IBoardingStaffAssignmentBus {
  id: number;
  name: string;
  direction: RetreatShuttleBusDirection;
  departureTime: string;
  arrivalTime?: string | null;
  adminUserIds: number[];
  assignedStaff: {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
  }[];
}

export interface IBoardingStaffBus {
  id: number;
  retreatId: number;
  name: string;
  direction: RetreatShuttleBusDirection;
  price: number;
  departureTime: string;
  arrivalTime?: string | null;
  adminUserIds?: number[];
  createdAt: string;
}

export interface IBoardingStaffPassenger {
  id: number;
  shuttleBusRegistrationScheduleId: number;
  univGroupNumber: number;
  gender: Gender;
  gradeNumber: number;
  name: string;
  phoneNumber: string;
  shuttleBusPaymentStatus: UserRetreatShuttleBusPaymentStatus;
  confirmedAt?: string | null;
  confirmedAdminUserName?: string | null;
  boardingStaffMemoId?: number | null;
  boardingStaffMemoType?: UserRetreatShuttleBusRegistrationHistoryMemoType | null;
  boardingStaffMemo?: string | null;
  boardingStaffMemoCreatedAt?: string | null;
  boardingStaffMemoCreatedAdminUserId?: number | null;
  boardingStaffMemoCreatedAdminUserName?: string | null;
}

export interface IBoardingStaffPassengerResponse {
  shuttleBus: IBoardingStaffBus;
  passengers: IBoardingStaffPassenger[];
  summary: {
    totalRegistered: number;
    totalConfirmed: number;
    confirmedRate: number;
  };
}
