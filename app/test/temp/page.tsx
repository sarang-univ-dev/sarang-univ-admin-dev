"use client";

import { useState, useMemo } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { DraggableUserCardComponent } from "../../../components/temp/draggable-user-card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ScheduleType = "BREAKFAST" | "LUNCH" | "DINNER" | "SLEEP";

type UserData = {
  user: {
    id: number;
    name: string;
    univ_group_number: number;
    grade_number: number;
    gender: "male" | "female";
  };
  register_schedule: number[];
  memo: {
    type: "간사" | "새가족" | "군지체" | "리더" | "헬퍼" | "SC" | null;
    note: string | null;
  };
};

type RegisterSchedule = {
  id: number;
  date: string;
  type: ScheduleType;
};

const scheduleTypeMap: { [key in ScheduleType]: string } = {
  BREAKFAST: "아", // 아침
  LUNCH: "점", // 점심
  DINNER: "저", // 저녁
  SLEEP: "숙" // 숙박
};

export default function DraggableUserCardDemo() {
  const [mockUsers, setMockUsers] = useState<UserData[]>([
    // 기존 사용자들
    {
      user: {
        id: 1,
        name: "김철수",
        univ_group_number: 3,
        grade_number: 2,
        gender: "male"
      },
      register_schedule: [1, 2, 3, 4],
      memo: {
        type: "간사",
        note: "형제 리더로 라인업"
      }
    },
    {
      user: {
        id: 2,
        name: "이영희",
        univ_group_number: 5,
        grade_number: 3,
        gender: "female"
      },
      register_schedule: [5, 6],
      memo: {
        type: "새가족",
        note: "첫 참석, 환영 필요"
      }
    },
    {
      user: {
        id: 3,
        name: "박민수",
        univ_group_number: 1,
        grade_number: 4,
        gender: "male"
      },
      register_schedule: [7, 8, 9, 10],
      memo: {
        type: "군지체",
        note: "6개월 후 전역 예정"
      }
    },
    {
      user: {
        id: 4,
        name: "최지은",
        univ_group_number: 2,
        grade_number: 1,
        gender: "female"
      },
      register_schedule: [],
      memo: {
        type: "새가족",
        note: "신규 회원, 활동적"
      }
    },
    {
      user: {
        id: 5,
        name: "한성호",
        univ_group_number: 4,
        grade_number: 3,
        gender: "male"
      },
      register_schedule: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      memo: {
        type: "간사",
        note: "활동가, 팀 관리 담당"
      }
    },
    // 추가 사용자들
    {
      user: {
        id: 6,
        name: "오은지",
        univ_group_number: 6,
        grade_number: 2,
        gender: "female"
      },
      register_schedule: [1, 5, 9],
      memo: {
        type: null,
        note: "특별 행사 준비 중"
      }
    },
    {
      user: {
        id: 7,
        name: "장민호",
        univ_group_number: 2,
        grade_number: 3,
        gender: "male"
      },
      register_schedule: [2, 6, 10],
      memo: {
        type: "군지체",
        note: null
      }
    },
    {
      user: {
        id: 8,
        name: "서지수",
        univ_group_number: 1,
        grade_number: 1,
        gender: "female"
      },
      register_schedule: [3, 7, 11],
      memo: {
        type: null,
        note: null
      }
    },
    {
      user: {
        id: 9,
        name: "김하늘",
        univ_group_number: 4,
        grade_number: 2,
        gender: "male"
      },
      register_schedule: [],
      memo: {
        type: null,
        note: "연습 중"
      }
    },
    {
      user: {
        id: 10,
        name: "박소연",
        univ_group_number: 3,
        grade_number: 4,
        gender: "female"
      },
      register_schedule: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      memo: {
        type: "간사",
        note: null
      }
    },
    // 새로운 memo.type을 사용하는 사용자들
    {
      user: {
        id: 11,
        name: "정유진",
        univ_group_number: 3,
        grade_number: 2,
        gender: "female"
      },
      register_schedule: [4, 8, 12],
      memo: {
        type: "리더",
        note: "팀 리더 역할 수행 중"
      }
    },
    {
      user: {
        id: 12,
        name: "홍길동",
        univ_group_number: 2,
        grade_number: 1,
        gender: "male"
      },
      register_schedule: [5, 9, 13],
      memo: {
        type: "헬퍼",
        note: "지원 업무 담당"
      }
    },
    {
      user: {
        id: 13,
        name: "이민아",
        univ_group_number: 4,
        grade_number: 3,
        gender: "female"
      },
      register_schedule: [6, 10, 14],
      memo: {
        type: "SC",
        note: "특별 협력자"
      }
    }
  ]);

  const [mockRegisterSchedules] = useState<RegisterSchedule[]>([
    { id: 1, date: "2024-10-23T00:00:00", type: "BREAKFAST" },
    { id: 2, date: "2024-10-23T00:00:00", type: "LUNCH" },
    { id: 3, date: "2024-10-23T00:00:00", type: "DINNER" },
    { id: 4, date: "2024-10-23T00:00:00", type: "SLEEP" },
    { id: 5, date: "2024-10-24T00:00:00", type: "BREAKFAST" },
    { id: 6, date: "2024-10-24T00:00:00", type: "DINNER" },
    { id: 7, date: "2024-10-25T00:00:00", type: "LUNCH" },
    { id: 8, date: "2024-10-25T00:00:00", type: "SLEEP" },
    { id: 9, date: "2024-10-26T00:00:00", type: "BREAKFAST" },
    { id: 10, date: "2024-10-26T00:00:00", type: "DINNER" },
    { id: 11, date: "2024-10-27T00:00:00", type: "LUNCH" },
    { id: 12, date: "2024-10-27T00:00:00", type: "SLEEP" },
    { id: 13, date: "2024-10-28T00:00:00", type: "BREAKFAST" },
    { id: 14, date: "2024-10-28T00:00:00", type: "DINNER" },
    { id: 15, date: "2024-10-28T00:00:00", type: "SLEEP" }
  ]);

  // 상태: 선택된 부서 및 메모 타입
  const [selectedDepartment, setSelectedDepartment] = useState<number | "ALL">(
    "ALL"
  );
  const [selectedMemoType, setSelectedMemoType] = useState<string | "ALL">(
    "ALL"
  );

  // 동적 필터 옵션 생성
  const departments = useMemo(() => {
    const deptSet = new Set<number>();
    mockUsers.forEach((user) => deptSet.add(user.user.univ_group_number));
    return Array.from(deptSet).sort((a, b) => a - b);
  }, [mockUsers]);

  const memoTypes = useMemo(() => {
    const memoSet = new Set<string>();
    mockUsers.forEach((user) => {
      if (user.memo.type) {
        memoSet.add(user.memo.type);
      }
    });
    return Array.from(memoSet).sort();
  }, [mockUsers]);

  // 필터링된 사용자 목록
  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const departmentMatch =
        selectedDepartment === "ALL" ||
        user.user.univ_group_number === selectedDepartment;
      const memoTypeMatch =
        selectedMemoType === "ALL" || user.memo.type === selectedMemoType;
      return departmentMatch && memoTypeMatch;
    });
  }, [mockUsers, selectedDepartment, selectedMemoType]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Get the user being moved
    const movedUser = filteredUsers[source.index];

    // Create a new array for mockUsers
    const newUsers = Array.from(mockUsers);

    // Remove the moved user from its original position
    const originalIndex = newUsers.findIndex(
      (user) => user.user.id === movedUser.user.id
    );
    newUsers.splice(originalIndex, 1);

    // Determine the new index in mockUsers
    let newIndex: number;
    if (destination.index === 0) {
      newIndex = 0;
    } else if (destination.index >= filteredUsers.length) {
      newIndex = newUsers.length;
    } else {
      const destinationUser = filteredUsers[destination.index];
      newIndex = newUsers.findIndex(
        (user) => user.user.id === destinationUser.user.id
      );
      newIndex = newIndex === -1 ? newUsers.length : newIndex;
    }

    // Insert the moved user at the new position
    newUsers.splice(newIndex, 0, movedUser);

    setMockUsers(newUsers);
  };

  // 리셋 필터 함수
  const resetFilters = () => {
    setSelectedDepartment("ALL");
    setSelectedMemoType("ALL");
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">사용자 카드 목록</h1>
      {/* 필터 섹션 */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* 부서 필터 */}
        <div className="flex flex-col">
          <Label htmlFor="department-select" className="mb-2">
            부서 선택
          </Label>
          <Select
            value={
              selectedDepartment === "ALL"
                ? "ALL"
                : selectedDepartment.toString()
            }
            onValueChange={(value: string) =>
              setSelectedDepartment(value === "ALL" ? "ALL" : Number(value))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="모든 부서" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">모든 부서</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept.toString()}>
                  {dept}부
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Memo Type 필터 */}
        <div className="flex flex-col">
          <Label htmlFor="memo-type-select" className="mb-2">
            메모 유형 선택
          </Label>
          <Select
            value={selectedMemoType === "ALL" ? "ALL" : selectedMemoType}
            onValueChange={(value: string) =>
              setSelectedMemoType(value === "ALL" ? "ALL" : value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="모든 메모 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">모든 메모 유형</SelectItem>
              {memoTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 필터 리셋 버튼 */}
        <div className="flex items-end">
          <Button variant="outline" onClick={resetFilters}>
            필터 리셋
          </Button>
        </div>
      </div>

      {/* 드래그 앤 드롭 컨텍스트 */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="user-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {filteredUsers.map((user, index) => (
                <DraggableUserCardComponent
                  key={user.user.id}
                  data={user}
                  index={index}
                  scheduleTypeMap={scheduleTypeMap}
                  registerSchedules={mockRegisterSchedules}
                />
              ))}
              {provided.placeholder}
              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500">
                  조건에 맞는 사용자가 없습니다.
                </p>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
