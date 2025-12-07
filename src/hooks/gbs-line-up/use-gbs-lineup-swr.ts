'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { getSocketClient } from '@/lib/socket/socket-client';
import { webAxios } from '@/lib/api/axios';
import { useToastStore } from '@/store/toast-store';
import { useConfirmDialogStore } from '@/store/confirm-dialog-store';
import type { UserRetreatGbsLineup } from '@/lib/socket/socket-events';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/socket/socket-events';

/**
 * SWR + WebSocket 기반 GBS 라인업 데이터 훅
 *
 * @description
 * Best Practice 적용:
 * - ✅ SWR은 HTTP API로 데이터 페칭 (WebSocket과 분리)
 * - ✅ WebSocket은 실시간 업데이트만 담당 (선택적 연결)
 * - ✅ WebSocket 연결 실패해도 앱은 정상 동작 (Graceful Degradation)
 * - ✅ 토스트 중복 방지 (ref 사용)
 * - ✅ 마운트 상태 추적으로 메모리 누수 방지
 * - ✅ Optimistic Updates로 빠른 UX
 *
 * @see https://swr.vercel.app/docs/subscription
 * @see https://stackoverflow.com/questions/72269969/react-js-and-websocket-io-ends-up-in-infinite-loop
 *
 * @param retreatSlug - 수양회 슬러그
 * @param initialData - 서버에서 가져온 초기 데이터 (SSR fallback)
 */
export function useGbsLineupSwr(retreatSlug: string, initialData?: UserRetreatGbsLineup[]) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  // ✅ Best Practice: 에러 토스트 중복 방지 (ref 사용)
  const errorToastShownRef = useRef(false);
  // ✅ Best Practice: 마운트 상태 추적 (unmount 후 상태 업데이트 방지)
  const isMountedRef = useRef(true);

  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirmDialogStore();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SWR Key & Fetcher (✅ HTTP API 사용 - WebSocket 분리)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const swrKey = retreatSlug ? `/api/v1/retreat/${retreatSlug}/line-up/user-lineups` : null;

  // ✅ Best Practice: SWR fetcher는 HTTP API 사용
  // WebSocket 연결 실패해도 데이터 로딩은 정상 동작
  const fetcher = useCallback(
    async (url: string): Promise<UserRetreatGbsLineup[]> => {
      const response = await webAxios.get(url);
      return response.data.userRetreatGbsLineups || [];
    },
    []
  );

  // ✅ SWR 사용 (HTTP API 기반)
  const { data, error, isLoading, mutate: mutateSWR } = useSWR<UserRetreatGbsLineup[]>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false, // WebSocket으로 실시간 동기화하므로 비활성화
      revalidateOnReconnect: true,
      refreshInterval: 0, // WebSocket 사용하므로 polling 불필요
      dedupingInterval: 2000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // ✅ Best Practice: 서버 데이터를 fallback으로 활용
      fallbackData: initialData || [],
    }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WebSocket 연결 (✅ 실시간 업데이트 전용 - 선택적)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (!retreatSlug) {
      console.warn('⚠️ [useGbsLineupSwr] No retreatSlug provided');
      return;
    }

    // ✅ 마운트 상태 초기화
    isMountedRef.current = true;
    errorToastShownRef.current = false;

    let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

    try {
      socket = getSocketClient();
      socketRef.current = socket;
    } catch (err) {
      console.warn('⚠️ [useGbsLineupSwr] Failed to initialize socket:', err);
      return;
    }

    // ✅ 연결 성공 시
    const handleConnect = () => {
      if (!isMountedRef.current) return;

      setIsConnected(true);
      errorToastShownRef.current = false; // 연결 성공 시 에러 토스트 플래그 초기화
      console.log('✅ [useGbsLineupSwr] Connected to WebSocket');

      // retreat room 참가
      socket.emit('join-retreat', retreatSlug, (response) => {
        if (response.status === 'OK') {
          console.log('✅ [useGbsLineupSwr] Joined retreat room');
        } else {
          console.warn('⚠️ [useGbsLineupSwr] Failed to join retreat:', response.message);
        }
      });
    };

    // ✅ 다른 사용자의 실시간 업데이트 수신
    const handleLineupUpdated = (updated: UserRetreatGbsLineup) => {
      if (!isMountedRef.current) return;

      console.log('🔔 [useGbsLineupSwr] Received lineup update:', updated.id);

      // ✅ SWR 캐시 직접 업데이트 (즉각적인 반영)
      mutate(
        swrKey,
        (currentData: UserRetreatGbsLineup[] | undefined) => {
          if (!currentData) return currentData;

          return currentData.map((item) =>
            item.id === updated.id ? { ...item, ...updated } : item
          );
        },
        { revalidate: false }
      );
    };

    // ✅ 연결 해제
    const handleDisconnect = (reason: string) => {
      if (!isMountedRef.current) return;

      setIsConnected(false);
      console.log('❌ [useGbsLineupSwr] Disconnected:', reason);
    };

    // ✅ Best Practice: 연결 오류 시 토스트 중복 방지
    const handleConnectError = (error: any) => {
      if (!isMountedRef.current) return;

      console.error('🔴 [useGbsLineupSwr] Connection error:', error.message);

      // ✅ 한 번만 토스트 표시 (무한 루프 방지)
      if (!errorToastShownRef.current) {
        errorToastShownRef.current = true;
        // 토스트 대신 콘솔 경고로 대체 (무한 렌더링 방지)
        // WebSocket 실패해도 HTTP API로 데이터는 정상 로딩됨
        console.warn('⚠️ [useGbsLineupSwr] WebSocket unavailable, using HTTP fallback');
      }
    };

    // ✅ Best Practice: 빈 dependency array - 리스너 한 번만 등록
    socket.on('connect', handleConnect);
    socket.on('lineup-updated', handleLineupUpdated);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // 이미 연결되어 있으면 즉시 처리
    if (socket.connected) {
      handleConnect();
    }

    // ✅ Best Practice: Cleanup - 모든 리스너 제거
    return () => {
      console.log('🧹 [useGbsLineupSwr] Cleaning up');
      isMountedRef.current = false;

      socket.off('connect', handleConnect);
      socket.off('lineup-updated', handleLineupUpdated);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      if (socket.connected) {
        socket.emit('leave-retreat', retreatSlug);
      }
    };
  }, [retreatSlug, swrKey]); // ✅ 최소한의 dependency

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Mutation 함수들 (WebSocket 사용, fallback으로 HTTP)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * GBS 번호 저장 (Optimistic Update)
   */
  const saveGbsNumber = useCallback(
    async (userRetreatRegistrationId: number, gbsNumber: number | null) => {
      // ✅ WebSocket 연결 안 되어 있으면 HTTP fallback
      if (!socketRef.current?.connected) {
        try {
          setIsMutating(true);
          const response = await webAxios.put(
            `/api/v1/retreat/${retreatSlug}/line-up/gbs-number`,
            { userRetreatRegistrationId, gbsNumber }
          );
          await mutateSWR(); // HTTP 성공 후 SWR 캐시 갱신
          addToast({
            title: '성공',
            description: 'GBS 번호가 저장되었습니다.',
            variant: 'success',
          });
          return response.data;
        } catch (error) {
          addToast({
            title: '오류',
            description: 'GBS 번호 저장에 실패했습니다.',
            variant: 'destructive',
          });
          throw error;
        } finally {
          setIsMutating(false);
        }
      }

      console.log(`🔄 [saveGbsNumber] Optimistic update: registration ${userRetreatRegistrationId} → GBS ${gbsNumber}`);

      setIsMutating(true);

      try {
        // ✅ 1. Optimistic Update
        await mutate(
          swrKey,
          (currentData: UserRetreatGbsLineup[] | undefined) => {
            if (!currentData) return currentData;

            return currentData.map((item) =>
              item.id === userRetreatRegistrationId
                ? { ...item, gbsNumber, updatedAt: new Date().toISOString() }
                : item
            );
          },
          { revalidate: false, rollbackOnError: true }
        );

        // ✅ 2. WebSocket 요청
        return new Promise<UserRetreatGbsLineup>((resolve, reject) => {
          socketRef.current!.emit(
            'update-gbs-number',
            { userRetreatRegistrationId, gbsNumber },
            (response) => {
              setIsMutating(false);

              if (response.status === 'OK' && response.data) {
                console.log(`✅ [saveGbsNumber] Server confirmed update`);

                mutate(
                  swrKey,
                  (currentData: UserRetreatGbsLineup[] | undefined) => {
                    if (!currentData) return currentData;
                    return currentData.map((item) =>
                      item.id === response.data!.id
                        ? { ...item, ...response.data! }
                        : item
                    );
                  },
                  { revalidate: false }
                );

                addToast({
                  title: '성공',
                  description: 'GBS 번호가 저장되었습니다.',
                  variant: 'success',
                });

                resolve(response.data);
              } else {
                addToast({
                  title: '오류',
                  description: response.message || 'GBS 번호 저장에 실패했습니다.',
                  variant: 'destructive',
                });
                reject(new Error(response.message));
              }
            }
          );
        });
      } catch (error) {
        setIsMutating(false);
        console.error('❌ [saveGbsNumber] Error:', error);
        throw error;
      }
    },
    [swrKey, addToast, retreatSlug, mutateSWR]
  );

  /**
   * 라인업 메모 저장
   */
  const saveLineupMemo = useCallback(
    async (userRetreatRegistrationId: number, memo: string, color?: string) => {
      // ✅ WebSocket 연결 안 되어 있으면 HTTP fallback
      if (!socketRef.current?.connected) {
        try {
          setIsMutating(true);
          const response = await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/line-up/lineup-memo`,
            { userRetreatRegistrationId, memo: memo.trim(), color }
          );
          await mutateSWR();
          addToast({
            title: '성공',
            description: '메모가 저장되었습니다.',
            variant: 'success',
          });
          return response.data;
        } catch (error) {
          addToast({
            title: '오류',
            description: '메모 저장에 실패했습니다.',
            variant: 'destructive',
          });
          throw error;
        } finally {
          setIsMutating(false);
        }
      }

      console.log(`🔄 [saveLineupMemo] Optimistic update: registration ${userRetreatRegistrationId}`);

      setIsMutating(true);

      try {
        // ✅ 1. Optimistic Update
        if (swrKey) {
          await mutate(
            swrKey,
            (currentData: UserRetreatGbsLineup[] | undefined) => {
              if (!currentData) return currentData;

              return currentData.map((item) =>
                item.id === userRetreatRegistrationId
                  ? {
                      ...item,
                      lineupMemo: memo.trim(),
                      lineupMemocolor: color ?? '',
                      updatedAt: new Date().toISOString(),
                    }
                  : item
              );
            },
            { revalidate: false, rollbackOnError: true }
          );
        }

        // ✅ 2. WebSocket 요청
        return new Promise<UserRetreatGbsLineup>((resolve, reject) => {
          socketRef.current!.emit(
            'create-lineup-memo',
            {
              userRetreatRegistrationId,
              memo: memo.trim(),
              color,
            },
            (response) => {
              setIsMutating(false);

              if (response.status === 'OK' && response.data) {
                console.log('✅ [saveLineupMemo] Server confirmed update');

                mutate(
                  swrKey,
                  (currentData: UserRetreatGbsLineup[] | undefined) => {
                    if (!currentData) return currentData;
                    return currentData.map((item) =>
                      item.id === response.data!.id
                        ? { ...item, ...response.data! }
                        : item
                    );
                  },
                  { revalidate: false }
                );

                addToast({
                  title: '성공',
                  description: '메모가 저장되었습니다.',
                  variant: 'success',
                });

                resolve(response.data);
              } else {
                addToast({
                  title: '오류',
                  description: response.message || '메모 저장에 실패했습니다.',
                  variant: 'destructive',
                });
                reject(new Error(response.message));
              }
            }
          );
        });
      } catch (error) {
        setIsMutating(false);
        console.error('❌ [saveLineupMemo] Error:', error);
        throw error;
      }
    },
    [swrKey, addToast, retreatSlug, mutateSWR]
  );

  /**
   * 라인업 메모 수정
   */
  const updateLineupMemo = useCallback(
    async (userRetreatRegistrationMemoId: number, memo: string, color?: string) => {
      // ✅ WebSocket 연결 안 되어 있으면 HTTP fallback
      if (!socketRef.current?.connected) {
        try {
          setIsMutating(true);
          const response = await webAxios.put(
            `/api/v1/retreat/${retreatSlug}/line-up/lineup-memo/${userRetreatRegistrationMemoId}`,
            { memo: memo.trim(), color }
          );
          await mutateSWR();
          addToast({
            title: '성공',
            description: '메모가 수정되었습니다.',
            variant: 'success',
          });
          return response.data;
        } catch (error) {
          addToast({
            title: '오류',
            description: '메모 수정에 실패했습니다.',
            variant: 'destructive',
          });
          throw error;
        } finally {
          setIsMutating(false);
        }
      }

      console.log(`🔄 [updateLineupMemo] Optimistic update: memoId ${userRetreatRegistrationMemoId}`);

      setIsMutating(true);

      try {
        // ✅ 1. Optimistic Update
        if (swrKey) {
          await mutate(
            swrKey,
            (currentData: UserRetreatGbsLineup[] | undefined) => {
              if (!currentData) return currentData;

              return currentData.map((item) => {
                if (item.lineupMemoId === userRetreatRegistrationMemoId) {
                  return {
                    ...item,
                    lineupMemo: memo.trim(),
                    lineupMemocolor: color ?? '',
                    updatedAt: new Date().toISOString(),
                  };
                }
                return item;
              });
            },
            { revalidate: false, rollbackOnError: true }
          );
        }

        // ✅ 2. WebSocket 요청
        return new Promise<UserRetreatGbsLineup>((resolve, reject) => {
          socketRef.current!.emit(
            'update-lineup-memo',
            {
              userRetreatRegistrationMemoId,
              memo: memo.trim(),
              color,
            },
            (response) => {
              setIsMutating(false);

              if (response.status === 'OK' && response.data) {
                console.log('✅ [updateLineupMemo] Server confirmed update');

                mutate(
                  swrKey,
                  (currentData: UserRetreatGbsLineup[] | undefined) => {
                    if (!currentData) return currentData;
                    return currentData.map((item) =>
                      item.id === response.data!.id
                        ? { ...item, ...response.data! }
                        : item
                    );
                  },
                  { revalidate: false }
                );

                addToast({
                  title: '성공',
                  description: '메모가 수정되었습니다.',
                  variant: 'success',
                });

                resolve(response.data);
              } else {
                addToast({
                  title: '오류',
                  description: response.message || '메모 수정에 실패했습니다.',
                  variant: 'destructive',
                });
                reject(new Error(response.message));
              }
            }
          );
        });
      } catch (error) {
        setIsMutating(false);
        console.error('❌ [updateLineupMemo] Error:', error);
        throw error;
      }
    },
    [swrKey, addToast, retreatSlug, mutateSWR]
  );

  /**
   * 라인업 메모 삭제
   */
  const deleteLineupMemo = useCallback(
    async (userRetreatRegistrationMemoId: number) => {
      return new Promise<void>((resolve, reject) => {
        confirmDialog.show({
          title: '메모 삭제',
          description: '정말로 메모를 삭제하시겠습니까?',
          onConfirm: async () => {
            // ✅ WebSocket 연결 안 되어 있으면 HTTP fallback
            if (!socketRef.current?.connected) {
              try {
                setIsMutating(true);
                await webAxios.delete(
                  `/api/v1/retreat/${retreatSlug}/line-up/lineup-memo/${userRetreatRegistrationMemoId}`
                );
                await mutateSWR();
                addToast({
                  title: '성공',
                  description: '메모가 삭제되었습니다.',
                  variant: 'success',
                });
                resolve();
              } catch (error) {
                addToast({
                  title: '오류',
                  description: '메모 삭제에 실패했습니다.',
                  variant: 'destructive',
                });
                reject(error);
              } finally {
                setIsMutating(false);
              }
              return;
            }

            console.log(`🔄 [deleteLineupMemo] Optimistic update: memoId ${userRetreatRegistrationMemoId}`);

            setIsMutating(true);

            try {
              // ✅ 1. Optimistic Update
              if (swrKey) {
                await mutate(
                  swrKey,
                  (currentData: UserRetreatGbsLineup[] | undefined) => {
                    if (!currentData) return currentData;

                    return currentData.map((item) => {
                      if (item.lineupMemoId === userRetreatRegistrationMemoId) {
                        return {
                          ...item,
                          lineupMemo: '',
                          lineupMemocolor: '',
                          lineupMemoId: null,
                          updatedAt: new Date().toISOString(),
                        };
                      }
                      return item;
                    });
                  },
                  { revalidate: false, rollbackOnError: true }
                );
              }

              // ✅ 2. WebSocket 요청
              socketRef.current!.emit(
                'delete-lineup-memo',
                { userRetreatRegistrationMemoId },
                (response) => {
                  setIsMutating(false);

                  if (response.status === 'OK' && response.data) {
                    console.log(`✅ [deleteLineupMemo] Server confirmed deletion`);

                    mutate(
                      swrKey,
                      (currentData: UserRetreatGbsLineup[] | undefined) => {
                        if (!currentData) return currentData;
                        return currentData.map((item) =>
                          item.id === response.data!.id
                            ? { ...item, ...response.data! }
                            : item
                        );
                      },
                      { revalidate: false }
                    );

                    addToast({
                      title: '성공',
                      description: '메모가 삭제되었습니다.',
                      variant: 'success',
                    });

                    resolve();
                  } else {
                    addToast({
                      title: '오류',
                      description: response.message || '메모 삭제에 실패했습니다.',
                      variant: 'destructive',
                    });
                    reject(new Error(response.message));
                  }
                }
              );
            } catch (error) {
              setIsMutating(false);
              console.error('❌ [deleteLineupMemo] Error:', error);
              reject(error);
            }
          },
        });
      });
    },
    [swrKey, addToast, confirmDialog, retreatSlug, mutateSWR]
  );

  return {
    // 데이터
    data: data || [],
    error,
    isLoading,
    isConnected,
    isMutating,

    // 액션
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,

    // SWR mutate (수동 리페칭)
    refresh: mutateSWR,
  };
}
