import React, { useEffect } from 'react';
import { View } from 'react-native';
import { screenRtl } from '@/constants/layout';
import { AppLoadingState } from '@/components/feedback';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore, registerAutoSyncCallback } from '@/store/networkStore';
import { syncAll, startSyncInterval } from '@/services/sync/syncService';
import { usePrintStore } from '@/store/printStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';

registerAutoSyncCallback(async () => {
  const token = useAuthStore.getState().token;
  const branch = useBranchStore.getState().activeBranch;
  if (!token || !branch?.id) return;
  try {
    await syncAll();
  } catch (err) {
    if (__DEV__) {
      console.warn('[sync] auto-sync on reconnect failed', err);
    }
  }
});

export function RootNavigator() {
  const bootstrapping = useAuthStore((state) => state.bootstrapping);
  const token = useAuthStore((state) => state.token);
  const startNetwork = useNetworkStore((state) => state.start);

  useEffect(() => {
    const stop = startNetwork();
    const stopSyncInterval = startSyncInterval(60_000);
    void usePrintStore.getState().refresh();
    return () => {
      stop();
      stopSyncInterval();
    };
  }, [startNetwork]);

  if (bootstrapping) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center' }, screenRtl]}>
        <AppLoadingState message="جاري التحقق من الجلسة..." />
      </View>
    );
  }

  return token ? <MainTabs /> : <AuthNavigator />;
}
