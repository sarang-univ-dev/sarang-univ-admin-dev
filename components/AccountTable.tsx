"use client";

import React, { useMemo } from "react";
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
import {
  RetreatRegisterStatus,
  TRetreatRegisterSchedule,
  TRetreatUserRegistration
} from "@/app/types";

import { getRegisterScheduleAlias } from "@/utils/getRetreatScheduleAlias";

// SheetJS 라이브러리 임포트
import * as XLSX from "xlsx";

interface Props {
  retreatUserRegistrations: TRetreatUserRegistration[];
  retreatRegisterSchedules: TRetreatRegisterSchedule[];
}

// 등록 상태에 따른 색상 매핑
const statusColors: Record<RetreatRegisterStatus, string> = {
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-green-500",
  REQUEST_CANCEL: "bg-red-500",
  CANCELED: "bg-purple-500"
  // "추가 입금 필요": "bg-blue-500" // 필요 시 추가
};

// 등록 상태에 따른 한국어 레이블 매핑
const statusLabels: Record<RetreatRegisterStatus, string> = {
  PENDING: "입금 확인 대기중",
  CONFIRMED: "입금 확인됨",
  REQUEST_CANCEL: "취소 요청",
  CANCELED: "취소됨"
  // "추가 입금 필요": "추가 입금 필요" // 필요 시 추가
};

// 무지개 색상 쌍 정의 (checked, unchecked)
const rainbowColorPairs: { checked: string; unchecked: string }[] = [
  { checked: "bg-red-300", unchecked: "bg-gray-300" },
  { checked: "bg-orange-300", unchecked: "bg-gray-300" },
  { checked: "bg-yellow-300", unchecked: "bg-gray-300" },
  { checked: "bg-green-300", unchecked: "bg-gray-300" },
  { checked: "bg-blue-300", unchecked: "bg-gray-300" },
  { checked: "bg-indigo-300", unchecked: "bg-gray-300" },
  { checked: "bg-purple-300", unchecked: "bg-gray-300" }
];

export function AccountTable({
  retreatUserRegistrations,
  retreatRegisterSchedules
}: Props) {
  // 날짜별 색상 매핑 생성
  const dateColorMap = useMemo(() => {
    // 고유한 날짜 추출 및 정렬
    const uniqueDates = Array.from(
      new Set(retreatRegisterSchedules.map((schedule) => schedule.date))
    ).sort();

    const map: Record<string, { checked: string; unchecked: string }> = {};
    uniqueDates.forEach((date, index) => {
      const colorPair = rainbowColorPairs[index % rainbowColorPairs.length];
      map[date] = colorPair;
    });

    return map;
  }, [retreatRegisterSchedules]);

  // 엑셀 다운로드 핸들러
  const handleDownloadExcel = () => {
    // 엑셀에 포함할 데이터 배열 생성
    const data = retreatUserRegistrations.map((registration) => {
      // 각 스케줄에 대한 체크 여부를 문자열로 변환
      const schedules = retreatRegisterSchedules.map((schedule) =>
        registration.retreat_register_schedule_ids.includes(schedule.id)
          ? "1"
          : "0"
      );

      return {
        부서: `${registration.univ_group_number}부`,
        성별: registration.gender === "MALE" ? "남" : "여",
        학년: `${registration.grade_number}학년`,
        이름: registration.name,
        휴대전화: registration.phone_number,
        ...retreatRegisterSchedules.reduce((acc, schedule, idx) => {
          acc[getRegisterScheduleAlias(schedule.date, schedule.type)] =
            schedules[idx];
          return acc;
        }, {} as Record<string, string>),
        등록시각: new Date(registration.created_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul"
        }),
        등록비: `${registration.price}`,
        등록상태: statusLabels[registration.status]
        // '문자 전송' 열은 제외
      };
    });

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 워크북 생성 및 워크시트 추가
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "등록자 목록");

    // 엑셀 파일 생성 및 다운로드
    XLSX.writeFile(workbook, "등록자_목록.xlsx");
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5 text-center">입금 확인 페이지</h1>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                부서
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                성별
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                학년
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                이름
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                휴대전화
              </TableHead>
              <TableHead
                className="text-center"
                colSpan={retreatRegisterSchedules.length}
              >
                일정
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                등록 시각
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                등록비
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                등록 상태
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                문자 전송
              </TableHead>
            </TableRow>
            <TableRow>
              {retreatRegisterSchedules.map((retreatRegisterSchedule) => (
                <TableHead
                  key={retreatRegisterSchedule.id}
                  className="text-center p-2 whitespace-nowrap"
                >
                  {getRegisterScheduleAlias(
                    retreatRegisterSchedule.date,
                    retreatRegisterSchedule.type
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {retreatUserRegistrations.map((retreatUserRegistration) => (
              <TableRow key={retreatUserRegistration.id}>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.univ_group_number}부
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.gender === "MALE" ? "남" : "여"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.grade_number}학년
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.name}
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.phone_number}
                </TableCell>
                {retreatRegisterSchedules.map((registerSchedule) => {
                  // 날짜에 따른 색상 쌍 가져오기
                  const colorPair = dateColorMap[registerSchedule.date] || {
                    checked: "bg-gray-500",
                    unchecked: "bg-gray-300"
                  };

                  const isChecked =
                    retreatUserRegistration.retreat_register_schedule_ids.includes(
                      registerSchedule.id
                    );

                  return (
                    <TableCell
                      key={registerSchedule.id}
                      className="text-center p-2 whitespace-nowrap"
                    >
                      <Checkbox
                        checked={isChecked}
                        uncheckedColor={colorPair.unchecked}
                        checkedColor={colorPair.checked}
                        className="border-gray-300"
                      />
                    </TableCell>
                  );
                })}
                <TableCell className="whitespace-nowrap text-center">
                  {new Date(retreatUserRegistration.created_at).toLocaleString(
                    "ko-KR",
                    { timeZone: "Asia/Seoul" }
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.price.toLocaleString()} 원
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Badge
                    className={statusColors[retreatUserRegistration.status]}
                  >
                    {statusLabels[retreatUserRegistration.status]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.status ===
                    RetreatRegisterStatus.PENDING && (
                    <Button
                      // onClick={() => handleSendMessage(retreatUserRegistration)}
                      className="bg-slate-500 hover:bg-slate-600"
                    >
                      입금 확인 문자 전송
                    </Button>
                  )}
                  {/* 추가적인 상태에 따른 버튼 로직이 필요한 경우 여기에 추가 */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* 엑셀 다운로드 버튼 추가 */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleDownloadExcel}
          className="bg-blue-500 hover:bg-blue-600"
        >
          엑셀로 다운로드
        </Button>
      </div>
    </div>
  );
}
