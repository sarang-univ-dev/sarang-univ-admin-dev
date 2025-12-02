"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Save, X, Edit3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastStore } from "@/store/toast-store";
import { 
  IGbsLocationItem, 
  useGbsList, 
  useAvailableLocations, 
  useAssignGbsLocation
} from "@/hooks/use-gbs-location";

export const AssignGbsLocationTable = React.memo(function AssignGbsLocationTable({
  retreatSlug,
}: {
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLocations, setEditingLocations] = useState<Record<number, boolean>>({});
  const [locationValues, setLocationValues] = useState<Record<number, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

  // 데이터 가져오기
  const { data: gbsList, isLoading: isGbsLoading, error: gbsError, mutate: mutateGbs } = useGbsList(retreatSlug);
  const { data: availableLocations, isLoading: isAvailableLoading, mutate: mutateAvailable } = useAvailableLocations(retreatSlug);
  const { assignLocation } = useAssignGbsLocation(retreatSlug);

  // 검색 필터
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return gbsList;
    const lower = searchTerm.toLowerCase();
    return gbsList.filter(item =>
      String(item.number).includes(lower) ||
      (item.memo?.toLowerCase().includes(lower) ?? false) ||
      (item.location?.toLowerCase().includes(lower) ?? false)
    );
  }, [gbsList, searchTerm]);

  // 로딩 상태 설정
  const setLoading = (gbsId: number, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [gbsId]: isLoading,
    }));
  };

  // 편집 시작
  const handleStartEdit = async (gbsId: number, currentLocation?: string) => {
    // 편집 시작할 때 최신 available locations 조회
    await mutateAvailable();
    
    setEditingLocations(prev => ({ ...prev, [gbsId]: true }));
    setLocationValues(prev => ({ ...prev, [gbsId]: currentLocation || "" }));
  };

  // 편집 취소
  const handleCancelEdit = (gbsId: number) => {
    setEditingLocations(prev => ({ ...prev, [gbsId]: false }));
    setLocationValues(prev => ({ ...prev, [gbsId]: "" }));
  };

  // 장소 저장
  const handleSaveLocation = async (gbsId: number) => {
    const location = locationValues[gbsId];
    
    if (!location || !location.trim()) {
      addToast({
        title: "오류",
        description: "장소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(gbsId, true);

    try {
      await assignLocation(gbsId, location.trim());
      
      // 데이터 새로고침
      await Promise.all([
        mutateGbs(),
        mutateAvailable(),
      ]);

      setEditingLocations(prev => ({ ...prev, [gbsId]: false }));
      setLocationValues(prev => ({ ...prev, [gbsId]: "" }));

      addToast({
        title: "성공",
        description: "GBS 장소가 성공적으로 배정되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("GBS 장소 배정 중 오류 발생:", error);
      addToast({
        title: "오류 발생",
        description: "GBS 장소 배정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(gbsId, false);
    }
  };

  // 드롭다운에서 선택
  const handleLocationSelect = (gbsId: number, value: string) => {
    setLocationValues(prev => ({ ...prev, [gbsId]: value }));
  };

  // 특정 GBS의 드롭다운 옵션 생성
  const getLocationOptionsForGbs = (gbsId: number) => {
    const currentGbs = gbsList.find(gbs => gbs.id === gbsId);
    const currentGbsLocation = currentGbs?.location;
    
    // available locations + 현재 GBS의 기존 location (있다면)
    const options = [...availableLocations];
    if (currentGbsLocation && !options.includes(currentGbsLocation)) {
      options.push(currentGbsLocation);
    }
    
    return options;
  };

  if (isGbsLoading || isAvailableLoading) {
    return <div>로딩 중...</div>;
  }

  if (gbsError) {
    return <div>에러가 발생했습니다: {gbsError.message}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">GBS 장소 배정</CardTitle>
        <CardDescription>
          GBS별로 숙소 장소를 배정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-1 pt-4">
        <div className="space-y-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="GBS번호/메모/장소로 검색..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 테이블 */}
          <div className="rounded-md border">
            <div className="min-w-max">
              <div className="max-h-[80vh] overflow-auto">
                <Table className="w-full whitespace-nowrap relative">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center px-4 py-2">
                        GBS 번호
                      </TableHead>
                      <TableHead className="text-center px-4 py-2">
                        GBS 메모
                      </TableHead>
                      <TableHead className="text-center px-4 py-2">
                        GBS 장소
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center px-4 py-2 font-medium">
                          {item.number}
                        </TableCell>
                        <TableCell className="text-center px-4 py-2">
                          {item.memo || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          {editingLocations[item.id] ? (
                            // 편집 모드
                            <div className="flex flex-col gap-2">
                              {/* 드롭다운 */}
                              <Select
                                value={locationValues[item.id] || ""}
                                onValueChange={value => handleLocationSelect(item.id, value)}
                                onOpenChange={async (open) => {
                                  if (open) {
                                    // 드롭다운을 열 때마다 최신 available locations 조회
                                    await mutateAvailable();
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="장소 선택..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {getLocationOptionsForGbs(item.id).map(location => (
                                    <SelectItem key={location} value={location}>
                                      {location}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {/* 직접 입력 */}
                              <Textarea
                                value={locationValues[item.id] || ""}
                                onChange={e =>
                                  setLocationValues(prev => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                placeholder="또는 직접 입력..."
                                className="text-sm resize-none overflow-hidden w-full"
                                rows={2}
                                disabled={loadingStates[item.id]}
                              />
                              
                              {/* 버튼 */}
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveLocation(item.id)}
                                  disabled={loadingStates[item.id]}
                                  className="h-7 px-2"
                                >
                                  {loadingStates[item.id] ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelEdit(item.id)}
                                  disabled={loadingStates[item.id]}
                                  className="h-7 px-2"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // 읽기 모드
                            <div className="flex items-center justify-between">
                              <span className="flex-1 text-sm text-gray-700">
                                {item.location || "장소 미배정"}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => await handleStartEdit(item.id, item.location || "")}
                                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "검색 결과가 없습니다." : "GBS 데이터가 없습니다."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}); 