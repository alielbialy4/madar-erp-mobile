import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { create } from 'zustand';

type NetworkState = {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  lastOnlineAt: string | null;
  start: () => () => void;
};

let unsubscribe: NetInfoSubscription | null = null;
let syncCallback: (() => Promise<void>) | null = null;

export function registerAutoSyncCallback(cb: () => Promise<void>) {
  syncCallback = cb;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  isInternetReachable: null,
  lastOnlineAt: null,
  start: () => {
    if (unsubscribe) return () => undefined;
    unsubscribe = NetInfo.addEventListener((state) => {
      const reachable = state.isInternetReachable;
      const wasOnline = get().isOnline;
      const nowOnline = Boolean(state.isConnected && reachable !== false);
      set({
        isInternetReachable: reachable,
        isOnline: nowOnline,
        ...(nowOnline ? { lastOnlineAt: new Date().toISOString() } : {}),
      });
      if (!wasOnline && nowOnline && syncCallback) {
        void syncCallback();
      }
    });
    void NetInfo.fetch().then((state) => {
      const reachable = state.isInternetReachable;
      const nowOnline = Boolean(state.isConnected && reachable !== false);
      set({
        isInternetReachable: reachable,
        isOnline: nowOnline,
        ...(nowOnline ? { lastOnlineAt: new Date().toISOString() } : {}),
      });
    });
    return () => {
      unsubscribe?.();
      unsubscribe = null;
    };
  },
}));
