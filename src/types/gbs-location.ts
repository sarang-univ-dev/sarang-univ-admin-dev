/**
 * GBS 장소 배정 관련 타입 정의
 */

/**
 * GBS 장소 아이템 (API 응답)
 */
export interface GbsLocationItem {
  id: number;
  retreatId: number;
  number: number;
  memo?: string | null;
  location?: string | null;
  leaders: {
    id: number;
    name: string;
  }[];
  createdAt: Date;
}

/**
 * GBS 장소 테이블 데이터 (TanStack Table용)
 */
export interface GbsLocationTableData {
  id: number;
  number: number;
  memo: string | null;
  location: string | null;
}

/**
 * LocationCombobox Props (단순화됨)
 */
export interface LocationComboboxProps {
  gbsId: number;
  value: string | null;
  availableLocations: string[];
  currentLocation?: string | null;
  disabled?: boolean;
  isMutating?: boolean;
  onAssign: (gbsId: number, location: string) => Promise<void>;
}

// 하위 호환성을 위한 alias
export type IGbsLocationItem = GbsLocationItem;
