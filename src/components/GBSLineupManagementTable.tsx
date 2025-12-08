"use client";

import { useState, useEffect, useRef, useMemo } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Users,
    Building2,
    Phone,
    Mail,
    User,
    Calendar,
    Save,
    CheckCircle2,
    RotateCcw,
    X,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { SearchBar } from "@/components/RegistrationTableSearchBar";
import { formatDate } from "@/utils/formatDate";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { mutate } from "swr";
import { AxiosError } from "axios";
import {Input} from "@/components/ui/input";
import {IUserRetreatGBSLineup} from "@/hooks/use-gbs-line-up";
import {IUserRetreatGBSLineupList} from "@/hooks/use-gbs-line-up-management";
import {TRetreatRegistrationSchedule} from "@/types";


export function GBSLineupManagementTable({
                                   registrations = [],
                                   gbsLists = [],
                                   schedules = [],
                                   retreatSlug,
                               }: {
    registrations: IUserRetreatGBSLineup[];
    gbsLists: IUserRetreatGBSLineupList[];
    schedules: TRetreatRegistrationSchedule[];
    retreatSlug: string;
}) {
    // State
    const addToast = useToastStore(state => state.add);
    const [memoValues, setMemoValues] = useState<Record<string, string>>({});
    const [memoError, setMemoError] = useState<Record<number, boolean>>({});
    const [leaderModalOpen, setLeaderModalOpen] = useState<number | null>(null); // GBS number
    const [selectedLeaders, setSelectedLeaders] = useState<Record<number, Set<number>>>({});
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [multiCreate, setMultiCreate] = useState(false);
    const [newGbsNumber, setNewGbsNumber] = useState([""]); // 배열로 관리
    const [newGbsMemo, setNewGbsMemo] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [leaderSelectModalOpen, setLeaderSelectModalOpen] = useState(false);
    const [newGroupLeaders, setNewGroupLeaders] = useState<IUserRetreatGBSLineup[]>([]);
    const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
    const [createLoading, setCreateLoading] = useState(false);
    const [assignTargetGbsNumber, setAssignTargetGbsNumber] = useState<number | null>(null);
    const [editingMemo, setEditingMemo] = useState<Record<string, boolean>>({});

    const confirmDialog = useConfirmDialogStore();

    const filteredGbsListData = useMemo(() => {
        if (!searchTerm.trim()) return gbsLists;
        const term = searchTerm.trim().toLowerCase();
        return gbsLists.filter(row =>
            String(row.number).includes(term) || // gbs번호
            row.leaders.some(leader => leader.name.toLowerCase().includes(term)) || // 리더 이름
            (row.memo?.toLowerCase().includes(term) ?? false)
        );
    }, [gbsLists, searchTerm]);

    // 리더 후보: 검색, 정렬
    const filteredLeaders = useMemo(() => {
        let arr = registrations
            .filter(r =>
                    !r.isLeader && ( // << 여기 추가!
                        r.name.includes(leaderSearchTerm) ||
                        String(r.id).includes(leaderSearchTerm) ||
                        (r.phoneNumber ?? "").includes(leaderSearchTerm)
                    )
            );
        arr = arr.sort((a, b) => {
            // 1. 부서 오름차순
            if (a.univGroupNumber !== b.univGroupNumber) {
                return a.univGroupNumber - b.univGroupNumber;
            }
            // 2. 학년 내림차순 (숫자가 클수록 우선, ex: 13 -> 1)
            if (a.gradeNumber !== b.gradeNumber) {
                return b.gradeNumber - a.gradeNumber;
            }
            // 3. 이름 가나다 (localeCompare)
            return a.name.localeCompare(b.name, "ko");
        });
        return arr;
    }, [registrations, leaderSearchTerm]);

    // 이미 리더로 지정된 사람 구분 (예시, 필요하면 props로 따로 받을 수 있음)
    const isAssignedLeader = (userId: number) =>
        false; // 실제 로직 필요: 이미 다른 gbsList에 leaderUserIds에 있는지 확인

    const gbsListEndpoint = `/api/v1/retreat/${retreatSlug}/line-up/gbslist`;

    const handleCreateGbsGroup = async () => {
        setCreateLoading(true);
        try {
            // 실제 API 요청
            await webAxios.post(
                `/api/v1/retreat/${retreatSlug}/line-up/create-gbs`,
                {
                    gbsNumbers: newGbsNumber,
                }
            );

            // 데이터 리프레시(혹은 mutate, 직접 set 등)
            await mutate(gbsListEndpoint); // swr이면 이렇게!

            addToast({
                title: "성공",
                description: "GBS 그룹이 생성되었습니다.",
                variant: "success",
            });

            setCreateModalOpen(false);
            setNewGbsNumber([""]);
            setNewGbsMemo("");
        } catch (error) {
            addToast({
                title: "오류 발생",
                description: "GBS 그룹 생성 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleAssignGbsLeaders = async () => {
        setCreateLoading(true);

        try {
            // leaderUserIds 배열
            const leaderUserIds = newGroupLeaders.map(l => l.userId);

            // 실제 API 요청
            await webAxios.post(
                `/api/v1/retreat/${retreatSlug}/line-up/assign-gbs-leaders`,
                {
                    gbsNumber: assignTargetGbsNumber, // ★ 이게 해당 GBS 번호!
                    leaderUserIds: leaderUserIds,     // ★ 선택한 리더 id들!
                }
            );

            // 데이터 리프레시(혹은 mutate, 직접 set 등)
            await mutate(gbsListEndpoint); // swr이면 이렇게!

            addToast({
                title: "성공",
                description: "GBS에 리더가 배정되었습니다.",
                variant: "success",
            });

            setLeaderSelectModalOpen(false)
            setNewGroupLeaders([]);
        } catch (error) {
            addToast({
                title: "오류 발생",
                description: "리더 배정 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleGbsMemo = async (id: number) => {
        setCreateLoading(true);
        const memo = memoValues[id];

        try {
            // 실제 API 요청
            await webAxios.put(
                `/api/v1/retreat/${retreatSlug}/line-up/lineup-gbs-memo`,
                {
                    gbsNumber: id,
                    memo: memo
                }
            );

            // 데이터 리프레시(혹은 mutate, 직접 set 등)
            await mutate(gbsListEndpoint); // swr이면 이렇게!

            addToast({
                title: "성공",
                description: "GBS 메모가 저장되었습니다.",
                variant: "success",
            });

        } catch (error) {
            addToast({
                title: "오류 발생",
                description: "메모 저장 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteMemo = async (id: number) => {
        setCreateLoading(true);
        const memo = memoValues[id];

        try {
            // 실제 API 요청
            await webAxios.delete(
                `/api/v1/retreat/${retreatSlug}/line-up/lineup-gbs-memo`,
                {
                    data: { gbsNumber: id }
                }
            );

            // 데이터 리프레시(혹은 mutate, 직접 set 등)
            await mutate(gbsListEndpoint); // swr이면 이렇게!

            addToast({
                title: "성공",
                description: "GBS 메모가 저장되었습니다.",
                variant: "success",
            });

        } catch (error) {
            addToast({
                title: "오류 발생",
                description: "메모 저장 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeleteLeaders = async (id: number) => {
        setCreateLoading(true);
        // /:gbsId/unassign-gbs-leaders

        try {
            // 실제 API 요청
            await webAxios.delete(
                `/api/v1/retreat/${retreatSlug}/line-up/${id}/unassign-gbs-leaders`,
            );

            // 데이터 리프레시(혹은 mutate, 직접 set 등)
            await mutate(gbsListEndpoint); // swr이면 이렇게!

            addToast({
                title: "성공",
                description: "GBS 리더 배정이 취소되었습니다.",
                variant: "success",
            });

        } catch (error) {
            addToast({
                title: "오류 발생",
                description: "GBS 리더 배정 취소 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    // 메모 편집 취소
    const handleCancelEditMemo = (id: number) => {
        setEditingMemo(prev => ({ ...prev, [id]: false }));
        setMemoValues(prev => ({ ...prev, [id]: "" }));
    };

    // 메모 편집 시작
    const handleStartEditMemo = (id: number, currentMemo: string | null) => {
        setEditingMemo(prev => ({ ...prev, [id]: true }));
        setMemoValues(prev => ({ ...prev, [id]: currentMemo || "" }));
    };

    // 메모 삭제 확인
    const handleConfirmDeleteMemo = (id: number) => {
        confirmDialog.show({
            title: "메모 삭제",
            description: "정말로 메모를 삭제하시겠습니까?",
            onConfirm: () => handleDeleteMemo(id),
        });
    };

    const handleConfirmDeleteLeaders = (id: number) => {
        confirmDialog.show({
            title: "리더 삭제",
            description: "정말로 리더 배정을 삭제하시겠습니까?",
            onConfirm: () => handleDeleteLeaders(id),
        });
    };

    // GBS 그룹 삭제
    const handleDeleteGbsGroup = async (gbsNumber: number) => {
        setCreateLoading(true);

        try {
            // 실제 API 요청
            await webAxios.delete(
                `/api/v1/retreat/${retreatSlug}/line-up/delete-gbs`,
                {
                    data: { gbsNumber: gbsNumber }
                }
            );

            // 데이터 리프레시
            await mutate(gbsListEndpoint);

            addToast({
                title: "성공",
                description: `GBS ${gbsNumber}이(가) 삭제되었습니다.`,
                variant: "success",
            });

        } catch (error) {
            addToast({
                title: "오류 발생",
                description: "GBS 그룹 삭제 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    // GBS 삭제 확인
    const handleConfirmDeleteGbsGroup = (gbsNumber: number) => {
        confirmDialog.show({
            title: "GBS 삭제",
            description: `GBS ${gbsNumber}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 배정된 인원도 함께 해제됩니다.`,
            onConfirm: () => handleDeleteGbsGroup(gbsNumber),
        });
    };


    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">GBS 관리</h1>
                    <p className="text-muted-foreground">GBS 생성/삭제, 리더 지정, 메모 관리가 가능합니다.</p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4"/> GBS 생성
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"/>
                <Input
                    placeholder={"GBS번호/이름/메모로 검색 ..."}
                    className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>GBS 목록</CardTitle>
                    <CardDescription>GBS별 상세 정보, 리더, 메모 관리</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-2 py-1">GBS 번호</TableHead>
                                <TableHead className="px-2 py-1">리더(여러명)</TableHead>
                                <TableHead className="px-2 py-1">메모</TableHead>
                                <TableHead className="text-right px-2 py-1">액션</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGbsListData.map(group => (
                                <TableRow key={group.number}>
                                    {/* GBS 번호 */}
                                    <TableCell className="font-mono">{group.number}</TableCell>
                                    {/* 그룹장 */}
                                    <TableCell>
                                        <div className="flex items-start gap-2 p-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setAssignTargetGbsNumber(group.number);      // ★ 이 GBS 번호 기억
                                                    setLeaderSelectModalOpen(true);              // 모달 open
                                                }}
                                                className="h-auto p-1 justify-start"
                                            >
                                                {/* leaders 배열이 있으면 이름들을 ,로 구분해서 보여줌 */}
                                                {
                                                    group.leaders && group.leaders.length > 0
                                                        ? group.leaders.map((leaderInfo: {
                                                            id: number;
                                                            name: string
                                                        }) => leaderInfo.name).join(", ")
                                                        : <span className="text-gray-400">리더 없음</span>
                                                }
                                            </Button>
                                            {group.leaders && group.leaders.length > 0 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleConfirmDeleteLeaders(group.id)}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
                                                >
                                                    <Trash2 className="h-3 w-3"/>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        {editingMemo[group.number] ? (
                                            <div className="flex flex-col gap-2 p-2">
                                                <Textarea
                                                    value={memoValues[group.number] || ""}
                                                    onChange={e =>
                                                        setMemoValues(prev => ({
                                                            ...prev,
                                                            [group.number]: e.target.value
                                                        }))
                                                    }
                                                    className={
                                                        "text-sm resize-none overflow-hidden w-full" +
                                                        (memoError[group.number]
                                                            ? " border border-red-400"
                                                            : " border border-gray-200")
                                                    }
                                                    style={{
                                                        height:
                                                            Math.max(
                                                                60,
                                                                Math.min(
                                                                    200,
                                                                    (memoValues[group.number] || "").split("\n").length * 20 + 20
                                                                )
                                                            ) + "px",
                                                    }}
                                                    rows={Math.max(
                                                        3,
                                                        Math.min(10, (memoValues[group.number] || "").split("\n").length + 1)
                                                    )}
                                                    autoFocus
                                                />
                                                {/* 저장/취소 버튼 */}
                                                <div className="flex gap-1 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleGbsMemo(group.number)}
                                                        className="h-7 px-2"
                                                    >
                                                        <Save className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleCancelEditMemo(group.number)}
                                                        className="h-7 px-2"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2 p-2">
                                                <div
                                                    className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words"
                                                    onClick={() => handleStartEditMemo(group.number, group.memo)}
                                                >
                                                    {group.memo || "메모를 추가하려면 클릭하세요"}
                                                </div>
                                                {group.memo && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleConfirmDeleteMemo(group.number)}
                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleConfirmDeleteGbsGroup(group.number)}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* 1차 모달: GBS 생성 */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>GBS 생성</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={multiCreate}
                                onCheckedChange={val => setMultiCreate(!!val)}
                                id="multiCreate"
                            />
                            <Label htmlFor="multiCreate" className="select-none">여러개 생성</Label>
                        </div>
                        {multiCreate ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="시작 번호"
                                    value={newGbsNumber[0] || ""}
                                    onChange={e => {
                                        const arr = [...newGbsNumber];
                                        arr[0] = e.target.value.replace(/\D/g, "");
                                        setNewGbsNumber(arr);
                                    }}
                                />
                                <span className="mx-1">~</span>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="끝 번호"
                                    value={newGbsNumber[1] || ""}
                                    onChange={e => {
                                        const arr = [...newGbsNumber];
                                        arr[1] = e.target.value.replace(/\D/g, "");
                                        setNewGbsNumber(arr);
                                    }}
                                />
                            </div>
                        ) : (
                            <Input
                                type="number"
                                min={1}
                                placeholder="GBS 번호"
                                value={newGbsNumber[0] || ""}
                                onChange={e => setNewGbsNumber([e.target.value.replace(/\D/g, "")])}
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={handleCreateGbsGroup}
                            disabled={
                                multiCreate
                                    ? !newGbsNumber[0]?.trim() || !newGbsNumber[1]?.trim()
                                    : !newGbsNumber[0]?.trim()
                            }
                        >
                            생성
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* 2차 모달: 리더 선택 */}
            <Dialog open={leaderSelectModalOpen} onOpenChange={setLeaderSelectModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>리더 선택</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center mb-4 gap-4">
                        <Input
                            placeholder="이름, ID, 전화번호 검색"
                            value={leaderSearchTerm}
                            onChange={e => setLeaderSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                    </div>
                    {/* 테이블을 감싸는 div에 max-height, overflow 추가! */}
                    <div className="overflow-auto max-h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>부서</TableHead>
                                    <TableHead>성별</TableHead>
                                    <TableHead>학년</TableHead>
                                    <TableHead>이름</TableHead>
                                    <TableHead>전화번호</TableHead>
                                    <TableHead>상태</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeaders.map(u => {
                                    const selected = newGroupLeaders.some(l => l.id === u.id);
                                    return (
                                        <TableRow key={u.id} className={isAssignedLeader(u.id) && !selected ? "opacity-50" : ""}>
                                            <TableCell>{u.univGroupNumber}부</TableCell>          {/* 부서 */}
                                            <TableCell>{u.gender === "MALE" ? "남" : "여"}</TableCell> {/* 성별 */}
                                            <TableCell>{u.gradeNumber}학년</TableCell>            {/* 학년 */}
                                            <TableCell>{u.name}</TableCell>                       {/* 이름 */}
                                            <TableCell>{u.phoneNumber}</TableCell>                {/* 전화번호 */}
                                            <TableCell>
                                                {selected ? (
                                                    <span className="text-blue-600 font-bold">선택됨</span>
                                                ) : isAssignedLeader(u.id) ? (
                                                    <span className="text-gray-400">리더(다른 GBS)</span>
                                                ) : (
                                                    <span className="text-green-600">가능</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    disabled={isAssignedLeader(u.id) && !selected}
                                                    variant={selected ? "secondary" : "default"}
                                                    onClick={() => {
                                                        if (selected) {
                                                            setNewGroupLeaders(leaders =>
                                                                leaders.filter(l => l.id !== u.id)
                                                            );
                                                        } else {
                                                            setNewGroupLeaders(leaders => [...leaders, u]);
                                                        }
                                                    }}
                                                >
                                                    {selected ? "선택됨" : "선택"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLeaderSelectModalOpen(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={handleAssignGbsLeaders}
                            disabled={newGroupLeaders.length === 0}
                        >
                            완료
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}