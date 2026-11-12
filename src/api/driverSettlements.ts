import type { ListParams } from '@/types/api';
import { get, post } from './client';

export type DriverSettlementDepositTarget = 'current_drawer' | 'other_vault';

export type DriverSettlementPayload = {
  branch_id?: string | null;
  driver_id: string;
  delivery_ids: string[];
  amount_received: number;
  deposit_target?: DriverSettlementDepositTarget;
  confirm_physical_vault_deposit?: boolean;
  vault_id?: string;
  pos_register_id?: string;
  register_session_id?: string;
  notes?: string | null;
  client_uuid?: string;
};

export type DriverSettlementDepositContext = {
  open_shift: {
    id: string;
    shift_no?: number | null;
    vault_id?: string | null;
    vault_name?: string | null;
    drawer_ledger_enabled?: boolean;
  } | null;
  default_deposit_target: DriverSettlementDepositTarget;
  available_vaults: Array<{ id: string; name: string }>;
};

export type DriverSettlementUnsettledRow = {
  delivery: {
    id: string;
    collected_amount?: number | null;
    driver_earning?: number | null;
    amount_due_from_driver?: number | null;
    delivered_at?: string | null;
    customer_phone?: string | null;
    sale?: {
      invoice_number?: string | null;
      customer?: { name?: string | null; phone?: string | null } | null;
    } | null;
  };
  driver_earning_preview?: number;
  due_preview?: number;
};

export type DriverSettlementUnsettledPayload = {
  deliveries: DriverSettlementUnsettledRow[];
  totals: {
    count: number;
    total_collected: number;
    total_driver_earnings: number;
    total_due_from_driver: number;
  };
  deposit_context: DriverSettlementDepositContext;
};

export type DriverSettlementQueueDriver = {
  driver_id: string;
  driver_name: string;
  driver_phone?: string | null;
  deliveries_count: number;
  total_collected: number;
  total_driver_earnings: number;
  total_due_from_driver: number;
  oldest_delivered_at?: string | null;
};

export type DriverSettlementQueuePayload = {
  drivers: DriverSettlementQueueDriver[];
  totals: {
    drivers_count: number;
    deliveries_count: number;
    total_due_from_driver: number;
  };
  deposit_context: DriverSettlementDepositContext;
};

/** Driver COD settlements — matches web `api/driverSettlements` contracts. */
export const driverSettlementsAPI = {
  queue: (params?: { branch_id?: string; q?: string }) =>
    get<DriverSettlementQueuePayload>('/driver-settlements/queue', params),
  unsettled: (params?: ListParams & { driver_id?: string; branch_id?: string }) =>
    get<DriverSettlementUnsettledPayload>('/driver-settlements/unsettled', params),
  list: (params?: ListParams) => get('/driver-settlements', params),
  get: (id: string) => get(`/driver-settlements/${id}`),
  create: (payload: DriverSettlementPayload) => post('/driver-settlements', payload),
};
