"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/custom-checkbox";

type RegistrationStatus =
  | "입금 전"
  | "입금 확인 완료"
  | "취소"
  | "환불 필요"
  | "추가 입금 필요";

interface Registrant {
  id: number;
  groupNumber: number;
  sex: "남" | "여";
  grade: number;
  phoneNumber: string;
  schedule: {
    [key: string]: boolean;
  };
  registeredTime: string;
  registerFee: number;
  registerStatus: RegistrationStatus;
}

const mockData: Registrant[] = [
  {
    id: 1,
    groupNumber: 1,
    sex: "남",
    grade: 10,
    phoneNumber: "010-1234-5678",
    schedule: {
      수점: true,
      수저: false,
      수숙: true,
      목아: false,
      목점: true,
      목저: false,
      목숙: true,
      금아: false,
      금점: true,
      금저: false,
      금숙: true,
      토아: false,
      토점: true
    },
    registeredTime: "2023-05-01 14:30",
    registerFee: 50000,
    registerStatus: "입금 전"
  },
  {
    id: 2,
    groupNumber: 3,
    sex: "여",
    grade: 8,
    phoneNumber: "010-9876-5432",
    schedule: {
      수점: false,
      수저: true,
      수숙: true,
      목아: true,
      목점: false,
      목저: true,
      목숙: false,
      금아: true,
      금점: false,
      금저: true,
      금숙: false,
      토아: true,
      토점: false
    },
    registeredTime: "2023-05-02 09:15",
    registerFee: 45000,
    registerStatus: "입금 확인 완료"
  },
  {
    id: 3,
    groupNumber: 5,
    sex: "남",
    grade: 12,
    phoneNumber: "010-2468-1357",
    schedule: {
      수점: true,
      수저: true,
      수숙: false,
      목아: true,
      목점: true,
      목저: false,
      목숙: true,
      금아: false,
      금점: true,
      금저: true,
      금숙: false,
      토아: true,
      토점: true
    },
    registeredTime: "2023-05-03 16:45",
    registerFee: 55000,
    registerStatus: "환불 필요"
  },
  {
    id: 4,
    groupNumber: 2,
    sex: "여",
    grade: 9,
    phoneNumber: "010-1357-2468",
    schedule: {
      수점: true,
      수저: true,
      수숙: true,
      목아: true,
      목점: true,
      목저: true,
      목숙: true,
      금아: true,
      금점: true,
      금저: true,
      금숙: true,
      토아: true,
      토점: true
    },
    registeredTime: "2023-05-04 11:20",
    registerFee: 60000,
    registerStatus: "취소"
  },
  {
    id: 5,
    groupNumber: 7,
    sex: "남",
    grade: 11,
    phoneNumber: "010-8642-9753",
    schedule: {
      수점: false,
      수저: false,
      수숙: false,
      목아: true,
      목점: true,
      목저: true,
      목숙: true,
      금아: true,
      금점: true,
      금저: true,
      금숙: true,
      토아: false,
      토점: false
    },
    registeredTime: "2023-05-05 13:10",
    registerFee: 40000,
    registerStatus: "추가 입금 필요"
  }
];

const statusColors: Record<RegistrationStatus, string> = {
  "입금 전": "bg-yellow-500",
  "입금 확인 완료": "bg-green-500",
  취소: "bg-red-500",
  "환불 필요": "bg-purple-500",
  "추가 입금 필요": "bg-blue-500"
};

const scheduleHeaders = [
  "수점",
  "수저",
  "수숙",
  "목아",
  "목점",
  "목저",
  "목숙",
  "금아",
  "금점",
  "금저",
  "금숙",
  "토아",
  "토점"
];

const dayColors: Record<string, { unchecked: string; checked: string }> = {
  수: { unchecked: "bg-red-100", checked: "bg-red-300" },
  목: { unchecked: "bg-orange-100", checked: "bg-orange-300" },
  금: { unchecked: "bg-yellow-100", checked: "bg-yellow-300" },
  토: { unchecked: "bg-green-100", checked: "bg-green-300" }
};

export function AccountTable() {
  const handleSendMessage = (registrant: Registrant) => {
    // Implement message sending logic here
    console.log(`Sending message to ${registrant.phoneNumber}`);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">Retreat Registration Admin</h1>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>부서</TableHead>
              <TableHead rowSpan={2}>성별</TableHead>
              <TableHead rowSpan={2}>학년</TableHead>
              <TableHead rowSpan={2}>휴대전화</TableHead>
              <TableHead
                className="text-center"
                colSpan={scheduleHeaders.length}
              >
                일정
              </TableHead>
              <TableHead rowSpan={2}>등록 시각</TableHead>
              <TableHead rowSpan={2}>등록비</TableHead>
              <TableHead rowSpan={2}>등록 상태</TableHead>
              <TableHead rowSpan={2}>문자 전송</TableHead>
            </TableRow>
            <TableRow>
              {scheduleHeaders.map((header) => (
                <TableHead key={header} className="text-center p-2">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((registrant) => (
              <TableRow key={registrant.id}>
                <TableCell>{registrant.groupNumber}</TableCell>
                <TableCell>{registrant.sex}</TableCell>
                <TableCell>{registrant.grade}</TableCell>
                <TableCell>{registrant.phoneNumber}</TableCell>
                {scheduleHeaders.map((header) => (
                  <TableCell key={header} className="text-center p-2">
                    <Checkbox
                      checked={registrant.schedule[header]}
                      uncheckedColor={dayColors[header[0]].unchecked}
                      checkedColor={dayColors[header[0]].checked}
                      className="border-gray-300"
                    />
                  </TableCell>
                ))}
                <TableCell>{registrant.registeredTime}</TableCell>
                <TableCell>
                  {registrant.registerFee.toLocaleString()} 원
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[registrant.registerStatus]}>
                    {registrant.registerStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  {registrant.registerStatus === "입금 전" && (
                    <Button onClick={() => handleSendMessage(registrant)}>
                      입금 확인 문자 전송
                    </Button>
                  )}
                  {registrant.registerStatus === "환불 필요" && (
                    <Button onClick={() => handleSendMessage(registrant)}>
                      환불 완료 문자 전송
                    </Button>
                  )}
                  {registrant.registerStatus === "추가 입금 필요" && (
                    <Button onClick={() => handleSendMessage(registrant)}>
                      입금 확인 문자 전송
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
