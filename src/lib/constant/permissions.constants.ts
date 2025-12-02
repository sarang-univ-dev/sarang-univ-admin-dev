import { UserRole } from "@/types";

export enum PagePath {
  UNIV_GROUP_RETREAT = "/univ-group-retreat-registration",
  SCHEDULE_HISTORY = "/schedule-change-history",
  COMFIRM_PAYMENT = "/confirm-retreat-payment",
  SCHEDULE_CHANGE = "/schedule-change-request",
  CONFIRM_BUS_PAYMENT = "/shuttle-bus-payment-confirmation",
  UNIV_GROUP_BUS = "/univ-group-bus-registration",
  BUS_SCHEDULE_HISTORY = "/bus-schedule-change-history",
  BUS_SCHEDULE_CHANGE = "/bus-schedule-change-request",
  ACCOUNT_STAFF = "/account-staff",
  LINEUP_VIEW_CHANGES = "/lineup-view-changes",
  DORM_VIEW_CHANGES = "/dorm-view-changes",
  GBS_LINE_UP = "/gbs-line-up",
  GBS_LINE_UP_MANAGEMENT = "/gbs-line-up-management",
  DORMITORY_TEAM_MEMBER = "/dormitory-team-member",
  ASSIGN_GBS_LOCATION = "/assign-gbs-location",
  MEAL_CHECK = "/meal-check",
  DORMITORY_ASSIGNMENT = "/dormitory-assignment",
  SHUTTLE_CHECK = "/shuttle-check",
}

export const USER_ROLE_PAGES: Readonly<Record<UserRole, PagePath[]>> = {
  [UserRole.ACCOUNT_STAFF]: [
    PagePath.SCHEDULE_HISTORY,
    PagePath.SCHEDULE_CHANGE,
    PagePath.ACCOUNT_STAFF,
  ],

  [UserRole.UNIV_GROUP_ACCOUNT_MEMBER]: [PagePath.COMFIRM_PAYMENT],

  [UserRole.UNIV_GROUP_ADMIN_STAFF]: [
    PagePath.UNIV_GROUP_RETREAT,
    PagePath.UNIV_GROUP_BUS,
  ],

  [UserRole.LINEUP_STAFF]: [
    PagePath.GBS_LINE_UP, 
    PagePath.GBS_LINE_UP_MANAGEMENT, 
    PagePath.LINEUP_VIEW_CHANGES
  ],

  [UserRole.UNIV_GROUP_DORMITORY_MEMBER]: [
    PagePath.DORMITORY_TEAM_MEMBER, 
    PagePath.MEAL_CHECK,
    PagePath.SHUTTLE_CHECK
    
  ],

  [UserRole.DORMITORY_STAFF]: [
    PagePath.ASSIGN_GBS_LOCATION, 
    PagePath.DORM_VIEW_CHANGES, 
    PagePath.MEAL_CHECK,
    PagePath.DORMITORY_ASSIGNMENT
  ],

  [UserRole.SHUTTLE_BUS_BOARDING_STAFF]: [],

  [UserRole.SHUTTLE_BUS_ACCOUNT_MEMBER]: [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE,
  ],
};
