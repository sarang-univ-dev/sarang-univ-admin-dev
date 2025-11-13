/**
 * 공통 응답 타입
 */
export interface SocketResponse<T = any> {
  status: 'OK' | 'ERROR';
  data?: T;
  message?: string;
  code?: string;
}

/**
 * GBS 라인업 데이터 타입 (서버와 공유)
 */
export interface UserRetreatGbsLineup {
  gbsNumber: number | null;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  fullAttendanceCount: number;
  partialAttendanceCount: number;
  id: number;
  userId: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: 'MALE' | 'FEMALE';
  name: string;
  phoneNumber: string;
  isLeader: boolean;
  gbsMemo: string;
  lineupMemo: string;
  lineupMemoId: number | null;
  lineupMemocolor: string;
  isFullAttendance: boolean;
  currentLeader: string;
  userType: string | null;
  userRetreatRegistrationScheduleIds: number[];
  unresolvedLineupHistoryMemo?: string | null;
  adminMemo?: string | null;
}

/**
 * Client → Server 이벤트
 */
export interface ClientToServerEvents {
  // 특정 수양회 room 참여
  'join-retreat': (
    retreatSlug: string,
    callback: (response: SocketResponse<UserRetreatGbsLineup[]>) => void
  ) => void;

  // GBS 번호 수정 (사용자의 GBS 번호 배정 변경)
  'update-gbs-number': (
    data: {
      userRetreatRegistrationId: number;
      gbsNumber: number | null; // null이면 GBS 배정 해제
    },
    callback: (response: SocketResponse<UserRetreatGbsLineup>) => void
  ) => void;

  // 라인업 메모 작성
  'create-lineup-memo': (
    data: {
      userRetreatRegistrationId: number;
      memo: string;
      color?: string;
    },
    callback: (response: SocketResponse<UserRetreatGbsLineup>) => void
  ) => void;

  // 라인업 메모 수정
  'update-lineup-memo': (
    data: {
      userRetreatRegistrationMemoId: number;
      memo: string;
      color?: string;
    },
    callback: (response: SocketResponse<UserRetreatGbsLineup>) => void
  ) => void;

  // 라인업 메모 삭제
  'delete-lineup-memo': (
    data: { userRetreatRegistrationMemoId: number },
    callback: (response: SocketResponse<UserRetreatGbsLineup>) => void
  ) => void;

  // Room 나가기
  'leave-retreat': (retreatSlug: string) => void;
}

/**
 * Server → Client 이벤트
 */
export interface ServerToClientEvents {
  // 단일 라인업 업데이트 (다른 사용자가 수정한 경우)
  'lineup-updated': (data: UserRetreatGbsLineup) => void;

  // 다른 사용자가 편집 중
  'user-editing': (data: {
    userRetreatRegistrationId: number;
    adminUserId: number;
    userName: string;
  }) => void;
}
