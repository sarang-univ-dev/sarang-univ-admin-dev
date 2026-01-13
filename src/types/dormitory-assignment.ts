export type DormitoryAssignmentPreview = {
  capacityBasis: "OPTIMAL" | "MAX";
  assignmentStrategy: "SAME_GBS_SAME_DORMITORY" | "RANDOM";
  isAssignable: boolean;
  previewAssignments: {
    userRetreatRegistrationId: number;
    dormitoryId: number;
    dormitoryName: string;
    gbsNumber: number | null;
    univGroupNumber: number;
    gradeNumber: number;
    userName: string;
  }[];
  dormitorySummary: {
    dormitoryId: number;
    dormitoryName: string;
    capacityBySchedule: { scheduleId: number; capacity: number }[];
    currentOccupancyBySchedule: { scheduleId: number; count: number }[];
    newAssignmentsBySchedule: { scheduleId: number; count: number }[];
    remainingCapacityBySchedule: { scheduleId: number; count: number }[];
  }[];
  dailySleepStats: {
    scheduleId: number;
    totalCount: number;
  }[];
};
