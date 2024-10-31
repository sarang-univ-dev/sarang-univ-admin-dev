export type TRetreatUserRegistration = {
  id: number;
  retreat_id: number;
  user_id: number;
  retreat_register_schedule_ids: number[];
  created_at: Date;
  payment_confirmed_at?: Date;
  status: RetreatRegisterStatus;
  type?: ReteratRegisterUserType;
  name: string;
  phone_number: string;
  gender: 'MALE' | 'FEMALE';
  grade_number: number;
  univ_group_number: number;
  price: number;
};

export enum RetreatRegisterStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REQUEST_CANCEL = "REQUEST_CANCEL",
  CANCELED = "CANCELED"
}

export enum ReteratRegisterUserType {
  NEW_COMER = "NEW_COMER",
  STAFF = "STAFF",
  SOLDIER = "SOLDIER"
}

export type TRetreatRegisterSchedule = {
  id: number;
  retreat_id: number;
  date: string;
  type: RetreatRegisterScheduleType;
};

export enum RetreatRegisterScheduleType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SLEEP = "SLEEP"
}