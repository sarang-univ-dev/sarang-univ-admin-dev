import { RetreatAdminUserRole } from "@/types";

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
  LINEUP_UNIV_GROUP_ADMIN_STAFF_MEMOS = "/lineup-univ-group-admin-staff-memos",
  DORM_VIEW_CHANGES = "/dorm-view-changes",
  SCHEDULE_CHANGE_REVIEW_HISTORY = "/schedule-change-review-history",
  GBS_LINE_UP = "/gbs-line-up",
  GBS_LINE_UP_MANAGEMENT = "/gbs-line-up-management",
  DORMITORY_TEAM_MEMBER = "/dormitory-team-member",
  ASSIGN_GBS_LOCATION = "/assign-gbs-location",
  MEAL_CHECK = "/meal-check",
  DORMITORY_ASSIGNMENT = "/dormitory-assignment",
  SHUTTLE_CHECK = "/shuttle-check",
  UNIV_GROUP_MINISTER_VIEW = "/univ-group-minister-view",
  ADMIN_MINISTER_VIEW = "/admin-minister-view",
  LEADER_ATTENDANCE = "/leader-attendance",
  LEADER_SCHEDULE_CHANGE_REQUEST = "/leader-schedule-change-request",
}

export const USER_ROLE_PAGES: Readonly<
  Partial<Record<RetreatAdminUserRole, PagePath[]>>
> = {
  [RetreatAdminUserRole.ACCOUNT_STAFF]: [
    PagePath.SCHEDULE_HISTORY,
    PagePath.SCHEDULE_CHANGE,
    PagePath.SCHEDULE_CHANGE_REVIEW_HISTORY,
    PagePath.ACCOUNT_STAFF,
  ],

  [RetreatAdminUserRole.UNIV_GROUP_ACCOUNT_MEMBER]: [PagePath.COMFIRM_PAYMENT],

  [RetreatAdminUserRole.UNIV_GROUP_ADMIN_STAFF]: [
    PagePath.UNIV_GROUP_RETREAT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.SCHEDULE_CHANGE_REVIEW_HISTORY,
  ],

  [RetreatAdminUserRole.LINEUP_STAFF]: [
    PagePath.GBS_LINE_UP,
    PagePath.GBS_LINE_UP_MANAGEMENT,
    PagePath.LINEUP_VIEW_CHANGES,
    PagePath.LINEUP_UNIV_GROUP_ADMIN_STAFF_MEMOS,
    PagePath.SCHEDULE_CHANGE_REVIEW_HISTORY,
  ],

  [RetreatAdminUserRole.UNIV_GROUP_DORMITORY_MEMBER]: [
    PagePath.DORMITORY_TEAM_MEMBER,
    PagePath.MEAL_CHECK,
    PagePath.SHUTTLE_CHECK,
    PagePath.LEADER_SCHEDULE_CHANGE_REQUEST,
  ],

  [RetreatAdminUserRole.DORMITORY_STAFF]: [
    PagePath.ASSIGN_GBS_LOCATION,
    PagePath.MEAL_CHECK,
    PagePath.DORMITORY_ASSIGNMENT,
    PagePath.LEADER_ATTENDANCE,
    PagePath.SCHEDULE_CHANGE_REVIEW_HISTORY,
  ],

  [RetreatAdminUserRole.SHUTTLE_BUS_BOARDING_STAFF]: [],

  [RetreatAdminUserRole.SHUTTLE_BUS_ACCOUNT_MEMBER]: [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE,
  ],

  [RetreatAdminUserRole.SHUTTLE_BUS_ACCOUNT_STAFF]: [],
  [RetreatAdminUserRole.SHUTTLE_BUS_ADMIN_STAFF]: [],

  [RetreatAdminUserRole.UNIV_GROUP_MINISTER]: [
    PagePath.UNIV_GROUP_MINISTER_VIEW,
  ],

  [RetreatAdminUserRole.ADMIN_MINISTER]: [
    PagePath.ADMIN_MINISTER_VIEW,
  ],
};
