"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { User, Calendar } from "lucide-react";
import { getKSTDay, getKSTMonth, getKSTDate } from "@/lib/utils/date-utils";

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

type ScheduleTypeMap = { [key in ScheduleType]: string };

type DraggableUserCardComponentProps = {
  data: UserData;
  index: number;
  registerSchedules: RegisterSchedule[];
  scheduleTypeMap: ScheduleTypeMap;
};

export function DraggableUserCardComponent({
  data,
  index,
  registerSchedules,
  scheduleTypeMap,
}: DraggableUserCardComponentProps) {
  const { user, register_schedule, memo } = data;
  const userInfo = `${user.univ_group_number}부 ${
    user.gender === "male" ? "남" : "여"
  }${user.grade_number} ${user.name}`;

  const isFullyRegistered =
    register_schedule.length === registerSchedules.length &&
    register_schedule.every(id => registerSchedules.some(s => s.id === id));

  const userSchedules = registerSchedules.filter(s =>
    register_schedule.includes(s.id)
  );

  const formatDate = (dateString: string) => {
    // KST 기준 날짜 사용
    const dayName = ["일", "월", "화", "수", "목", "금", "토"][getKSTDay(dateString)];
    return {
      formatted: `${getKSTMonth(dateString) + 1}/${getKSTDate(dateString)}(${dayName})`,
      dayName,
      date: dateString.split("T")[0],
    };
  };

  const getScheduleText = (types: ScheduleType[], dayName: string) => {
    return types.map(type => `${dayName}${scheduleTypeMap[type]}`).join(", ");
  };

  const groupedSchedules = userSchedules.reduce(
    (acc, schedule) => {
      const { formatted, dayName, date } = formatDate(schedule.date);
      if (!acc[date]) {
        acc[date] = { formatted, dayName, types: [] as ScheduleType[] };
      }
      acc[date].types.push(schedule.type);
      return acc;
    },
    {} as {
      [key: string]: {
        formatted: string;
        dayName: string;
        types: ScheduleType[];
      };
    }
  );

  return (
    <Draggable draggableId={user.id.toString()} index={index}>
      {(provided, snapshot) => {
        // Determine background color with priority: dragging > fully registered
        let backgroundColorClass = "";
        if (snapshot.isDragging) {
          backgroundColorClass = "bg-gray-200"; // Dragging takes precedence
        } else if (isFullyRegistered) {
          backgroundColorClass = "bg-green-100"; // Fully registered
        }

        // Determine border color if memo.note exists
        const borderColorClass = memo.note ? "border-2 border-indigo-500" : "";

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="w-64 mb-4 cursor-move"
          >
            <Card
              className={`hover:shadow-md transition-shadow duration-200 ${backgroundColorClass} ${borderColorClass}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{userInfo}</h3>
                  {memo.type && (
                    <Badge className={`${getBadgeColor(memo.type)} text-white`}>
                      {memo.type}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>일정: {isFullyRegistered ? "전참" : ""}</span>
                  </div>
                  {!isFullyRegistered && (
                    <Table>
                      <TableBody>
                        {Object.entries(groupedSchedules).map(
                          ([date, { formatted, dayName, types }]) => (
                            <TableRow key={date}>
                              <TableCell className="py-1 px-2">
                                {formatted}
                              </TableCell>
                              <TableCell className="py-1 px-2">
                                {getScheduleText(types, dayName)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  )}
                  {memo.note && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>메모: {memo.note}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }}
    </Draggable>
  );
}

const getBadgeColor = (type: UserData["memo"]["type"]) => {
  switch (type) {
    case "간사":
      return "bg-blue-500";
    case "새가족":
      return "bg-green-500";
    case "군지체":
      return "bg-yellow-500";
    case "리더":
      return "bg-purple-500";
    case "헬퍼":
      return "bg-pink-500";
    case "SC":
      return "bg-indigo-500";
    default:
      return "bg-gray-500";
  }
};
