import { UserRole } from "@/types";

export enum PagePath {
  STAFF_LIST = '/univ-group-staff-retreat',
  SCHEDULE_HISTORY = '/schedule-change-history',
  COMFIRM_PAYMENT = '/confirm-retreat-payment',
  SCHEDULRE_CHANGE = '/schedule-change-request',
}

export const USER_ROLE_PAGES: Readonly<Record<UserRole, PagePath[]>> = {
  [UserRole.ACCOUNT_STAFF]: [
    PagePath.SCHEDULE_HISTORY,
    PagePath.SCHEDULRE_CHANGE,
    PagePath.COMFIRM_PAYMENT,

  ],
  [UserRole.UNIV_GROUP_ACCOUNT_MEMBER]: [
    PagePath.COMFIRM_PAYMENT,
  ],
  
  [UserRole.UNIV_GROUP_ADMIN_STAFF]: [
    PagePath.STAFF_LIST,
  ],

  [UserRole.UNIV_GROUP_LINEUP_MEMBER]:      [],  
  [UserRole.LINEUP_STAFF]:                  [],
  [UserRole.UNIV_GROUP_DORMITORY_MEMBER]:   [],
  [UserRole.DORMITORY_STAFF]:               [],
  [UserRole.SHUTTLE_BUS_BOARDING_STAFF]:    [],
};
