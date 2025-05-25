import { ComponentProps } from "react";
import { UserRole } from "@/types";

export interface IconProps extends ComponentProps<"svg"> {
  size?: number | string;
  fill?: string;
}

export interface IAuth {
  accessToken: string;
  refreshToken: string;
}

export enum TGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export type TUser = {
  id: number;
  name: string;
  phoneNumber: string;
  gender: TGender;
  gradeId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TUserRole = {
  UNIV_GROUP_ADMIN_STAFF: string;
  UNIV_GROUP_ACCOUNT_MEMBER:string;
  ACCOUNT_STAFF:string;
  LINEUP_STAFF:string;
  UNIV_GROUP_DORMITORY_MEMBER:string;
  DORMITORY_STAFF:string;
  SHUTTLE_BUS_BOARDING_STAFF:string;
  SHUTTLE_BUS_ACCOUNT_MEMBER:string;
}



export interface UserRetreatMapping {
  id: number;
  userId: number;
  email: string;
  retreatId: number;
  role: UserRole;
  createdAt: string;
  deletedAt: string | null;
}