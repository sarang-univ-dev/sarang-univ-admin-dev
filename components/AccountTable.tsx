"use client";

import React, { useMemo, useRef } from "react";
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
  ReteratRegisterUserType,
  RetreatRegisterStatus,
  TRetreatRegisterSchedule,
  TRetreatUserRegistration
} from "@/app/types";

import { getRegisterScheduleAlias } from "@/utils/getRetreatScheduleAlias";

// SheetJS 라이브러리 임포트
import * as XLSX from "xlsx-js-style";

// html2canvas 라이브러리 임포트
import html2canvas from "html2canvas";

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

const typeColors: Record<ReteratRegisterUserType, string> = {
  NEW_COMER: "bg-green-500",
  STAFF: "bg-slate-500",
  SOLDIER: "bg-gray-500"
};

const typeLabels: Record<ReteratRegisterUserType, string> = {
  NEW_COMER: "새가족",
  STAFF: "간사",
  SOLDIER: "군지체"
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

  // 부서 및 일정별 등록 인원 수 계산
  const departmentScheduleCount = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};

    retreatUserRegistrations.forEach((registration) => {
      const department = `${registration.univ_group_number}부`;
      if (!counts[department]) {
        counts[department] = {};
      }

      retreatRegisterSchedules.forEach((schedule) => {
        const scheduleAlias = getRegisterScheduleAlias(
          schedule.date,
          schedule.type
        );
        if (!counts[department][scheduleAlias]) {
          counts[department][scheduleAlias] = 0;
        }
        if (registration.retreat_register_schedule_ids.includes(schedule.id)) {
          counts[department][scheduleAlias] += 1;
        }
      });
    });

    return counts;
  }, [retreatUserRegistrations, retreatRegisterSchedules]);

  // 부서 목록 추출 및 정렬
  const departments = useMemo(() => {
    return Object.keys(departmentScheduleCount).sort();
  }, [departmentScheduleCount]);

  // 요약 테이블 참조 추가
  const summaryTableRef = useRef<HTMLDivElement>(null);

  // 요약 테이블 이미지 다운로드 핸들러
  const handleDownloadSummaryImage = () => {
    if (summaryTableRef.current === null) {
      return;
    }

    html2canvas(summaryTableRef.current)
      .then((canvas: any) => {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        const currentTime =
          new Date()
            .toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
              month: "long",
              day: "numeric",
              hour: "numeric",
              hour12: true
            })
            .replace("일", "일") + " 기준";
        link.download = `부서별 일정 등록 현황 ${currentTime}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err: any) => {
        console.error("이미지 변환 오류:", err);
      });
  };

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
        타입: registration.type ? typeLabels[registration.type] : "",
        등록비: `${registration.price}`,
        등록상태: statusLabels[registration.status]
        // '문자 전송' 열은 제외
      };
    });

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 컬럼 너비 설정
    // Get headers from first row of data
    const headers = Object.keys(data[0]);

    // Define widths for specific columns
    const columnWidthMap = {
      부서: 6,
      성별: 6,
      학년: 10,
      이름: 8,
      휴대전화: 20,
      등록시각: 25,
      타입: 10,
      등록비: 10,
      등록상태: 15
    };

    // Default width for schedule columns
    const scheduleWidth = 6;

    // Create array of column widths matching header order
    const columnWidths = headers.map((header) => ({
      wch:
        columnWidthMap[header as keyof typeof columnWidthMap] || scheduleWidth // Use scheduleWidth if no specific width defined
    }));

    worksheet["!cols"] = columnWidths;

    // Set center alignment and colors for all cells
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { r: R, c: C };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!worksheet[cell_ref]) continue;

        // Initialize style object if it doesn't exist
        if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};

        // Set center alignment
        worksheet[cell_ref].s.alignment = { horizontal: "center" };

        const header = headers[C];
        // Check if this header corresponds to a schedule
        const matchingSchedule = retreatRegisterSchedules.find(
          (schedule) =>
            getRegisterScheduleAlias(schedule.date, schedule.type) === header
        );

        if (matchingSchedule) {
          // Get the color from dateColorMap
          const colorClass = dateColorMap[matchingSchedule.date]?.checked || "";
          // Convert Tailwind class to RGB
          let fillColor;

          if (R === 0) {
            // Header color
            switch (colorClass) {
              case "bg-red-300":
                fillColor = { rgb: "FCA5A5" };
                break;
              case "bg-orange-300":
                fillColor = { rgb: "FDBA74" };
                break;
              case "bg-yellow-300":
                fillColor = { rgb: "FDE047" };
                break;
              case "bg-green-300":
                fillColor = { rgb: "86EFAC" };
                break;
              case "bg-blue-300":
                fillColor = { rgb: "93C5FD" };
                break;
              case "bg-indigo-300":
                fillColor = { rgb: "A5B4FC" };
                break;
              case "bg-purple-300":
                fillColor = { rgb: "C4B5FD" };
                break;
              default:
                fillColor = { rgb: "FFFFFF" };
            }
          } else {
            // Data cells color based on value
            const cellValue = worksheet[cell_ref].v;
            if (cellValue === "1") {
              switch (colorClass) {
                case "bg-red-300":
                  fillColor = { rgb: "FCA5A5" };
                  break;
                case "bg-orange-300":
                  fillColor = { rgb: "FDBA74" };
                  break;
                case "bg-yellow-300":
                  fillColor = { rgb: "FDE047" };
                  break;
                case "bg-green-300":
                  fillColor = { rgb: "86EFAC" };
                  break;
                case "bg-blue-300":
                  fillColor = { rgb: "93C5FD" };
                  break;
                case "bg-indigo-300":
                  fillColor = { rgb: "A5B4FC" };
                  break;
                case "bg-purple-300":
                  fillColor = { rgb: "C4B5FD" };
                  break;
              }
            } else if (cellValue === "0") {
              fillColor = { rgb: "D1D5DB" }; // bg-gray-300
            }
          }

          if (fillColor) {
            worksheet[cell_ref].s.fill = { fgColor: fillColor };
          }
        }
      }
    }

    // 워크북 생성 및 워크시트 추가
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "등록자 목록");

    // 엑셀 파일 생성 및 다운로드
    const currentTime = new Date()
      .toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        hour12: true
      })
      .replace("일", "일")
      .replace(":", "시");
    XLSX.writeFile(workbook, `수양회 등록자 목록 ${currentTime} 기준.xlsx`);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5 text-center">입금 확인 페이지</h1>

      {/* 요약 테이블 및 다운로드 버튼 추가 */}
      <div className="mb-8 bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">부서별 일정 등록 현황</h2>
          <Button
            onClick={handleDownloadSummaryImage}
            className="bg-slate-500 hover:bg-slate-600"
          >
            요약 이미지 다운로드
          </Button>
        </div>
        <div
          className="table-auto overflow-hidden bg-white"
          ref={summaryTableRef}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap text-center">
                  부서
                </TableHead>
                {retreatRegisterSchedules.map((schedule) => {
                  const scheduleAlias = getRegisterScheduleAlias(
                    schedule.date,
                    schedule.type
                  );
                  const color = dateColorMap[schedule.date]?.checked || "";
                  return (
                    <TableHead
                      key={schedule.id}
                      className={`whitespace-nowrap text-center ${color} text-white`}
                      style={{
                        textShadow: "1px 1px 1px black"
                      }}
                    >
                      {scheduleAlias}
                    </TableHead>
                  );
                })}
                <TableHead className="whitespace-nowrap text-center">
                  전참
                </TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  부분참
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => {
                // Get registrations for this department
                const departmentRegistrations = retreatUserRegistrations.filter(
                  (reg) => `${reg.univ_group_number}부` === department
                );

                // Count full and partial participants
                let fullParticipants = 0;
                let partialParticipants = 0;

                departmentRegistrations.forEach((registration) => {
                  const registeredSchedules =
                    registration.retreat_register_schedule_ids.length;
                  const totalSchedules = retreatRegisterSchedules.length;

                  if (registeredSchedules === totalSchedules) {
                    fullParticipants++;
                  } else if (registeredSchedules > 0) {
                    partialParticipants++;
                  }
                });

                return (
                  <TableRow key={department}>
                    <TableCell className="whitespace-nowrap text-center font-semibold">
                      {department}
                    </TableCell>
                    {retreatRegisterSchedules.map((schedule) => {
                      const scheduleAlias = getRegisterScheduleAlias(
                        schedule.date,
                        schedule.type
                      );
                      const count =
                        departmentScheduleCount[department][scheduleAlias] || 0;
                      return (
                        <TableCell
                          key={schedule.id}
                          className="whitespace-nowrap text-center"
                        >
                          {count}
                        </TableCell>
                      );
                    })}
                    <TableCell className="whitespace-nowrap text-center">
                      {fullParticipants}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-center">
                      {partialParticipants}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="text-right text-sm text-gray-500 mt-2">
            {new Date().toLocaleString("ko-KR", {
              month: "long",
              day: "numeric",
              hour: "numeric",
              timeZone: "Asia/Seoul"
            })}{" "}
            기준
          </div>
        </div>
      </div>

      {/* 기존 사용자 등록 테이블 */}
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
                입금 확인 시각
              </TableHead>
              <TableHead rowSpan={2} className="whitespace-nowrap text-center">
                타입
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
                  {retreatUserRegistration.payment_confirmed_at &&
                    new Date(
                      retreatUserRegistration.payment_confirmed_at
                    ).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  {retreatUserRegistration.type && (
                    <Badge className={typeColors[retreatUserRegistration.type]}>
                      {typeLabels[retreatUserRegistration.type]}
                    </Badge>
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
