import type { FinancialAccount, Customer, PosCheckoutPaymentType } from '@/types/api';
import { availablePaymentAccounts, type PosCashTargetContext } from './paymentAccounts';

export type MobilePaymentMethod = PosCheckoutPaymentType;

type Input = {
  branchId?: string | null;
  branchSettings?: Record<string, unknown> | null;
  financialAccounts: FinancialAccount[];
  cashTarget: PosCashTargetContext;
  hasOpenShift: boolean;
  hasActiveRegisterSession: boolean;
  selectedCustomer: Customer | null;
  walletBalance: number | null;
  amountDue: number;
  online: boolean;
};

const CONFIGURABLE = [
  'cash',
  'card',
  'electronic_wallet',
  'instapay',
  'bank_transfer',
  'payment_gateway',
  'wallet',
  'credit',
  'layaway',
] as const;

const SPLIT_LINE_METHODS = new Set<string>([
  'cash',
  'card',
  'electronic_wallet',
  'instapay',
  'bank_transfer',
  'payment_gateway',
  'wallet',
]);

export function selectMobilePaymentMethods(input: Input): {
  availableMethods: MobilePaymentMethod[];
  splitEligible: boolean;
} {
  const available = new Set<string>();
  const policy = input.branchSettings?.pos_accepted_payment_methods;
  const permits = (method: (typeof CONFIGURABLE)[number]) => {
    if (!input.branchId) return false;
    if (!policy || typeof policy !== 'object' || Array.isArray(policy)) return true;
    return (policy as Record<string, unknown>)[method] === true;
  };
  const cashAccounts = availablePaymentAccounts(input.financialAccounts, 'cash', input.cashTarget);
  const cashContextReady = input.hasOpenShift
    && (input.cashTarget.mode !== 'register_session_drawer' || input.hasActiveRegisterSession)
    && cashAccounts.length > 0;
  if (permits('cash') && cashContextReady) available.add('cash');

  for (const method of ['card', 'electronic_wallet', 'instapay', 'bank_transfer', 'payment_gateway'] as const) {
    if (permits(method) && input.online && availablePaymentAccounts(input.financialAccounts, method, input.cashTarget).length > 0) {
      available.add(method);
    }
  }

  const customer = input.selectedCustomer;
  const hasCustomer = Boolean(customer?.id);
  const due = Math.max(0, Number(input.amountDue) || 0);
  if (permits('wallet') && input.online && hasCustomer && input.walletBalance != null && input.walletBalance + 0.01 >= due) {
    available.add('wallet');
  }
  if (permits('credit') && input.online && hasCustomer) {
    const limit = customer?.credit_limit;
    const debt = Math.max(0, Number(customer?.debt ?? 0) || 0);
    if (limit == null || limit === '' || (Number.isFinite(Number(limit)) && Number(limit) + 0.01 >= debt + due)) {
      available.add('credit');
    }
  }
  if (permits('layaway') && input.online && hasCustomer) available.add('layaway');

  const splitEligible = [...available].filter((method) => SPLIT_LINE_METHODS.has(method)).length >= 2;
  if (splitEligible) available.add('split');
  if (input.online && available.has('cash')) available.add('gift_card');

  return {
    availableMethods: [...available] as MobilePaymentMethod[],
    splitEligible,
  };
}
