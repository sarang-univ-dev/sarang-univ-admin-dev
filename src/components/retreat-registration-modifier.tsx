"use client";

import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  TRetreatUserRegistration,
  ReteratRegisterUserType,
  RetreatRegisterStatus,
  TRetreatRegisterSchedule,
} from "@/app/types";
import { getRegisterScheduleAlias } from "@/utils/getRetreatScheduleAlias";

interface Props {
  retreatUserRegistrations: TRetreatUserRegistration[];
  retreatRegisterSchedules: TRetreatRegisterSchedule[];
}

interface UserModification {
  type?: ReteratRegisterUserType | null;
  retreat_register_schedule_ids?: number[];
}

const getUserTypeDisplayText = (type?: ReteratRegisterUserType | null) => {
  switch (type) {
    case ReteratRegisterUserType.NEW_COMER:
      return "새가족";
    case ReteratRegisterUserType.SOLDIER:
      return "군지체";
    case ReteratRegisterUserType.STAFF:
      return "간사";
    default:
      return "-";
  }
};

const useUserModifications = () => {
  const [modifiedUsers, setModifiedUsers] = useState<
    Record<number, UserModification>
  >({});
  const [editableRows, setEditableRows] = useState<Record<number, boolean>>({});

  const updateUserType = useCallback(
    (
      userId: number,
      newType: ReteratRegisterUserType | undefined,
      originalType?: ReteratRegisterUserType
    ) => {
      setModifiedUsers(prev => {
        if (originalType === newType) {
          const { type, ...rest } = prev[userId] || {};
          return Object.keys(rest).length
            ? { ...prev, [userId]: rest }
            : { ...prev, [userId]: {} };
        }
        return {
          ...prev,
          [userId]: {
            ...prev[userId],
            type: newType === undefined ? null : newType,
          },
        };
      });
    },
    []
  );

  const updateUserSchedule = useCallback(
    (
      userId: number,
      scheduleId: number,
      checked: boolean,
      originalSchedules: number[],
      originalType?: ReteratRegisterUserType
    ) => {
      setModifiedUsers(prev => {
        const currentSchedules =
          prev[userId]?.retreat_register_schedule_ids || originalSchedules;
        const newSchedules = checked
          ? [...currentSchedules, scheduleId]
          : currentSchedules.filter(id => id !== scheduleId);

        const isScheduleChanged =
          JSON.stringify([...newSchedules].sort()) !==
          JSON.stringify([...originalSchedules].sort());

        if (!isScheduleChanged) {
          const { retreat_register_schedule_ids, ...rest } = prev[userId] || {};
          return Object.keys(rest).length ? { ...prev, [userId]: rest } : prev;
        }

        return {
          ...prev,
          [userId]: {
            ...prev[userId],
            retreat_register_schedule_ids: newSchedules,
            type: prev[userId]?.type || originalType,
          },
        };
      });
    },
    []
  );

  const toggleEditing = useCallback((userId: number) => {
    setEditableRows(prev => ({ ...prev, [userId]: !prev[userId] }));
  }, []);

  const resetModifications = useCallback((userId: number) => {
    setModifiedUsers(prev => {
      const { [userId]: _, ...rest } = prev;
      return rest;
    });
    setEditableRows(prev => ({ ...prev, [userId]: false }));
  }, []);

  const isModified = useCallback(
    (userId: number) => {
      return (
        !!modifiedUsers[userId] && Object.keys(modifiedUsers[userId]).length > 0
      );
    },
    [modifiedUsers]
  );

  return {
    modifiedUsers,
    editableRows,
    updateUserType,
    updateUserSchedule,
    toggleEditing,
    resetModifications,
    isModified,
    setModifiedUsers,
    setEditableRows,
  };
};

const useSearch = (retreatUserRegistrations: TRetreatUserRegistration[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    TRetreatUserRegistration[]
  >([]);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      const trimmedTerm = term.trim().toLowerCase();
      if (!trimmedTerm) {
        setSearchResults([]);
        return;
      }
      const results = retreatUserRegistrations.filter(user =>
        user.name.toLowerCase().includes(trimmedTerm)
      );
      setSearchResults(results);
    }, 300),
    [retreatUserRegistrations]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  return { searchTerm, setSearchTerm, searchResults };
};

export function RetreatRegistrationModifierComponent({
  retreatUserRegistrations,
  retreatRegisterSchedules,
}: Props) {
  const {
    modifiedUsers,
    editableRows,
    updateUserType,
    updateUserSchedule,
    toggleEditing,
    resetModifications,
    isModified,
    setModifiedUsers,
    setEditableRows,
  } = useUserModifications();

  const { searchTerm, setSearchTerm, searchResults } = useSearch(
    retreatUserRegistrations
  );

  const handleUserTypeChange = (
    userId: number,
    newType: ReteratRegisterUserType | undefined
  ) => {
    const originalUser = searchResults.find(user => user.id === userId);
    updateUserType(userId, newType, originalUser?.type);
  };

  const handleScheduleChange = (
    userId: number,
    scheduleId: number,
    checked: boolean
  ) => {
    const originalUser = searchResults.find(user => user.id === userId);
    if (!originalUser) return;

    updateUserSchedule(
      userId,
      scheduleId,
      checked,
      originalUser.retreat_register_schedule_ids,
      originalUser.type
    );
  };

  const handleSubmit = async (userId: number) => {
    const modifications = modifiedUsers[userId];
    if ("type" in modifications) {
      await mockUpdateUserType(userId, modifications.type ?? undefined);
    }
    if (modifications.retreat_register_schedule_ids) {
      await mockUpdateUserSchedule(
        userId,
        modifications.retreat_register_schedule_ids
      );
    }
    resetModifications(userId);
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setModifiedUsers({});
      setEditableRows({});
    }
  }, [searchTerm, setModifiedUsers, setEditableRows]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">등록 정보 수정</h1>
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="이름을 입력하여 등록 정보를 조회하세요"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      {searchResults.length > 0 && (
        <Table className="whitespace-nowrap text-center">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">이름</TableHead>
              <TableHead className="text-center">사용자 구분</TableHead>
              {retreatRegisterSchedules.map(schedule => (
                <TableHead key={schedule.id} className="text-center">
                  {getRegisterScheduleAlias(schedule.date, schedule.type)}
                </TableHead>
              ))}
              <TableHead className="text-center">Actions</TableHead>
              <TableHead className="text-center">현재 금액</TableHead>
              {Object.keys(modifiedUsers).length > 0 && (
                <TableHead className="text-center">수정 금액</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.map(user => (
              <TableRow key={user.id}>
                <TableCell className="text-center">{user.name}</TableCell>
                <TableCell className="text-center">
                  {getUserTypeDisplayText(
                    modifiedUsers[user.id]?.type !== undefined
                      ? modifiedUsers[user.id]?.type
                      : user.type
                  )}
                </TableCell>
                {retreatRegisterSchedules.map(schedule => (
                  <TableCell key={schedule.id} className="text-center">
                    <Checkbox
                      checked={
                        modifiedUsers[
                          user.id
                        ]?.retreat_register_schedule_ids?.includes(
                          schedule.id
                        ) ??
                        user.retreat_register_schedule_ids.includes(schedule.id)
                      }
                      onCheckedChange={checked =>
                        handleScheduleChange(
                          user.id,
                          schedule.id,
                          checked as boolean
                        )
                      }
                      disabled={!editableRows[user.id]}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {(modifiedUsers[user.id]?.type ?? user.type) ===
                        ReteratRegisterUserType.NEW_COMER ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.SOLDIER
                                )
                              }
                            >
                              군지체로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.STAFF
                                )
                              }
                            >
                              간사로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(user.id, undefined)
                              }
                            >
                              새가족 해제하기
                            </DropdownMenuItem>
                          </>
                        ) : (modifiedUsers[user.id]?.type ?? user.type) ===
                          ReteratRegisterUserType.SOLDIER ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.NEW_COMER
                                )
                              }
                            >
                              새가족으로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.STAFF
                                )
                              }
                            >
                              간사로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(user.id, undefined)
                              }
                            >
                              군지체 해제하기
                            </DropdownMenuItem>
                          </>
                        ) : (modifiedUsers[user.id]?.type ?? user.type) ===
                          ReteratRegisterUserType.STAFF ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.NEW_COMER
                                )
                              }
                            >
                              새가족으로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.SOLDIER
                                )
                              }
                            >
                              군지체로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(user.id, undefined)
                              }
                            >
                              간사 해제하기
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.NEW_COMER
                                )
                              }
                            >
                              새가족으로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.SOLDIER
                                )
                              }
                            >
                              군지체로 배정하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  ReteratRegisterUserType.STAFF
                                )
                              }
                            >
                              간사로 배정하기
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => toggleEditing(user.id)}
                        >
                          {editableRows[user.id]
                            ? "수정 완료"
                            : "일정 수정하기"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {isModified(user.id) && (
                      <Button
                        onClick={() => resetModifications(user.id)}
                        variant="destructive"
                        size="sm"
                      >
                        변경 취소
                      </Button>
                    )}
                    <Button
                      onClick={() => handleSubmit(user.id)}
                      disabled={!isModified(user.id)}
                      variant={isModified(user.id) ? "default" : "secondary"}
                    >
                      제출하기
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {user.price.toLocaleString()}원
                </TableCell>
                {Object.keys(modifiedUsers).length > 0 && (
                  <TableCell
                    className={`text-center ${
                      isModified(user.id)
                        ? "text-blue-600 font-bold"
                        : "text-gray-400"
                    }`}
                  >
                    {isModified(user.id)
                      ? `${user.price.toLocaleString()}원`
                      : "-"}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {searchTerm.trim() !== "" && searchResults.length === 0 && (
        <p className="mt-4 text-center">
          "{searchTerm}"에 대한 검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}

const mockUpdateUserType = async (
  userId: number,
  newType: ReteratRegisterUserType | undefined
) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Updated user ${userId} to type ${newType}`);
};

const mockUpdateUserSchedule = async (
  userId: number,
  newSchedule: number[]
) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Updated user ${userId} schedule:`, newSchedule);
};
