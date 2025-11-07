/**
 * 부서명 + 통계 칩 헤더
 */
interface DepartmentHeaderProps {
  label: string;
  isTotal: boolean;
  totalCount: number;
  fullCount: number;
  partialCount: number;
}

export function DepartmentHeader({
  label,
  isTotal,
  totalCount,
  fullCount,
  partialCount,
}: DepartmentHeaderProps) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex px-2.5 py-1 rounded-md font-semibold text-sm whitespace-nowrap shrink-0 ${
          isTotal
            ? "bg-gray-200 text-gray-800"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {label}
      </span>
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 shrink-0">
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
          전체 인원 <span className="font-bold">{totalCount}</span>명
        </span>
      </div>
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 shrink-0">
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
          전참 <span className="font-bold">{fullCount}</span>명
        </span>
      </div>
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 shrink-0">
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
          부분참 <span className="font-bold">{partialCount}</span>명
        </span>
      </div>
    </div>
  );
}
