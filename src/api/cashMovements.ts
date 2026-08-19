import { post } from './client';

export type CashMovementSource = 'drawer' | 'vault' | 'drop_to_vault';

export const cashMovementsAPI = {
  create: (
    shiftId: string,
    data: {
      type: 'cash_in' | 'cash_out';
      amount: number;
      reason: string;
      notes?: string;
      source?: CashMovementSource;
      vault_id?: string;
      idempotency_key?: string;
      pos_register_id?: string;
      register_session_id?: string;
    },
  ) => post(`/shifts/${shiftId}/cash-movement`, data),
};
