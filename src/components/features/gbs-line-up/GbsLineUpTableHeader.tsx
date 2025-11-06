import React, { memo } from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GbsLineUpTableHeaderProps {
  scheduleColumns: Array<{
    key: string;
    label: string;
    bgColorClass: string;
  }>;

  // 필터 상태
  selectedDepartments: string[];
  setSelectedDepartments: React.Dispatch<React.SetStateAction<string[]>>;
  departmentOptions: string[];
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  includedSchedules: string[];
  setIncludedSchedules: React.Dispatch<React.SetStateAction<string[]>>;
  excludedSchedules: string[];
  setExcludedSchedules: React.Dispatch<React.SetStateAction<string[]>>;
  isScheduleFilterModalOpen: boolean;
  setIsScheduleFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  showOnlyUnassigned: boolean;
  setShowOnlyUnassigned: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GbsLineUpTableHeader = memo<GbsLineUpTableHeaderProps>(({
  scheduleColumns,
  selectedDepartments,
  setSelectedDepartments,
  departmentOptions,
  isFilterModalOpen,
  setIsFilterModalOpen,
  includedSchedules,
  setIncludedSchedules,
  excludedSchedules,
  setExcludedSchedules,
  isScheduleFilterModalOpen,
  setIsScheduleFilterModalOpen,
  showOnlyUnassigned,
  setShowOnlyUnassigned,
}) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          GBS<br/>번호
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          전참/부분참
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          남/여
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          <div className="flex items-center justify-center gap-1">
            <span>부서</span>
            <Popover open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Filter className={`h-3 w-3 ${selectedDepartments.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">부서 필터</h4>
                    <p className="text-xs text-gray-600 mb-3">표시할 부서를 선택하세요.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDepartments([])}
                      className="h-7 px-2 text-xs"
                    >
                      전체 해제
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDepartments([...departmentOptions])}
                      className="h-7 px-2 text-xs"
                    >
                      전체 선택
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {departmentOptions.map(department => (
                      <label key={department} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          checked={selectedDepartments.includes(department)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDepartments(prev => [...prev, department]);
                            } else {
                              setSelectedDepartments(prev => prev.filter(d => d !== department));
                            }
                          }}
                          className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <span className="text-xs text-gray-700">{department}</span>
                      </label>
                    ))}
                    {departmentOptions.length === 0 && (
                      <span className="text-xs text-gray-500 col-span-2">필터할 부서가 없습니다.</span>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          성별
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          학년
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          이름
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          부서 리더명
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          전화번호
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          라인업 메모
        </TableHead>
        <TableHead rowSpan={2} className="text-center whitespace-nowrap px-2 py-1">
          <span>타입</span>
        </TableHead>
        <TableHead
          colSpan={scheduleColumns.length}
          className="whitespace-nowrap px-2 py-1"
        >
          <div className="flex items-center justify-center gap-2">
            <span>수양회 신청 일정</span>
            <Popover open={isScheduleFilterModalOpen} onOpenChange={setIsScheduleFilterModalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Filter className={`h-3 w-3 ${includedSchedules.length > 0 || excludedSchedules.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4" align="start">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm mb-2">스케줄 필터</h4>
                    <p className="text-xs text-gray-600 mb-3">포함할 스케줄과 제외할 스케줄을 선택하세요.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIncludedSchedules([]);
                        setExcludedSchedules([]);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      전체 초기화
                    </Button>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2 text-green-700">포함할 스케줄 (반드시 신청해야 함)</h5>
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIncludedSchedules([])}
                        className="h-6 px-2 text-xs"
                      >
                        해제
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const allScheduleKeys = scheduleColumns.map(col => col.key);
                          setIncludedSchedules(allScheduleKeys);
                          setExcludedSchedules(prev => prev.filter(key => !allScheduleKeys.includes(key)));
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        전체
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto border rounded p-2">
                      {scheduleColumns.map(schedule => (
                        <label key={schedule.key} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={includedSchedules.includes(schedule.key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setIncludedSchedules(prev => [...prev, schedule.key]);
                                setExcludedSchedules(prev => prev.filter(s => s !== schedule.key));
                              } else {
                                setIncludedSchedules(prev => prev.filter(s => s !== schedule.key));
                              }
                            }}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          <span className="text-xs text-gray-700">{schedule.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2 text-red-700">제외할 스케줄 (신청하면 안 됨)</h5>
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExcludedSchedules([])}
                        className="h-6 px-2 text-xs"
                      >
                        해제
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const allScheduleKeys = scheduleColumns.map(col => col.key);
                          setExcludedSchedules(allScheduleKeys);
                          setIncludedSchedules(prev => prev.filter(key => !allScheduleKeys.includes(key)));
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        전체
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto border rounded p-2">
                      {scheduleColumns.map(schedule => (
                        <label key={schedule.key} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={excludedSchedules.includes(schedule.key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setExcludedSchedules(prev => [...prev, schedule.key]);
                                setIncludedSchedules(prev => prev.filter(s => s !== schedule.key));
                              } else {
                                setExcludedSchedules(prev => prev.filter(s => s !== schedule.key));
                              }
                            }}
                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                          />
                          <span className="text-xs text-gray-700">{schedule.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TableHead>
        <TableHead className="text-center px-2 py-1">
          GBS 배정하기
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          GBS 메모
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          라인업<br/>일정변동 요청
        </TableHead>
        <TableHead rowSpan={2} className="text-center px-2 py-1">
          행정간사<br/>메모
        </TableHead>
      </TableRow>
      <TableRow>
        {scheduleColumns.map(scheduleCol => (
          <TableHead
            key={scheduleCol.key}
            className="px-2 py-1 text-center whitespace-nowrap"
          >
            <span className="text-xs">{scheduleCol.label}</span>
          </TableHead>
        ))}
        <TableHead className="px-2 py-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-600">
              미배정만 조회
            </span>
            <Checkbox
              checked={showOnlyUnassigned}
              onCheckedChange={() => setShowOnlyUnassigned(!showOnlyUnassigned)}
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
});

GbsLineUpTableHeader.displayName = 'GbsLineUpTableHeader';
