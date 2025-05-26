import { UserRole } from "@/types";

export enum PagePath {
  UNIV_GROUP_RETREAT = '/univ-group-staff-retreat',
  SCHEDULE_HISTORY = '/schedule-change-history',
  COMFIRM_PAYMENT = '/confirm-retreat-payment',
  SCHEDULE_CHANGE = '/schedule-change-request',
  CONFIRM_BUS_PAYMENT = '/confirm-bus-payment',
  UNIV_GROUP_BUS = '/univ-group-staff-bus',
  BUS_SCHEDULE_HISTORY = '/bus-schedule-change-history',
  BUS_SCHEDULE_CHANGE = '/bus-schedule-change-request',
}

export const USER_ROLE_PAGES: Readonly<Record<UserRole, PagePath[]>> = {
  [UserRole.ACCOUNT_STAFF]: [
    PagePath.SCHEDULE_HISTORY,
    PagePath.SCHEDULE_CHANGE,
    PagePath.COMFIRM_PAYMENT,
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE

  ],
  [UserRole.UNIV_GROUP_ACCOUNT_MEMBER]: [
    PagePath.COMFIRM_PAYMENT,
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE
  ],
  
  [UserRole.UNIV_GROUP_ADMIN_STAFF]: [
    PagePath.UNIV_GROUP_RETREAT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE
  ],

  [UserRole.UNIV_GROUP_LINEUP_MEMBER]:      [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE
  ],  
  [UserRole.LINEUP_STAFF]:                  [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE
  ],
  [UserRole.UNIV_GROUP_DORMITORY_MEMBER]:   [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE
  ],
  [UserRole.DORMITORY_STAFF]:               [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE
  ],
  [UserRole.SHUTTLE_BUS_BOARDING_STAFF]:    [
    PagePath.CONFIRM_BUS_PAYMENT,
    PagePath.UNIV_GROUP_BUS,
    PagePath.BUS_SCHEDULE_HISTORY,
    PagePath.BUS_SCHEDULE_CHANGE
  ],
};
