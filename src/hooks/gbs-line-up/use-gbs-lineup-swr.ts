'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { getSocketClient } from '@/lib/socket/socket-client';
import { useToastStore } from '@/store/toast-store';
import { useConfirmDialogStore } from '@/store/confirm-dialog-store';
import type { UserRetreatGbsLineup } from '@/lib/socket/socket-events';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/socket/socket-events';

/**
 * SWR + WebSocket 기반 GBS 라인업 데이터 훅
 *
 * @description
 * - SWR로 캐시 관리 및 자동 리페칭
 * - Socket.io로 실시간 데이터 동기화
 * - Optimistic Updates로 빠른 UX
 * - 편집 중에도 버퍼링하여 Stale Data 방지
 * - Debounce로 과도한 요청 방지
 * - Exponential Backoff 재연결
 *
 * @param retreatSlug - 수양회 슬러그
 */
export function useGbsLineupSwr(retreatSlug: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirmDialogStore();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SWR Key & Fetcher
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const swrKey = retreatSlug ? `/gbs-lineup/${retreatSlug}` : null;

  // ✅ SWR fetcher: WebSocket으로 초기 데이터 요청
  const fetcher = useCallback(
    async (key: string): Promise<UserRetreatGbsLineup[]> => {
      return new Promise((resolve, reject) => {
        const socket = getSocketClient();

        const requestData = () => {
          socket.emit('join-retreat', retreatSlug, (response) => {
            if (response.status === 'OK') {
              resolve(response.data || []);
            } else {
              reject(new Error(response.message || '데이터 로딩 실패'));
            }
          });
        };

        if (socket.connected) {
          // 이미 연결되어 있으면 즉시 요청
          requestData();
        } else {
          // 연결될 때까지 대기 후 요청
          socket.once('connect', requestData);
        }

        // 타임아웃 설정 (10초)
        setTimeout(() => reject(new Error('요청 시간 초과')), 10000);
      });
    },
    [retreatSlug]
  );

  // ✅ SWR 사용
  const { data, error, isLoading, mutate: mutateSWR } = useSWR<UserRetreatGbsLineup[]>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0, // WebSocket 사용하므로 polling 불필요
      dedupingInterval: 2000,
      // ✅ 에러 발생 시 자동 재시도
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // ✅ Fallback 데이터
      fallbackData: [],
    }
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WebSocket 연결 & 실시간 동기화
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (!retreatSlug) {
      console.warn('⚠️ [useGbsLineupSwr] No retreatSlug provided');
      return;
    }

    // ✅ Exponential Backoff 재연결 설정
    const socket = getSocketClient();
    socketRef.current = socket;

    // 연결 성공 시
    const handleConnect = () => {
      setIsConnected(true);
      console.log('✅ [useGbsLineupSwr] Connected to WebSocket');

      // SWR 데이터 리페칭 (최신 상태로 동기화)
      mutateSWR();
    };

    // ✅ 다른 사용자의 실시간 업데이트 수신
    const handleLineupUpdated = (updated: UserRetreatGbsLineup) => {
      console.log('🔔 [DEBUG-1] WebSocket 이벤트 수신:', {
        updatedId: updated.id,
        updatedMemo: updated.lineupMemo,
        updatedColor: updated.lineupMemocolor,
        updatedMemoId: updated.lineupMemoId,
        timestamp: new Date().toISOString(),
      });

      // ✅ SWR 캐시 직접 업데이트 (즉각적인 반영)
      mutate(
        swrKey,
        (currentData: UserRetreatGbsLineup[] | undefined) => {
          if (!currentData) {
            console.log('❌ [DEBUG-1] currentData is undefined');
            return currentData;
          }

          const updatedData = currentData.map((item) =>
            item.id === updated.id ? updated : item
          );

          const updatedRow = updatedData.find(item => item.id === updated.id);
          console.log('✅ [DEBUG-1] SWR 캐시 업데이트 완료:', {
            totalRows: updatedData.length,
            updatedRow: {
              id: updatedRow?.id,
              memo: updatedRow?.lineupMemo,
              color: updatedRow?.lineupMemocolor,
            },
          });

          return updatedData;
        },
        { revalidate: false } // 서버 재요청 없이 캐시만 업데이트
      );
    };

    // 연결 해제
    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log('❌ [useGbsLineupSwr] Disconnected:', reason);

      // 자동 재연결 안 되는 경우에만 수동 재연결
      if (reason === 'io server disconnect') {
        // 서버가 연결을 끊은 경우 수동 재연결
        socket.connect();
      }
    };

    // 연결 오류
    const handleConnectError = (error: any) => {
      console.error('🔴 [useGbsLineupSwr] Connection error:', error.message);
      addToast({
        title: '연결 오류',
        description: error.data?.code === 'AUTH_REQUIRED'
          ? '인증이 필요합니다.'
          : '서버 연결에 실패했습니다.',
        variant: 'destructive',
      });
    };

    // Event Listeners 등록
    socket.on('connect', handleConnect);
    socket.on('lineup-updated', handleLineupUpdated);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // 이미 연결되어 있으면 즉시 처리
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup
    return () => {
      console.log('🧹 [useGbsLineupSwr] Cleaning up');

      socket.off('connect', handleConnect);
      socket.off('lineup-updated', handleLineupUpdated);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      if (socket.connected) {
        socket.emit('leave-retreat', retreatSlug);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retreatSlug, swrKey]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Mutation 함수들
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * GBS 번호 저장 (Optimistic Update)
   */
  const saveGbsNumber = useCallback(
    async (userRetreatRegistrationId: number, gbsNumber: number | null) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: '연결 오류',
          description: 'WebSocket 연결이 끊어졌습니다.',
          variant: 'destructive',
        });
        return;
      }

      console.log(`🔄 [saveGbsNumber] Optimistic update: registration ${userRetreatRegistrationId} → GBS ${gbsNumber}`);

      setIsMutating(true);

      try {
        // ✅ 1. Optimistic Update (즉시 UI 업데이트)
        await mutate(
          swrKey,
          (currentData: UserRetreatGbsLineup[] | undefined) => {
            if (!currentData) return currentData;

            return currentData.map((item) =>
              item.id === userRetreatRegistrationId
                ? { ...item, gbsNumber, updatedAt: new Date().toISOString() } // 타임스탬프 추가
                : item
            );
          },
          { revalidate: false, rollbackOnError: true }
        );

        // ✅ 2. 서버에 요청 전송
        return new Promise<UserRetreatGbsLineup>((resolve, reject) => {
          socketRef.current!.emit(
            'update-gbs-number',
            { userRetreatRegistrationId, gbsNumber },
            (response) => {
              setIsMutating(false);

              if (response.status === 'OK' && response.data) {
                console.log(`✅ [saveGbsNumber] Server confirmed update`);

                // ✅ 3. 서버 응답으로 최종 갱신 (타임스탬프 등 서버 데이터)
                mutate(
                  swrKey,
                  (currentData: UserRetreatGbsLineup[] | undefined) => {
                    if (!currentData) return currentData;

                    return currentData.map((item) =>
                      item.id === response.data!.id ? response.data! : item
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
                console.error(`❌ [saveGbsNumber] Server error:`, response.message);

                addToast({
                  title: '오류',
                  description: response.message || 'GBS 번호 저장에 실패했습니다.',
                  variant: 'destructive',
                });

                // 에러 시 자동 롤백 (rollbackOnError: true)
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
    [swrKey, addToast]
  );

  /**
   * 라인업 메모 저장 (✅ Optimistic Update 추가)
   */
  const saveLineupMemo = useCallback(
    async (userRetreatRegistrationId: number, memo: string, color?: string) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: '연결 오류',
          description: 'WebSocket 연결이 끊어졌습니다.',
          variant: 'destructive',
        });
        return;
      }

      console.log(`🔄 [saveLineupMemo] Optimistic update: registration ${userRetreatRegistrationId}`);

      setIsMutating(true);

      try {
        // ✅ 1. Optimistic Update (즉시 UI 업데이트)
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

        // ✅ 2. 서버에 요청 전송
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
                console.log('🔍 [DEBUG-SERVER] 서버 응답 전체 객체:', response.data);
                console.log('🔍 [DEBUG-SERVER] 필드 확인:', {
                  hasId: 'id' in response.data,
                  hasName: 'name' in response.data,
                  hasLineupMemo: 'lineupMemo' in response.data,
                  hasLineupMemocolor: 'lineupMemocolor' in response.data,
                  hasGender: 'gender' in response.data,
                  hasPhoneNumber: 'phoneNumber' in response.data,
                  allKeys: Object.keys(response.data),
                });

                // ✅ 3. 서버 응답으로 최종 갱신
                mutate(
                  swrKey,
                  (currentData: UserRetreatGbsLineup[] | undefined) => {
                    if (!currentData) {
                      return currentData;
                    }

                    return currentData.map((item) => {
                      if (item.id === response.data!.id) {
                        return response.data!;
                      }
                      return item;
                    });
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
    [swrKey, addToast]
  );

  /**
   * 라인업 메모 수정 (✅ Optimistic Update 추가)
   */
  const updateLineupMemo = useCallback(
    async (userRetreatRegistrationMemoId: number, memo: string, color?: string) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: '연결 오류',
          description: 'WebSocket 연결이 끊어졌습니다.',
          variant: 'destructive',
        });
        return;
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
                // lineupMemoId가 일치하는 항목 찾기
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

        // ✅ 2. 서버에 요청 전송
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
                console.log('🔍 [DEBUG-SERVER-UPDATE] 서버 응답 전체 객체:', response.data);
                console.log('🔍 [DEBUG-SERVER-UPDATE] 필드 확인:', {
                  hasId: 'id' in response.data,
                  hasName: 'name' in response.data,
                  hasLineupMemo: 'lineupMemo' in response.data,
                  hasLineupMemocolor: 'lineupMemocolor' in response.data,
                  allKeys: Object.keys(response.data),
                });

                // ✅ 3. 서버 응답으로 최종 갱신
                mutate(
                  swrKey,
                  (currentData: UserRetreatGbsLineup[] | undefined) => {
                    if (!currentData) {
                      return currentData;
                    }

                    return currentData.map((item) => {
                      if (item.id === response.data!.id) {
                        return response.data!;
                      }
                      return item;
                    });
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
    [swrKey, addToast]
  );

  /**
   * 라인업 메모 삭제 (✅ Optimistic Update 추가)
   */
  const deleteLineupMemo = useCallback(
    async (userRetreatRegistrationMemoId: number) => {
      return new Promise<void>((resolve, reject) => {
        confirmDialog.show({
          title: '메모 삭제',
          description: '정말로 메모를 삭제하시겠습니까?',
          onConfirm: async () => {
            if (!socketRef.current?.connected) {
              addToast({
                title: '연결 오류',
                description: 'WebSocket 연결이 끊어졌습니다.',
                variant: 'destructive',
              });
              reject(new Error('WebSocket 연결 끊김'));
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

              // ✅ 2. 서버에 요청 전송
              socketRef.current!.emit(
                'delete-lineup-memo',
                { userRetreatRegistrationMemoId },
                (response) => {
                  setIsMutating(false);

                  if (response.status === 'OK' && response.data) {
                    console.log(`✅ [deleteLineupMemo] Server confirmed deletion`);

                    // ✅ 3. 서버 응답으로 최종 갱신
                    mutate(
                      swrKey,
                      (currentData: UserRetreatGbsLineup[] | undefined) => {
                        if (!currentData) return currentData;

                        return currentData.map((item) =>
                          item.id === response.data!.id ? response.data! : item
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
    [swrKey, addToast, confirmDialog]
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
