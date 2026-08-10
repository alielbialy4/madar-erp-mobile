import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import type { DialogIconName, DialogTone } from '@/constants/dialogTheme';

export type AppDialogConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  icon?: DialogIconName;
  destructive?: boolean;
};

export type AppDialogAlertOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: DialogTone;
  icon?: DialogIconName;
};

type ActiveDialog =
  | ({
      id: number;
      mode: 'confirm';
      resolve: (value: boolean) => void;
    } & Required<Pick<AppDialogConfirmOptions, 'title' | 'message'>> &
      Omit<AppDialogConfirmOptions, 'title' | 'message' | 'destructive'> & { tone: DialogTone })
  | ({
      id: number;
      mode: 'alert';
      resolve: (value: void) => void;
    } & Required<Pick<AppDialogAlertOptions, 'title' | 'message'>> &
      Omit<AppDialogAlertOptions, 'title' | 'message'> & { tone: DialogTone });

type AppDialogContextValue = {
  confirm: (options: AppDialogConfirmOptions) => Promise<boolean>;
  alert: (options: AppDialogAlertOptions) => Promise<void>;
  dismiss: () => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

let dialogSeq = 0;
let imperativeApi: AppDialogContextValue | null = null;

function resolveConfirmTone(options: AppDialogConfirmOptions): DialogTone {
  if (options.destructive) return 'danger';
  return options.tone ?? 'primary';
}

/** Imperative proxy for helpers/services after the provider has mounted. */
export const appDialog: AppDialogContextValue = {
  confirm: (options) => {
    if (!imperativeApi) {
      if (__DEV__) console.warn('[appDialog] confirm called before AppDialogProvider mounted');
      return Promise.resolve(false);
    }
    return imperativeApi.confirm(options);
  },
  alert: (options) => {
    if (!imperativeApi) {
      if (__DEV__) console.warn('[appDialog] alert called before AppDialogProvider mounted');
      return Promise.resolve();
    }
    return imperativeApi.alert(options);
  },
  dismiss: () => {
    imperativeApi?.dismiss();
  },
};

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext);
  if (!ctx) throw new Error('useAppDialog must be used within AppDialogProvider');
  return ctx;
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const queueRef = useRef<ActiveDialog[]>([]);
  const activeRef = useRef<ActiveDialog | null>(null);
  const [active, setActive] = useState<ActiveDialog | null>(null);

  const setActiveDialog = useCallback((next: ActiveDialog | null) => {
    activeRef.current = next;
    setActive(next);
  }, []);

  const presentNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setActiveDialog(next);
  }, [setActiveDialog]);

  const enqueue = useCallback((entry: ActiveDialog) => {
    if (activeRef.current == null) {
      setActiveDialog(entry);
      return;
    }
    queueRef.current.push(entry);
  }, [setActiveDialog]);

  const confirm = useCallback((options: AppDialogConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      dialogSeq += 1;
      enqueue({
        id: dialogSeq,
        mode: 'confirm',
        resolve,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        icon: options.icon,
        tone: resolveConfirmTone(options),
      });
    });
  }, [enqueue]);

  const alertFn = useCallback((options: AppDialogAlertOptions) => {
    return new Promise<void>((resolve) => {
      dialogSeq += 1;
      enqueue({
        id: dialogSeq,
        mode: 'alert',
        resolve,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        icon: options.icon,
        tone: options.tone ?? 'info',
      });
    });
  }, [enqueue]);

  const finish = useCallback((result: boolean) => {
    const current = activeRef.current;
    if (!current) return;
    setActiveDialog(null);
    if (current.mode === 'confirm') current.resolve(result);
    else current.resolve();
    requestAnimationFrame(() => presentNext());
  }, [presentNext, setActiveDialog]);

  const dismiss = useCallback(() => {
    finish(false);
  }, [finish]);

  const api = useMemo<AppDialogContextValue>(
    () => ({ confirm, alert: alertFn, dismiss }),
    [confirm, alertFn, dismiss],
  );

  useEffect(() => {
    imperativeApi = api;
    return () => {
      if (imperativeApi === api) imperativeApi = null;
    };
  }, [api]);

  return (
    <AppDialogContext.Provider value={api}>
      {children}
      {active ? (
        <ConfirmDialog
          key={active.id}
          visible
          title={active.title}
          message={active.message}
          confirmLabel={active.confirmLabel ?? (active.mode === 'alert' ? 'حسناً' : 'تأكيد')}
          cancelLabel={active.mode === 'confirm' ? (active.cancelLabel ?? 'إلغاء') : undefined}
          tone={active.tone}
          icon={active.icon}
          hideCancel={active.mode === 'alert'}
          onConfirm={() => finish(true)}
          onCancel={active.mode === 'confirm' ? () => finish(false) : undefined}
        />
      ) : null}
    </AppDialogContext.Provider>
  );
}
