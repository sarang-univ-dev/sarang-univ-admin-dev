import { UserRole } from "@/types";

export enum PagePath {
  STAFF_LIST = '/univ-group-staff-retreat',
  DEPARTMENT_INFO  = '/department',
  SCHEDULE_HISTORY = '/schedule',
  COMFIRM_PAYMENT = '/confirm-retreat-payment',
  SCHEDULRE_CHANGE = '/schedule-change-request',
}

export const USER_ROLE_PAGES: Readonly<Record<UserRole, PagePath[]>> = {
  [UserRole.ACCOUNT_STAFF]: [
    PagePath.STAFF_LIST,
    PagePath.DEPARTMENT_INFO,
    PagePath.SCHEDULE_HISTORY,
    PagePath.COMFIRM_PAYMENT,
    PagePath.SCHEDULRE_CHANGE
  ],
  [UserRole.UNIV_GROUP_ACCOUNT_MEMBER]: [
    PagePath.STAFF_LIST,
  ],
  
  [UserRole.UNIV_GROUP_ADMIN_STAFF]: [
    PagePath.DEPARTMENT_INFO,
  ],

  [UserRole.UNIV_GROUP_LINEUP_MEMBER]:      [],  
  [UserRole.LINEUP_STAFF]:                  [],
  [UserRole.UNIV_GROUP_DORMITORY_MEMBER]:   [],
  [UserRole.DORMITORY_STAFF]:               [],
  [UserRole.SHUTTLE_BUS_BOARDING_STAFF]:    [],
};
