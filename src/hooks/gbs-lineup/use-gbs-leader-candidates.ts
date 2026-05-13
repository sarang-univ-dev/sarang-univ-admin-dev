/**
 * GBS 리더 후보 조회 훅
 *
 * 리더 선택 모달에서 사용하는 참가자 목록 조회
 * - 리더가 아닌 참가자만 필터링
 * - 정적 데이터이므로 revalidateOnFocus 비활성화
 */
import useSWR from "swr";
import { useMemo } from "react";
import { GbsLineupAPI } from "@/lib/api/gbs-lineup-api";
import { GbsLeaderCandidate } from "@/types/gbs-lineup";

export function useGbsLeaderCandidates(retreatSlug: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`
    : null;

  const { data, error, isLoading } = useSWR<GbsLeaderCandidate[]>(
    endpoint,
    () => GbsLineupAPI.getLeaderCandidates(retreatSlug),
    {
      revalidateOnFocus: false, // 정적 리스트, 포커스 시 갱신 불필요
      dedupingInterval: 60000, // 1분 캐시
    }
  );

  // 리더가 아닌 참가자만 필터링
  const candidates = useMemo(
    () => (data ?? []).filter((u) => !u.isLeader),
    [data]
  );

  // 부서별, 학년별 정렬된 후보 목록
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      // 1. 부서 오름차순
      if (a.univGroupNumber !== b.univGroupNumber) {
        return a.univGroupNumber - b.univGroupNumber;
      }
      // 2. 학년 내림차순
      if (a.gradeNumber !== b.gradeNumber) {
        return b.gradeNumber - a.gradeNumber;
      }
      // 3. 이름 가나다순
      return a.name.localeCompare(b.name, "ko");
    });
  }, [candidates]);

  return {
    candidates: sortedCandidates,
    error,
    isLoading,
  };
}
