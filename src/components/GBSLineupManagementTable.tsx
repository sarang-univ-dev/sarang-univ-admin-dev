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


export function GBSLineupManagementTable({
                                   registrations = [],
                                   gbsLists = [],
                                   schedules = [],
                                   retreatSlug,
                               }: {
    registrations: any[];
    gbsLists: any[];
    schedules: any[];
    retreatSlug: string;
}) {
    // State
    const addToast = useToastStore(state => state.add);
    const [editingMemoId, setEditingMemoId] = useState<number | null>(null);
    const [memoValues, setMemoValues] = useState<Record<number, string>>({});
    const [memoError, setMemoError] = useState<Record<number, boolean>>({});
    const [leaderModalOpen, setLeaderModalOpen] = useState<number | null>(null); // GBS number
    const [selectedLeaders, setSelectedLeaders] = useState<Record<number, Set<number>>>({});
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newGbsNumber, setNewGbsNumber] = useState("");
    const [newGbsMemo, setNewGbsMemo] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [leaderSelectModalOpen, setLeaderSelectModalOpen] = useState(false);
    const [newGroupLeaders, setNewGroupLeaders] = useState<any[]>([]);
    const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
    const [leaderSortOrder, setLeaderSortOrder] = useState<"asc" | "desc">("asc");
    const [createLoading, setCreateLoading] = useState(false);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return gbsLists;
        const term = searchTerm.trim().toLowerCase();
        return gbsLists.filter(row =>
            String(row.number).includes(term) || // gbs번호
            (row.name?.toLowerCase().includes(term) ?? false) ||
            (row.memo?.toLowerCase().includes(term) ?? false)
        );
    }, [gbsLists, searchTerm]);

    // 리더 후보: 검색, 정렬
    const filteredLeaders = useMemo(() => {
        let arr = registrations.filter(r =>
            r.name.includes(leaderSearchTerm) ||
            String(r.id).includes(leaderSearchTerm) ||
            (r.phoneNumber ?? "").includes(leaderSearchTerm)
        );
        arr = arr.sort((a, b) => leaderSortOrder === "asc" ? a.univGroupNumber - b.univGroupNumber : b.univGroupNumber - a.univGroupNumber);
        return arr;
    }, [registrations, leaderSearchTerm, leaderSortOrder]);

    // 이미 그룹장으로 지정된 사람 구분 (예시, 필요하면 props로 따로 받을 수 있음)
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
                    gbsLeaders: null,
                    memo: newGbsMemo || null,
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
            setNewGbsNumber("");
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">GBS 관리</h1>
                    <p className="text-muted-foreground">GBS 그룹 생성/삭제, 그룹장 지정, 메모 관리가 가능합니다.</p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4"/> 그룹 생성
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
                    <CardDescription>그룹별 상세 정보, 그룹장, 메모 관리</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>GBS 번호</TableHead>
                                <TableHead>리더(여러명)</TableHead>
                                <TableHead>메모</TableHead>
                                <TableHead className="text-right">액션</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map(group => (
                                <TableRow key={group.number}>
                                    {/* GBS 번호 */}
                                    <TableCell className="font-mono">{group.number}</TableCell>
                                    {/* 그룹장 */}
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                            }}
                                            className="h-auto p-1 justify-start"
                                        >
                                            ???
                                        </Button>
                                    </TableCell>
                                    {/* 그룹원 수 */}
                                    {/* 메모 */}
                                    <TableCell className="max-w-xs">
                                        {editingMemoId === group.number ? (
                                            <div className="flex gap-1 items-start">
                                                <Textarea
                                                    value={memoValues[group.number] || ""}
                                                    onChange={e =>
                                                        setMemoValues(prev => ({
                                                            ...prev,
                                                            [group.number]: e.target.value
                                                        }))
                                                    }
                                                    className={
                                                        "min-h-[60px] " +
                                                        (memoError[group.number]
                                                            ? "border border-red-500"
                                                            : "border border-gray-200")
                                                    }
                                                    autoFocus
                                                />
                                                <Button size="sm" variant="outline" onClick={() => {
                                                }}>
                                                    <Save className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                className="cursor-pointer hover:bg-muted p-2 rounded min-h-[40px]"
                                                onClick={() => {
                                                }}
                                            >
                                                {group.memo ? (
                                                    <div className="text-sm">{group.memo}</div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">메모를 입력하려면 클릭</span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    {/* 액션 */}
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>GBS 삭제</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            GBS {group.number}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>취소</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => {
                                                        }}>
                                                            삭제
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
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
                        <DialogTitle>GBS 그룹 생성</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="예) 103"
                            value={newGbsNumber}
                            onChange={e => setNewGbsNumber(e.target.value)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setLeaderSelectModalOpen(true)}
                        >
                            <User className="h-4 w-4 mr-2" />
                            {newGroupLeaders.length === 0 ? "그룹장 선택" : newGroupLeaders.map(l => l.name).join(", ")}
                        </Button>
                        <Textarea
                            placeholder="메모 (선택)"
                            value={newGbsMemo}
                            onChange={e => setNewGbsMemo(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={handleCreateGbsGroup}
                            disabled={createLoading || !newGbsNumber.trim()}
                        >
                            {createLoading ? "생성 중..." : "생성"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2차 모달: 그룹장 선택 */}
            <Dialog open={leaderSelectModalOpen} onOpenChange={setLeaderSelectModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>그룹장 선택</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center mb-4 gap-4">
                        <Input
                            placeholder="이름, ID, 전화번호 검색"
                            value={leaderSearchTerm}
                            onChange={e => setLeaderSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                        <select
                            value={leaderSortOrder}
                            onChange={e => setLeaderSortOrder(e.target.value as "asc" | "desc")}
                            className="border rounded p-2"
                        >
                            <option value="asc">1부~8부 순</option>
                            <option value="desc">8부~1부 역순</option>
                        </select>
                    </div>
                    {/* 테이블을 감싸는 div에 max-height, overflow 추가! */}
                    <div className="overflow-auto max-h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>이름</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>전화번호</TableHead>
                                    <TableHead>부서</TableHead>
                                    <TableHead>상태</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeaders.map(u => {
                                    const selected = newGroupLeaders.some(l => l.id === u.id);
                                    return (
                                        <TableRow key={u.id} className={isAssignedLeader(u.id) && !selected ? "opacity-50" : ""}>
                                            <TableCell>{u.name}</TableCell>
                                            <TableCell>{u.id}</TableCell>
                                            <TableCell>{u.phoneNumber}</TableCell>
                                            <TableCell>{u.univGroupNumber}부</TableCell>
                                            <TableCell>
                                                {selected ? (
                                                    <span className="text-blue-600 font-bold">선택됨</span>
                                                ) : isAssignedLeader(u.id) ? (
                                                    <span className="text-gray-400">그룹장(다른 GBS)</span>
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
                            onClick={() => setLeaderSelectModalOpen(false)}
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