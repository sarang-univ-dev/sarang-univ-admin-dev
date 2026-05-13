"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";

import { getSocketClient } from "@/lib/socket/socket-client";
import type {
  UserRetreatGbsLineup,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/socket/socket-events";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { useToastStore } from "@/store/toast-store";

/**
 * WebSocket 기반 GBS 라인업 데이터 훅
 *
 * @description
 * - Socket.io로 실시간 데이터 동기화
 * - SWR 대신 WebSocket 이벤트 기반
 * - 변경사항이 있을 때만 서버에서 push
 * - httpOnly 쿠키를 자동으로 전송 (withCredentials: true)
 *
 * @param retreatSlug - 수양회 슬러그
 */
export function useWebSocketGbsLineup(retreatSlug: string) {
  const [data, setData] = useState<UserRetreatGbsLineup[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirmDialogStore();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Socket 연결 & 초기 데이터 수신
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    console.log(
      "🔌 [useWebSocketGbsLineup] Hook initialized with retreatSlug:",
      retreatSlug
    );

    if (!retreatSlug) {
      console.warn("⚠️ [useWebSocketGbsLineup] No retreatSlug provided");
      return;
    }

    // withCredentials: true로 httpOnly 쿠키 자동 전송
    const socket = getSocketClient();
    socketRef.current = socket;

    // 연결 성공 시 room 참여 및 초기 데이터 요청
    const handleConnect = () => {
      setIsConnected(true);
      console.log(
        "✅ [useWebSocketGbsLineup] Connected to GBS Lineup WebSocket"
      );
      console.log(
        "🔔 [useWebSocketGbsLineup] Emitting join-retreat:",
        retreatSlug
      );

      // ✅ acknowledgment callback으로 초기 데이터 수신
      socket.emit("join-retreat", retreatSlug, response => {
        console.log(
          "📨 [useWebSocketGbsLineup] join-retreat response:",
          response.status
        );

        if (response.status === "OK") {
          setData(response.data || []);
          setIsLoading(false);
          console.log(
            `📊 [useWebSocketGbsLineup] Received ${response.data?.length || 0} lineups`
          );
        } else {
          console.error(
            "❌ [useWebSocketGbsLineup] Failed to join retreat:",
            response.message
          );
          setIsLoading(false);
          addToast({
            title: "연결 실패",
            description: response.message || "수양회 참여에 실패했습니다.",
            variant: "destructive",
          });
        }
      });
    };

    // 다른 사용자의 실시간 업데이트 수신 (broadcast)
    const handleLineupUpdated = (updated: UserRetreatGbsLineup) => {
      setData(prev =>
        prev.map(item =>
          item.id === updated.id ? { ...item, ...updated } : item
        )
      );
      console.log(`🔄 Lineup updated by another user: ${updated.id}`);
    };

    // 연결 해제
    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log("❌ Disconnected:", reason);
    };

    // 연결 오류 (인증 실패 등)
    const handleConnectError = (error: any) => {
      console.error("🔴 WebSocket connection error:", error.message);
      setIsLoading(false);
      addToast({
        title: "연결 오류",
        description:
          error.data?.code === "AUTH_REQUIRED"
            ? "인증이 필요합니다."
            : "서버 연결에 실패했습니다.",
        variant: "destructive",
      });
    };

    // Event Listeners 등록
    socket.on("connect", handleConnect);
    socket.on("lineup-updated", handleLineupUpdated);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // 이미 연결되어 있으면 즉시 join
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup: 컴포넌트 언마운트 시 room 나가기
    return () => {
      console.log(
        "🧹 [useWebSocketGbsLineup] Cleaning up, leaving retreat:",
        retreatSlug
      );

      socket.off("connect", handleConnect);
      socket.off("lineup-updated", handleLineupUpdated);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      if (socket.connected) {
        socket.emit("leave-retreat", retreatSlug);
      }

      // 데이터 초기화
      setData([]);
      setIsLoading(true);
    };
  }, [retreatSlug, addToast]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Mutation 함수들
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * GBS 번호 저장 (Optimistic UI Update)
   */
  const saveGbsNumber = useCallback(
    async (userRetreatRegistrationId: number, gbsNumber: number | null) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: "연결 오류",
          description: "WebSocket 연결이 끊어졌습니다.",
          variant: "destructive",
        });
        return;
      }

      console.log(
        `🔄 [saveGbsNumber] Optimistically updating registration ${userRetreatRegistrationId} → GBS ${gbsNumber}`
      );

      // ✅ Optimistic Update: 즉시 UI 업데이트
      const previousData = data;
      setData(prev =>
        prev.map(item =>
          item.id === userRetreatRegistrationId ? { ...item, gbsNumber } : item
        )
      );

      setIsMutating(true);

      // ✅ 서버에 요청 전송
      socketRef.current.emit(
        "update-gbs-number",
        { userRetreatRegistrationId, gbsNumber },
        response => {
          setIsMutating(false);

          if (response.status === "OK" && response.data) {
            console.log(
              `✅ [saveGbsNumber] Server confirmed update for registration ${userRetreatRegistrationId}`
            );
            console.log(`📊 [saveGbsNumber] Updated data:`, response.data);

            // ✅ 서버에서 받은 전체 lineup 객체로 갱신 (totalCount, maleCount 등 포함)
            setData(prev => {
              const updated = prev.map(item =>
                item.id === response.data!.id
                  ? { ...item, ...response.data! }
                  : item
              );
              console.log(
                `🔄 [saveGbsNumber] Data updated, total rows: ${updated.length}`
              );
              return updated;
            });

            addToast({
              title: "성공",
              description: "GBS 번호가 저장되었습니다.",
              variant: "success",
            });
          } else {
            console.error(`❌ [saveGbsNumber] Server error:`, response.message);

            // ❌ 실패 시 이전 상태로 롤백
            setData(previousData);

            addToast({
              title: "오류",
              description: response.message || "GBS 번호 저장에 실패했습니다.",
              variant: "destructive",
            });
          }
        }
      );
    },
    [addToast, data]
  );

  /**
   * 라인업 메모 저장
   */
  const saveLineupMemo = useCallback(
    async (userRetreatRegistrationId: number, memo: string, color?: string) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: "연결 오류",
          description: "WebSocket 연결이 끊어졌습니다.",
          variant: "destructive",
        });
        return;
      }

      setIsMutating(true);

      socketRef.current.emit(
        "create-lineup-memo",
        {
          userRetreatRegistrationId,
          memo: memo.trim(),
          color,
        },
        response => {
          setIsMutating(false);

          if (response.status === "OK" && response.data) {
            console.log(`✅ [saveLineupMemo] Server confirmed update`);
            console.log(`📊 [saveLineupMemo] Updated data:`, response.data);

            // ✅ 서버에서 받은 전체 lineup 객체로 갱신
            setData(prev => {
              const updated = prev.map(item =>
                item.id === response.data!.id
                  ? { ...item, ...response.data! }
                  : item
              );
              console.log(
                `🔄 [saveLineupMemo] Data updated, affected row:`,
                response.data!.id
              );
              return updated;
            });

            addToast({
              title: "성공",
              description: "메모가 저장되었습니다.",
              variant: "success",
            });
          } else {
            addToast({
              title: "오류",
              description: response.message || "메모 저장에 실패했습니다.",
              variant: "destructive",
            });
          }
        }
      );
    },
    [addToast]
  );

  /**
   * 라인업 메모 수정
   */
  const updateLineupMemo = useCallback(
    async (
      userRetreatRegistrationMemoId: number,
      memo: string,
      color?: string
    ) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: "연결 오류",
          description: "WebSocket 연결이 끊어졌습니다.",
          variant: "destructive",
        });
        return;
      }

      setIsMutating(true);

      socketRef.current.emit(
        "update-lineup-memo",
        {
          userRetreatRegistrationMemoId,
          memo: memo.trim(),
          color,
        },
        response => {
          setIsMutating(false);

          if (response.status === "OK" && response.data) {
            console.log(`✅ [updateLineupMemo] Server confirmed update`);
            console.log(`📊 [updateLineupMemo] Updated data:`, response.data);

            // ✅ 서버에서 받은 전체 lineup 객체로 갱신
            setData(prev => {
              const updated = prev.map(item =>
                item.id === response.data!.id
                  ? { ...item, ...response.data! }
                  : item
              );
              console.log(
                `🔄 [updateLineupMemo] Data updated, affected row:`,
                response.data!.id
              );
              return updated;
            });

            addToast({
              title: "성공",
              description: "메모가 수정되었습니다.",
              variant: "success",
            });
          } else {
            addToast({
              title: "오류",
              description: response.message || "메모 수정에 실패했습니다.",
              variant: "destructive",
            });
          }
        }
      );
    },
    [addToast]
  );

  /**
   * 라인업 메모 삭제
   */
  const deleteLineupMemo = useCallback(
    async (userRetreatRegistrationMemoId: number) => {
      confirmDialog.show({
        title: "메모 삭제",
        description: "정말로 메모를 삭제하시겠습니까?",
        onConfirm: async () => {
          if (!socketRef.current?.connected) {
            addToast({
              title: "연결 오류",
              description: "WebSocket 연결이 끊어졌습니다.",
              variant: "destructive",
            });
            return;
          }

          setIsMutating(true);

          socketRef.current.emit(
            "delete-lineup-memo",
            { userRetreatRegistrationMemoId },
            response => {
              setIsMutating(false);

              if (response.status === "OK" && response.data) {
                console.log(`✅ [deleteLineupMemo] Server confirmed deletion`);
                console.log(
                  `📊 [deleteLineupMemo] Updated data:`,
                  response.data
                );

                // ✅ 서버에서 받은 전체 lineup 객체로 갱신
                setData(prev => {
                  const updated = prev.map(item =>
                    item.id === response.data!.id
                      ? { ...item, ...response.data! }
                      : item
                  );
                  console.log(
                    `🔄 [deleteLineupMemo] Data updated, affected row:`,
                    response.data!.id
                  );
                  return updated;
                });

                addToast({
                  title: "성공",
                  description: "메모가 삭제되었습니다.",
                  variant: "success",
                });
              } else {
                addToast({
                  title: "오류",
                  description: response.message || "메모 삭제에 실패했습니다.",
                  variant: "destructive",
                });
              }
            }
          );
        },
      });
    },
    [addToast, confirmDialog]
  );

  return {
    // 데이터
    data,
    isConnected,
    isLoading,
    isMutating,

    // 액션
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,
  };
}
