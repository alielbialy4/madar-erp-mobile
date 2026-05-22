import { post } from './client';

export const cashMovementsAPI = {
  create: (shiftId: string, data: { type: 'cash_in' | 'cash_out'; amount: number; reason: string; notes?: string }) => post(`/shifts/${shiftId}/cash-movement`, data),
};
