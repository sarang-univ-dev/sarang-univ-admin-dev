import { ComponentProps } from "react";

export interface IconProps extends ComponentProps<"svg"> {
  size?: number | string;
  fill?: string;
}

export interface IAuth {
  accessToken: string;
  refreshToken: string;
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export type TUser = {
  id: number;
  name: string;
  phoneNumber: string;
  gender: Gender;
  gradeId: number;
  createdAt: Date;
  updatedAt: Date;
};
