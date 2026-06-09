import { useCallback, useEffect, useState } from 'react';
import { branchesManageAPI } from '@/api/branchesManage';
import {
  countBranchPrinters,
  getBranchPrintBinding,
  resolveReceiptProfile,
} from '@/services/printing/branchPrintBinding';
import { parseBranchSettingsObject } from '@/utils/branchSettings';
import { extractData } from '@/utils/data';
import type { BranchManageRow } from '@/types/branches';

export type BranchPrintSummary = {
  loading: boolean;
  branchName: string | null;
  printerCount: number;
  defaultReceiptName: string | null;
  hasDefaultReceipt: boolean;
  autoPrintReceipt: boolean;
  enableKitchenPrint: boolean;
  useServerKitchenQueue: boolean;
};

const emptySummary = (): BranchPrintSummary => ({
  loading: true,
  branchName: null,
  printerCount: 0,
  defaultReceiptName: null,
  hasDefaultReceipt: false,
  autoPrintReceipt: false,
  enableKitchenPrint: false,
  useServerKitchenQueue: false,
});

export function useBranchPrintSummary(branchId: string): BranchPrintSummary {
  const [summary, setSummary] = useState<BranchPrintSummary>(emptySummary);

  const load = useCallback(async () => {
    if (!branchId) {
      setSummary({ ...emptySummary(), loading: false });
      return;
    }
    setSummary((s) => ({ ...s, loading: true }));
    try {
      const [branchRes, printerCount, binding, profile] = await Promise.all([
        branchesManageAPI.get(branchId).catch(() => null),
        countBranchPrinters(branchId),
        getBranchPrintBinding(branchId),
        resolveReceiptProfile(branchId),
      ]);
      const branch = branchRes ? extractData<BranchManageRow>(branchRes) : null;
      const raw =
        branch?.settings && typeof branch.settings === 'object'
          ? (branch.settings as Record<string, unknown>)
          : undefined;
      const settings = parseBranchSettingsObject(raw);

      setSummary({
        loading: false,
        branchName: branch?.name ?? null,
        printerCount,
        defaultReceiptName: profile?.name ?? null,
        hasDefaultReceipt: Boolean(binding?.defaultReceiptProfileId && profile),
        autoPrintReceipt: settings.auto_print_receipt,
        enableKitchenPrint: settings.enable_kitchen_print,
        useServerKitchenQueue: settings.use_server_kitchen_print_queue,
      });
    } catch {
      setSummary({ ...emptySummary(), loading: false });
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  return summary;
}
