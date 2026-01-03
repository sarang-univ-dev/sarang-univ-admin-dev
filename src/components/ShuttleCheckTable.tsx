"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { webAxios } from "@/lib/api/axios";
import { getRegisterScheduleAlias } from "@/utils/getRetreatScheduleAlias";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { generateShuttleBusScheduleColumns } from "@/utils/bus-utils";
import { useToastStore } from "@/store/toast-store";
import {
  getKSTDay,
  getKSTMonth,
  getKSTDate,
  getKSTHours,
  getKSTMinutes,
} from "@/lib/utils/date-utils";
import { TRetreatRegistrationSchedule, TRetreatShuttleBus } from "@/types";
import { GenderBadge } from "@/components/Badge";

interface ShuttleBusSchedule {
  id: number;
  name: string;
  direction: string;
  departureTime: string;
}

interface ShuttleBusStats {
  totalRegistered: number;
  totalConfirmed: number;
  confirmedRate: number;
}

interface UserInfo {
  user: {
    name: string;
    gender: string;
    gradeNumber: number;
    univGroupNumber: number;
  };
  userRetreatRegistration: {
    id: number;
    gbsNumber?: string;
    dormitoryLocation?: string;
  };
  userRetreatShuttleBusRegistration: {
    id: number;
  };
  retreatScheduleIds: number[];
  shuttleBusScheduleIds: number[];
}

interface ShuttleCheckTableProps {
  retreatSlug: string;
}

export function ShuttleCheckTable({ retreatSlug }: ShuttleCheckTableProps) {
  const qrInputRef = useRef<HTMLTextAreaElement>(null);
  const { add: addToast } = useToastStore();

  const showToast = (
    description: string,
    variant: "success" | "warning" | "destructive"
  ) => {
    addToast({
      title:
        variant === "success"
          ? "성공"
          : variant === "warning"
            ? "알림"
            : "오류",
      description,
      variant,
    });
  };

  const [shuttleBusSchedules, setShuttleBusSchedules] = useState<
    ShuttleBusSchedule[]
  >([]);
  const [retreatSchedules, setRetreatSchedules] = useState<
    TRetreatRegistrationSchedule[]
  >([]);
  const [shuttleBusSchedulesList, setShuttleBusSchedulesList] = useState<
    TRetreatShuttleBus[]
  >([]);
  const [selectedShuttleBusSchedule, setSelectedShuttleBusSchedule] =
    useState<string>("");
  const [shuttleBusStats, setShuttleBusStats] =
    useState<ShuttleBusStats | null>(null);
  const [qrInput, setQrInput] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddShuttleButton, setShowAddShuttleButton] = useState(false);
  const [shuttleConfirmed, setShuttleConfirmed] = useState(false);
  const [canAddShuttle, setCanAddShuttle] = useState(false);
  const [showAddShuttleModal, setShowAddShuttleModal] = useState(false);
  const [currentQrValue, setCurrentQrValue] = useState("");

  // textarea에 자동 focus 유지
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (qrInputRef.current && !isProcessing) {
        qrInputRef.current.focus();
      }
    }, 100);

    return () => clearInterval(focusInterval);
  }, [isProcessing]);

  // 페이지 로드 시 초기 focus
  useEffect(() => {
    if (qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, []);

  // 셔틀버스 일정 조회
  useEffect(() => {
    const fetchShuttleBusSchedules = async () => {
      try {
        const response = await webAxios.get(
          `/api/v1/retreat/${retreatSlug}/shuttle-bus/shuttle-schedules`
        );
        setShuttleBusSchedules(response.data.shuttleSchedules);
      } catch (error) {
        console.error("셔틀버스 일정 조회 실패:", error);
      }
    };

    fetchShuttleBusSchedules();
  }, [retreatSlug]);

  // 수양회 일정과 셔틀버스 일정 조회
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const [retreatResponse, busResponse] = await Promise.all([
          webAxios.get(`/api/v1/retreat/${retreatSlug}/info`),
          webAxios.get(`/api/v1/retreat/${retreatSlug}/shuttle-bus/info`),
        ]);

        setRetreatSchedules(retreatResponse.data.retreatInfo.schedule);
        const shuttleBusData =
          busResponse.data.shuttleBusInfo?.shuttleBuses ||
          busResponse.data.shuttleBusSchedules ||
          busResponse.data.shuttleBuses ||
          [];
        setShuttleBusSchedulesList(shuttleBusData);
      } catch (error) {
        console.error("일정 조회 실패:", error);
        setRetreatSchedules([]);
        setShuttleBusSchedulesList([]);
      }
    };

    fetchSchedules();
  }, [retreatSlug]);

  // 선택된 셔틀버스 일정 통계 조회
  useEffect(() => {
    if (selectedShuttleBusSchedule) {
      const fetchShuttleBusStats = async () => {
        try {
          const response = await webAxios.get(
            `/api/v1/retreat/${retreatSlug}/shuttle-bus/shuttle-stats/${selectedShuttleBusSchedule}`
          );
          setShuttleBusStats(response.data.stats);
        } catch (error) {
          console.error("셔틀버스 통계 조회 실패:", error);
        }
      };

      fetchShuttleBusStats();
    }
  }, [selectedShuttleBusSchedule, retreatSlug]);

  // QR 입력 처리 - 사용자 정보 조회 후 바로 셔틀버스 확인 처리
  const handleQrInput = async (qrValue: string) => {
    // 이미 처리 중이거나 확인 완료된 경우 중복 처리 방지
    if (isProcessing || shuttleConfirmed) {
      return;
    }

    if (!selectedShuttleBusSchedule) {
      showToast("먼저 셔틀버스를 선택해주세요.", "warning");
      return;
    }

    if (!qrValue.trim()) return;

    setIsProcessing(true);
    setLoading(true);
    setShowAddShuttleButton(false);
    setCurrentQrValue(qrValue); // 현재 QR 값 저장

    // 새로운 QR 입력 시 이전 사용자 정보 초기화
    setUserInfo(null);
    setShuttleConfirmed(false);
    setCanAddShuttle(false);

    try {
      // 1. user-info-by-qr 엔드포인트로 사용자 정보 조회
      const userResponse = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/user-info-by-qr`,
        {
          params: { qrUrl: qrValue },
        }
      );

      if (userResponse.data.userInfo) {
        const userData = userResponse.data.userInfo;
        setUserInfo(userData);

        // 2. 사용자 조회 성공 시 바로 셔틀버스 확인 처리
        try {
          const confirmResponse = await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/shuttle-bus/confirm-shuttle-schedule`,
            {
              userRetreatShuttleBusRegistrationId:
                userData.userRetreatShuttleBusRegistration.id,
              shuttleBusId: Number(selectedShuttleBusSchedule),
            }
          );

          showToast("셔틀버스가 성공적으로 확인되었습니다.", "success");
          setShuttleConfirmed(true);

          // 통계 업데이트
          const statsResponse = await webAxios.get(
            `/api/v1/retreat/${retreatSlug}/shuttle-bus/shuttle-stats/${selectedShuttleBusSchedule}`
          );
          setShuttleBusStats(statsResponse.data.stats);

          // 다음 스캔 준비 (사용자 정보는 유지)
          setTimeout(() => {
            setShuttleConfirmed(false);
            setShowAddShuttleButton(false);
            setCanAddShuttle(false);
            if (qrInputRef.current) {
              qrInputRef.current.focus();
            }
          }, 500); // 0.5초로 단축
        } catch (confirmError: any) {
          console.error("Error confirming shuttle:", confirmError);
          const errorMessage =
            confirmError?.response?.data?.message ||
            "셔틀버스 확인 중 오류가 발생했습니다.";

          // 신청하지 않은 셔틀버스인 경우 셔틀버스 추가 버튼 활성화
          if (errorMessage.includes("신청하지 않은 셔틀버스")) {
            setCanAddShuttle(true);
            showToast(
              "해당 셔틀버스를 신청하지 않았습니다. 셔틀버스를 추가할 수 있습니다.",
              "destructive"
            );
          } else {
            showToast(errorMessage, "destructive");
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching user info:", error);
      showToast(
        error?.response?.data?.message ||
          "사용자 정보를 가져오는 중 오류가 발생했습니다.",
        "destructive"
      );
      setUserInfo(null);
      setShowAddShuttleButton(false);

      // 에러 발생 시에도 다음 스캔 준비 (사용자 정보는 유지, 셔틀버스 추가 가능한 경우는 제외)
      if (!canAddShuttle) {
        setTimeout(() => {
          setShuttleConfirmed(false);
          if (qrInputRef.current) {
            qrInputRef.current.focus();
          }
        }, 500); // 0.5초로 단축
      }
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // 처리 중이거나 이미 확인된 경우 추가 처리 방지
      if (!isProcessing && !shuttleConfirmed) {
        handleQrInput(qrInput);
        // Enter 입력 시 즉시 필드 비우기
        setQrInput("");
      }
    }
  };

  // QR 입력 변경 처리 (처리 중일 때는 입력 방지)
  const handleQrInputChange = (value: string) => {
    if (!isProcessing) {
      setQrInput(value);
    }
  };

  // 셔틀버스 추가 버튼 클릭
  const handleAddShuttleClick = () => {
    setShowAddShuttleModal(true);
  };

  // 셔틀버스 추가 확인
  const handleConfirmAddShuttle = async () => {
    if (!userInfo || !selectedShuttleBusSchedule) return;

    try {
      setIsProcessing(true);
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/add-shuttle-schedule`,
        {
          userRetreatShuttleBusRegistrationId:
            userInfo.userRetreatShuttleBusRegistration.id,
          shuttleBusId: Number(selectedShuttleBusSchedule),
        }
      );

      showToast("셔틀버스 일정이 성공적으로 추가되었습니다.", "success");
      setShowAddShuttleModal(false);
      setCanAddShuttle(false);

      // 업데이트된 사용자 정보 다시 조회
      const userResponse = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/user-info-by-qr`,
        {
          params: { qrUrl: currentQrValue },
        }
      );

      if (userResponse.data.userInfo) {
        setUserInfo(userResponse.data.userInfo);
      }

      // 셔틀버스 확인 재시도
      try {
        const confirmResponse = await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/shuttle-bus/confirm-shuttle-schedule`,
          {
            userRetreatShuttleBusRegistrationId:
              userInfo.userRetreatShuttleBusRegistration.id,
            shuttleBusId: Number(selectedShuttleBusSchedule),
          }
        );

        setShuttleConfirmed(true);
        showToast("셔틀버스가 성공적으로 확인되었습니다.", "success");
      } catch (confirmError) {
        console.error("Error confirming shuttle after adding:", confirmError);
        // 추가 후 확인 실패는 에러로 처리하지 않음 (이미 추가는 성공했으므로)
      }

      // 통계 업데이트
      const statsResponse = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/shuttle-stats/${selectedShuttleBusSchedule}`
      );
      setShuttleBusStats(statsResponse.data.stats);

      // 상태 초기화 (사용자 정보는 유지)
      setTimeout(() => {
        setShuttleConfirmed(false);
        setShowAddShuttleButton(false);
        setCanAddShuttle(false);
        if (qrInputRef.current) {
          qrInputRef.current.focus();
        }
      }, 500);
    } catch (error: any) {
      console.error("Error adding shuttle schedule:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "셔틀버스 일정 추가 중 오류가 발생했습니다.";
      showToast(errorMessage, "destructive");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDirection = (direction: string) => {
    switch (direction) {
      case "FROM_CHURCH_TO_RETREAT":
        return "가는길";
      case "FROM_RETREAT_TO_CHURCH":
        return "오는길";
      default:
        return direction;
    }
  };

  const getFullDayName = (dateInput: string | Date) => {
    const days = [
      "일요일",
      "월요일",
      "화요일",
      "수요일",
      "목요일",
      "금요일",
      "토요일",
    ];
    // KST 기준 요일 사용
    return days[getKSTDay(dateInput)];
  };

  const formatShuttleBusSchedule = (schedule: ShuttleBusSchedule) => {
    // KST 기준 날짜/시간 사용
    const month = getKSTMonth(schedule.departureTime) + 1;
    const day = getKSTDate(schedule.departureTime);
    const hour = getKSTHours(schedule.departureTime);
    const minute = getKSTMinutes(schedule.departureTime);

    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const timeString = `${displayHour}:${minute.toString().padStart(2, "0")}`;

    // 전체 설명 (수요일 가는길)
    const dayName = getFullDayName(schedule.departureTime);
    const directionName = formatDirection(schedule.direction);
    const fullDescription = `${dayName} ${directionName}`;

    return `${schedule.name}(${fullDescription}) - ${month}/${day} ${period} ${timeString}`;
  };

  // 수양회 일정 컬럼 생성
  const retreatScheduleColumns = generateScheduleColumns(retreatSchedules);

  // 셔틀버스 일정 컬럼 생성
  const busScheduleColumns = generateShuttleBusScheduleColumns(
    shuttleBusSchedulesList
  );

  // 스캔 가능 상태 계산
  const canScan =
    !isProcessing && !shuttleConfirmed && selectedShuttleBusSchedule;

  return (
    <div className="space-y-6">
      {/* 스캔 상태 표시 */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div
            className={`text-center p-3 rounded-lg font-medium ${
              canScan
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {canScan ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>🟢 스캔 가능 - QR 코드를 입력해주세요</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>
                  🔴 스캔 불가능 -
                  {!selectedShuttleBusSchedule
                    ? " 셔틀버스를 선택해주세요"
                    : isProcessing
                      ? " 처리 중입니다"
                      : shuttleConfirmed
                        ? " 처리 완료"
                        : " 대기 중"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽 컬럼 */}
        <div className="space-y-6">
          {/* 셔틀버스 선택 */}
          <Card>
            <CardHeader>
              <CardTitle>셔틀버스 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedShuttleBusSchedule}
                onValueChange={setSelectedShuttleBusSchedule}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="셔틀버스를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {shuttleBusSchedules.map(schedule => (
                    <SelectItem
                      key={schedule.id}
                      value={schedule.id.toString()}
                    >
                      {formatShuttleBusSchedule(schedule)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 셔틀버스 현황 */}
          {shuttleBusStats && (
            <Card>
              <CardHeader>
                <CardTitle>셔틀버스 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>확인률</span>
                    <span>{shuttleBusStats.confirmedRate}%</span>
                  </div>
                  <Progress
                    value={shuttleBusStats.confirmedRate}
                    className="h-2"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>확인: {shuttleBusStats.totalConfirmed}명</span>
                  <span>전체: {shuttleBusStats.totalRegistered}명</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR 입력 */}
          <Card>
            <CardHeader>
              <CardTitle>QR 코드 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="qr-input">QR 코드</Label>
                <Textarea
                  ref={qrInputRef}
                  id="qr-input"
                  placeholder={
                    isProcessing
                      ? "처리 중..."
                      : "QR 코드를 입력하고 Enter를 눌러주세요"
                  }
                  value={qrInput}
                  onChange={e => handleQrInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[100px]"
                  disabled={isProcessing}
                />
              </div>

              {/* 처리 상태 표시 */}
              {isProcessing && (
                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-700 font-medium">
                    🔄 QR 코드 처리 중...
                  </p>
                </div>
              )}

              {/* 상태 표시 */}
              {userInfo && !isProcessing && (
                <div className="space-y-2">
                  {/* 이미 확인된 경우 - 상태 표시 */}
                  {shuttleConfirmed && (
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-700 font-medium">
                        ✅ 셔틀버스 확인 완료
                      </p>
                      <p className="text-green-600 text-sm mt-1">
                        잠시 후 자동으로 다음 스캔을 준비합니다...
                      </p>
                    </div>
                  )}

                  {/* 셔틀버스 추가 버튼 - 항상 표시 */}
                  <Button
                    onClick={handleAddShuttleClick}
                    className="w-full"
                    variant={canAddShuttle ? "default" : "outline"}
                    disabled={!canAddShuttle || isProcessing}
                  >
                    셔틀버스 추가하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽 컬럼 - 사용자 정보 */}
        <div className="space-y-6">
          {/* 사용자 정보 카드 - 항상 표시 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userInfo ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">이름</Label>
                      <p className="font-medium">{userInfo.user.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">성별</Label>
                      <div className="mt-1">
                        <GenderBadge gender={userInfo.user.gender as any} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">학년</Label>
                      <p className="font-medium">
                        {userInfo.user.gradeNumber}학년
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">부서</Label>
                      <p className="font-medium">
                        {userInfo.user.univGroupNumber}부
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">GBS 번호</Label>
                      <p className="font-medium">
                        {userInfo.userRetreatRegistration.gbsNumber || "미배정"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">숙소</Label>
                      <p className="font-medium">
                        {userInfo.userRetreatRegistration.dormitoryLocation ||
                          "미배정"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">이름</Label>
                      <p className="font-medium text-gray-400">-</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">성별</Label>
                      <p className="font-medium text-gray-400">-</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">학년</Label>
                      <p className="font-medium text-gray-400">-</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">부서</Label>
                      <p className="font-medium text-gray-400">-</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">GBS 번호</Label>
                      <p className="font-medium text-gray-400">-</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">숙소</Label>
                      <p className="font-medium text-gray-400">-</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 수양회 신청 일정 카드 - 항상 표시 */}
          <Card>
            <CardHeader>
              <CardTitle>수양회 신청 일정</CardTitle>
            </CardHeader>
            <CardContent>
              {retreatScheduleColumns.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead
                          colSpan={retreatScheduleColumns.length}
                          className="text-center text-sm"
                        >
                          수양회 신청 일정
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        {retreatScheduleColumns.map((scheduleCol: any) => (
                          <TableHead
                            key={scheduleCol.key}
                            className="p-2 text-center text-xs"
                          >
                            {scheduleCol.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {retreatScheduleColumns.map((col: any) => (
                          <TableCell key={col.key} className="p-2 text-center">
                            <Checkbox
                              checked={
                                userInfo
                                  ? userInfo.retreatScheduleIds.includes(col.id)
                                  : false
                              }
                              disabled
                              className={
                                userInfo &&
                                userInfo.retreatScheduleIds.includes(col.id)
                                  ? col.bgColorClass
                                  : ""
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 border rounded-md">
                  <p className="text-sm text-gray-500">
                    수양회 일정 정보를 불러오는 중...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 셔틀버스 신청 일정 카드 - 항상 표시 */}
          <Card>
            <CardHeader>
              <CardTitle>셔틀버스 신청</CardTitle>
            </CardHeader>
            <CardContent>
              {busScheduleColumns.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead
                          colSpan={busScheduleColumns.length}
                          className="text-center text-sm"
                        >
                          셔틀버스 신청 일정
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        {busScheduleColumns.map((scheduleCol: any) => (
                          <TableHead
                            key={scheduleCol.key}
                            className="p-2 text-center text-xs"
                          >
                            {scheduleCol.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {busScheduleColumns.map((col: any) => (
                          <TableCell key={col.key} className="p-2 text-center">
                            <Checkbox
                              checked={
                                userInfo
                                  ? userInfo.shuttleBusScheduleIds.includes(
                                      col.id
                                    )
                                  : false
                              }
                              disabled
                              className={
                                userInfo &&
                                userInfo.shuttleBusScheduleIds.includes(col.id)
                                  ? col.bgColorClass
                                  : ""
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 border rounded-md">
                  <p className="text-sm text-gray-500">
                    셔틀버스 일정 정보를 불러오는 중...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 셔틀버스 추가 확인 모달 */}
      {showAddShuttleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              셔틀버스 일정 추가 확인
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                <strong>{userInfo?.user.name}</strong>님에게 다음 셔틀버스
                일정을 추가하시겠습니까?
              </p>
              {selectedShuttleBusSchedule && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="font-medium text-blue-800">
                    {formatShuttleBusSchedule(
                      shuttleBusSchedules.find(
                        s => s.id.toString() === selectedShuttleBusSchedule
                      )!
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAddShuttleModal(false)}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                취소
              </Button>
              <Button
                onClick={handleConfirmAddShuttle}
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? "추가 중..." : "확인"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
