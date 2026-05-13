"use client";

import { ArrowUp, Plus, Save } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createGrade,
  promoteUnivGroupGrades,
  updateGrade,
} from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type {
  AdminGrade,
  AdminUnivGroupWithGrades,
} from "@/types/retreat-create";

type GradeManagementClientProps = {
  initialUnivGroups: AdminUnivGroupWithGrades[];
};

type GradeDraft = {
  name: string;
  number: number;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data
  ) {
    return String(error.response.data.message);
  }

  return "학년 정보를 저장하지 못했습니다.";
}

export default function GradeManagementClient({
  initialUnivGroups,
}: GradeManagementClientProps) {
  const addToast = useToastStore(state => state.add);
  const [univGroups, setUnivGroups] = useState(initialUnivGroups);
  const [savedGrades, setSavedGrades] = useState<Record<number, AdminGrade>>(
    () =>
      initialUnivGroups.reduce<Record<number, AdminGrade>>((grades, group) => {
        group.grades.forEach(grade => {
          grades[grade.id] = grade;
        });

        return grades;
      }, {})
  );
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({});
  const [savingGradeIds, setSavingGradeIds] = useState<number[]>([]);
  const [creatingGroupIds, setCreatingGroupIds] = useState<number[]>([]);
  const [promotingGroupIds, setPromotingGroupIds] = useState<number[]>([]);

  const updateLocalGrade = (grade: AdminGrade) => {
    setUnivGroups(current =>
      current.map(group =>
        group.id === grade.univGroupId
          ? {
              ...group,
              grades: group.grades
                .map(item => (item.id === grade.id ? grade : item))
                .sort((a, b) => a.number - b.number),
            }
          : group
      )
    );
  };

  const appendLocalGrade = (grade: AdminGrade) => {
    setUnivGroups(current =>
      current.map(group =>
        group.id === grade.univGroupId
          ? {
              ...group,
              grades: [...group.grades, grade].sort(
                (a, b) => a.number - b.number
              ),
            }
          : group
      )
    );
  };

  const promoteGroupGrades = async (univGroupId: number) => {
    setPromotingGroupIds(current => [...current, univGroupId]);

    try {
      const grades = await promoteUnivGroupGrades(univGroupId);
      setUnivGroups(current =>
        current.map(group =>
          group.id === univGroupId
            ? {
                ...group,
                grades,
              }
            : group
        )
      );
      setSavedGrades(current => {
        const next = { ...current };
        grades.forEach(grade => {
          next[grade.id] = grade;
        });

        return next;
      });
      addToast({
        title: "학년을 하나씩 올렸습니다.",
        description: "변경된 학년 번호를 서버에 저장했습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "학년 올리기 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPromotingGroupIds(current => current.filter(id => id !== univGroupId));
    }
  };

  const saveGrade = async (grade: AdminGrade) => {
    setSavingGradeIds(current => [...current, grade.id]);

    try {
      const updated = await updateGrade(grade.id, {
        name: grade.name,
        number: grade.number,
        isActive: grade.isActive,
      });
      updateLocalGrade(updated);
      setSavedGrades(current => ({
        ...current,
        [updated.id]: updated,
      }));
      addToast({
        title: "학년 정보를 저장했습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "학년 정보 저장 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingGradeIds(current => current.filter(id => id !== grade.id));
    }
  };

  const createGroupGrade = async (
    event: FormEvent<HTMLFormElement>,
    univGroupId: number
  ) => {
    event.preventDefault();
    const draft = drafts[univGroupId];

    if (!draft?.name || !draft.number) {
      addToast({
        title: "학년명과 학년을 입력해주세요.",
        variant: "warning",
      });
      return;
    }

    setCreatingGroupIds(current => [...current, univGroupId]);

    try {
      const grade = await createGrade(univGroupId, draft);
      appendLocalGrade(grade);
      setSavedGrades(current => ({
        ...current,
        [grade.id]: grade,
      }));
      setDrafts(current => ({
        ...current,
        [univGroupId]: { name: "", number: 1 },
      }));
      addToast({
        title: "학년을 추가했습니다.",
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "학년 추가 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCreatingGroupIds(current => current.filter(id => id !== univGroupId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">부서/학년 관리</h1>
        <p className="text-sm text-muted-foreground">
          모든 부서의 신청 가능 학년을 관리합니다. 삭제 대신 비활성화합니다.{" "}
          비활성화되는 경우 신청폼 학년 목록에서 나오지 않습니다.
        </p>
      </div>

      {univGroups.length === 0 ? (
        <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
          등록된 부서가 없습니다.
        </p>
      ) : (
        <Tabs defaultValue={univGroups[0].id.toString()} className="space-y-3">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max flex-wrap justify-start gap-1">
              {univGroups.map(group => (
                <TabsTrigger key={group.id} value={group.id.toString()}>
                  {group.number}부 {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {univGroups.map(group => {
            const draft = drafts[group.id] ?? { name: "", number: 1 };
            const isCreating = creatingGroupIds.includes(group.id);
            const isPromoting = promotingGroupIds.includes(group.id);

            return (
              <TabsContent
                key={group.id}
                value={group.id.toString()}
                className="mt-0"
              >
                <Card>
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className="text-base">
                      {group.number}부 {group.name}
                    </CardTitle>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                      <span>학년 {group.grades.length}개</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="font-semibold text-foreground"
                            disabled={group.grades.length === 0 || isPromoting}
                          >
                            <ArrowUp className="h-4 w-4" />
                            {isPromoting
                              ? "학년 올리는 중"
                              : "학년 하나씩 올리기"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {group.number}부 {group.name} 학년을 하나씩
                              올릴까요?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              현재 등록된 {group.grades.length}개 학년의 번호가
                              모두 1씩 증가합니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPromoting}>
                              취소
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void promoteGroupGrades(group.id)}
                              disabled={isPromoting}
                            >
                              확인하고 올리기
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 pt-0">
                    <form
                      onSubmit={event => createGroupGrade(event, group.id)}
                      className="grid gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-[72px_1fr_auto] md:items-end"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">학년</Label>
                        <Input
                          className="h-8"
                          type="number"
                          min={1}
                          value={draft.number}
                          onChange={event =>
                            setDrafts(current => ({
                              ...current,
                              [group.id]: {
                                ...draft,
                                number: Number(event.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">학년명</Label>
                        <Input
                          className="h-8"
                          value={draft.name}
                          onChange={event =>
                            setDrafts(current => ({
                              ...current,
                              [group.id]: {
                                ...draft,
                                name: event.target.value,
                              },
                            }))
                          }
                          placeholder="1학년"
                        />
                      </div>
                      <div className="flex items-center">
                        <Button type="submit" size="sm" disabled={isCreating}>
                          <Plus className="h-4 w-4" />
                          {isCreating ? "추가 중" : "추가"}
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-1 border-t pt-3">
                      {group.grades.length === 0 ? (
                        <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                          등록된 학년이 없습니다.
                        </p>
                      ) : (
                        group.grades.map(grade => {
                          const isSaving = savingGradeIds.includes(grade.id);
                          const savedGrade = savedGrades[grade.id];
                          const hasChanges =
                            !!savedGrade &&
                            (grade.name !== savedGrade.name ||
                              grade.number !== savedGrade.number ||
                              grade.isActive !== savedGrade.isActive);

                          return (
                            <div
                              key={grade.id}
                              className="grid gap-2 rounded-md px-2 py-2 hover:bg-muted/40 md:grid-cols-[72px_1fr_auto_auto] md:items-end"
                            >
                              <div className="space-y-1">
                                <Label className="text-xs">학년</Label>
                                <Input
                                  className="h-8"
                                  type="number"
                                  min={1}
                                  value={grade.number}
                                  onChange={event =>
                                    updateLocalGrade({
                                      ...grade,
                                      number: Number(event.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">학년명</Label>
                                <Input
                                  className="h-8"
                                  value={grade.name}
                                  onChange={event =>
                                    updateLocalGrade({
                                      ...grade,
                                      name: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex h-8 items-center gap-2">
                                <Switch
                                  checked={grade.isActive}
                                  onCheckedChange={checked =>
                                    updateLocalGrade({
                                      ...grade,
                                      isActive: checked,
                                    })
                                  }
                                />
                                <span className="text-sm text-muted-foreground">
                                  {grade.isActive ? "활성" : "비활성"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => saveGrade(grade)}
                                  disabled={isSaving || !hasChanges}
                                >
                                  <Save className="h-4 w-4" />
                                  {isSaving ? "저장 중" : "저장"}
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
