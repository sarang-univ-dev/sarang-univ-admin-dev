"use client";

import { ArrowUp, Plus, Save } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createGrade, updateGrade } from "@/lib/api/admin-api";
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

  const promoteGroupGrades = (univGroupId: number) => {
    setUnivGroups(current =>
      current.map(group =>
        group.id === univGroupId
          ? {
              ...group,
              grades: group.grades
                .map(grade => ({
                  ...grade,
                  number: grade.number + 1,
                }))
                .sort((a, b) => a.number - b.number),
            }
          : group
      )
    );
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">부서/학년 관리</h1>
        <p className="text-muted-foreground">
          모든 부서의 신청 가능 학년을 관리합니다. 삭제 대신 비활성화합니다.{" "}
          비활성화되는 경우 신청폼 학년 목록에서 나오지 않습니다.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {univGroups.map(group => {
          const draft = drafts[group.id] ?? { name: "", number: 1 };
          const isCreating = creatingGroupIds.includes(group.id);
          const canPromote =
            group.grades.length > 0 &&
            group.grades.every(grade => grade.number < 20);

          return (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>
                  {group.number}부 {group.name}
                </CardTitle>
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>학년 {group.grades.length}개</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => promoteGroupGrades(group.id)}
                    disabled={!canPromote}
                  >
                    <ArrowUp className="h-4 w-4" />
                    학년 하나씩 올리기
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {group.grades.length === 0 ? (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
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
                          className="grid gap-3 rounded-md border p-3 md:grid-cols-[100px_1fr_auto_auto]"
                        >
                          <div className="space-y-2">
                            <Label>학년</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={grade.number}
                              onChange={event =>
                                updateLocalGrade({
                                  ...grade,
                                  number: Number(event.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>학년명</Label>
                            <Input
                              value={grade.name}
                              onChange={event =>
                                updateLocalGrade({
                                  ...grade,
                                  name: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex items-end gap-2 pb-2">
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
                          <div className="flex items-end">
                            <Button
                              type="button"
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

                <form
                  onSubmit={event => createGroupGrade(event, group.id)}
                  className="grid gap-3 rounded-md bg-muted/40 p-3 md:grid-cols-[100px_1fr_auto]"
                >
                  <div className="space-y-2">
                    <Label>학년</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
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
                  <div className="space-y-2">
                    <Label>학년명</Label>
                    <Input
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
                  <div className="flex items-end">
                    <Button type="submit" disabled={isCreating}>
                      <Plus className="h-4 w-4" />
                      {isCreating ? "추가 중" : "추가"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
