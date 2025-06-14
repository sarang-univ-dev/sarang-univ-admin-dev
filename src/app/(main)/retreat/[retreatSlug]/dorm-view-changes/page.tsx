"use client";

import { useEffect, useState } from "react";
import { useUserScheduleChangeRetreat } from "@/hooks/user-schedule-change-retreat-request";
import { RetreatScheduleChangeRequestTable } from "@/components/RetreatScheduleChangeRequestTable";
import { PaymentSummary } from "@/components/PaymentSummary";
import { AccountStatus } from "@/components/account-status";
import { useParams } from "next/navigation";
import {
  TRetreatRegistrationSchedule,
  TRetreatUnivGroup,
  TRetreatPaymentSchedule
} from "@/types";
import { webAxios } from "@/lib/api/axios";

export default function MyPage(){
  return(<div></div>);
}