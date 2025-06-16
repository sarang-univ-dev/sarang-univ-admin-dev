import { UserRole } from "@/types";

export enum PagePath {
  UNIV_GROUP_RETREAT = "/univ-group-staff-retreat",
  SCHEDULE_HISTORY = "/schedule-change-history",
  COMFIRM_PAYMENT = "/confirm-retreat-payment",
  SCHEDULE_CHANGE = "/schedule-change-request",
  CONFIRM_BUS_PAYMENT = "/confirm-bus-payment",
  UNIV_GROUP_BUS = "/univ-group-staff-bus",
  BUS_SCHEDULE_HISTORY = "/bus-schedule-change-history",
  BUS_SCHEDULE_CHANGE = "/bus-schedule-change-request",
  ACCOUNT_STAFF = "/account-staff",
  GBS_LINE_UP = "/gbs-line-up",
  GBS_LINE_UP_MANAGEMENT = "/gbs-line-up-management",
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

  [UserRole.LINEUP_STAFF]: [PagePath.GBS_LINE_UP, PagePath.GBS_LINE_UP_MANAGEMENT],

  [UserRole.UNIV_GROUP_DORMITORY_MEMBER]: [],

  [UserRole.DORMITORY_STAFF]: [],

  [UserRole.SHUTTLE_BUS_BOARDING_STAFF]: [],

  [UserRole.SHUTTLE_BUS_ACCOUNT_MEMBER]: [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE,
  ],
};
