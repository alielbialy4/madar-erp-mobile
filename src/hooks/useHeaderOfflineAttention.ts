import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { countByStatus, getPendingOrders } from '@/services/offline/posOrders';
import { getOfflineQueue } from '@/services/offline/queue';
import { countTableOpsByStatus, getTableOpsQueue } from '@/services/offline/tableOps';
import { storageGet, storageKeys } from '@/services/storage';
import { usePosStore } from '@/store/posStore';

export type HeaderOfflineAttention = {
  pendingPosOrders: number;
  failedPosOrders: number;
  pendingMutations: number;
  failedMutations: number;
  mutationConflicts: number;
  pendingTableOps: number;
  failedTableOps: number;
  attentionCount: number;
  otherOpsAttention: number;
  hasFailuresOrConflicts: boolean;
  lastSuccessAt: string | null;
  refresh: () => Promise<void>;
};

type AttentionSnapshot = Omit<HeaderOfflineAttention, 'refresh'>;

const EMPTY: AttentionSnapshot = {
  pendingPosOrders: 0,
  failedPosOrders: 0,
  pendingMutations: 0,
  failedMutations: 0,
  mutationConflicts: 0,
  pendingTableOps: 0,
  failedTableOps: 0,
  attentionCount: 0,
  otherOpsAttention: 0,
  hasFailuresOrConflicts: false,
  lastSuccessAt: null,
};

const POLL_MS = 60_000;

function sameAttention(a: AttentionSnapshot, b: AttentionSnapshot): boolean {
  return (
    a.pendingPosOrders === b.pendingPosOrders &&
    a.failedPosOrders === b.failedPosOrders &&
    a.pendingMutations === b.pendingMutations &&
    a.failedMutations === b.failedMutations &&
    a.mutationConflicts === b.mutationConflicts &&
    a.pendingTableOps === b.pendingTableOps &&
    a.failedTableOps === b.failedTableOps &&
    a.attentionCount === b.attentionCount &&
    a.otherOpsAttention === b.otherOpsAttention &&
    a.hasFailuresOrConflicts === b.hasFailuresOrConflicts &&
    a.lastSuccessAt === b.lastSuccessAt
  );
}

export function useHeaderOfflineAttention(): HeaderOfflineAttention {
  const pendingOrdersLen = usePosStore((s) => s.pendingOrders.length);
  const [state, setState] = useState(EMPTY);
  const stateRef = useRef(state);
  stateRef.current = state;

  const refresh = useCallback(async () => {
    try {
      const [orders, mutations, tableOps, lastSuccessAt] = await Promise.all([
        getPendingOrders(),
        getOfflineQueue(),
        getTableOpsQueue(),
        storageGet<string>(storageKeys.syncLastSuccessAt),
      ]);

      const pos = countByStatus(orders);
      const pendingMutations = mutations.filter((m) => m.status === 'pending' || m.status === 'syncing').length;
      const failedMutations = mutations.filter((m) => m.status === 'failed').length;
      const mutationConflicts = 0;
      const table = countTableOpsByStatus(tableOps);

      const attentionCount =
        pos.pending +
        pos.failed +
        pendingMutations +
        failedMutations +
        mutationConflicts +
        table.pending +
        table.failed;

      const otherOpsAttention = failedMutations + mutationConflicts;

      const next: AttentionSnapshot = {
        pendingPosOrders: pos.pending,
        failedPosOrders: pos.failed,
        pendingMutations,
        failedMutations,
        mutationConflicts,
        pendingTableOps: table.pending,
        failedTableOps: table.failed,
        attentionCount,
        otherOpsAttention,
        hasFailuresOrConflicts: pos.failed > 0 || failedMutations > 0 || table.failed > 0 || mutationConflicts > 0,
        lastSuccessAt: typeof lastSuccessAt === 'string' ? lastSuccessAt : null,
      };

      if (!sameAttention(stateRef.current, next)) {
        setState(next);
      }
    } catch {
      if (!sameAttention(stateRef.current, EMPTY)) {
        setState(EMPTY);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pendingOrdersLen]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startTimer = () => {
      stopTimer();
      timer = setInterval(() => {
        void refresh();
      }, POLL_MS);
    };

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void refresh();
        startTimer();
      } else {
        stopTimer();
      }
    };

    if (AppState.currentState === 'active') {
      startTimer();
    }

    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      sub.remove();
      stopTimer();
    };
  }, [refresh]);

  return { ...state, refresh };
}

export async function recordSyncSuccessAt(iso = new Date().toISOString()): Promise<void> {
  const { storageSet } = await import('@/services/storage');
  await storageSet(storageKeys.syncLastSuccessAt, iso);
}
