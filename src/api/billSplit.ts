import { post } from './client';

export type SplitByItemsRequest = {
  type: 'items';
  splits: Array<{
    items: number[];
    customer_id?: number;
    payment_type?: string;
    notes?: string;
  }>;
};

export type SplitByAmountRequest = {
  type: 'amount';
  amounts: Array<{
    amount: number;
    customer_id?: number;
    payment_type?: string;
  }>;
};

export type SplitEquallyRequest = {
  type: 'equal';
  ways: number;
};

export type SplitRequest = SplitByItemsRequest | SplitByAmountRequest | SplitEquallyRequest;

export const billSplitAPI = {
  split: (saleId: number, data: SplitRequest) => post(`/pos/sales/${saleId}/split`, data),
  merge: (saleIds: number[]) => post('/pos/sales/merge', { sale_ids: saleIds }),
};
