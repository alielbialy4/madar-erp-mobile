import { apiClient } from './client'

type One<T> = { status: string; data: T }

export type MobilePosRegister = {
  uuid: string
  code: string
  name: string
  is_active: boolean
  paired_device_uuid?: string | null
  drawer?: {
    financial_account_id?: string | null
    name?: string | null
    account_type?: string | null
    current_balance?: string | null
  } | null
  current_session?: {
    uuid: string
    status: string
    expected_cash?: string
    cashier?: { id?: number; name?: string | null }
  } | null
}

export type EligibleRegisterMoneySession = {
  uuid: string
  register?: { uuid?: string; code?: string; name?: string }
  cashier?: { id?: number; name?: string | null }
  drawer?: { financial_account_id?: string | null; name?: string | null; account_type?: string | null }
  expected_cash?: string | null
  opened_at?: string | null
}

export type MobileRegisterSession = {
  uuid?: string
  id?: string
  status: string
  expected_cash?: string
  expected_cash_snapshot?: string
  counted_cash?: string | null
  variance?: string | null
  register?: { uuid?: string; code?: string; name?: string }
  cashier?: { id?: number; name?: string | null }
}

export const posRegistersAPI = {
  list: async () => (await apiClient.get<One<MobilePosRegister[]>>('/pos-registers')).data.data,
  validatePairing: async (payload: { device_uuid: string; pos_register_id?: string }) =>
    (await apiClient.post<One<{ valid: boolean; reason: string | null; register: MobilePosRegister | null }>>(
      '/pos-registers/validate-pairing',
      payload,
    )).data.data,
  pair: async (id: string, payload: { device_uuid: string; device_label?: string }) =>
    (await apiClient.post<One<MobilePosRegister>>(`/pos-registers/${id}/pair`, payload)).data.data,
  openSession: async (id: string, payload: { opening_cash: string; idempotency_key?: string }) =>
    (await apiClient.post<One<MobileRegisterSession>>(`/pos-registers/${id}/sessions`, payload)).data.data,
  closeSession: async (
    sessionId: string,
    payload: {
      closing_counted_cash: string
      reason?: string
      has_local_pending_cash?: boolean
      idempotency_key?: string
    },
  ) => (await apiClient.post<One<MobileRegisterSession>>(`/register-sessions/${sessionId}/close`, payload)).data.data,
  forceCloseSession: async (
    sessionId: string,
    payload: { closing_counted_cash: string; reason: string; idempotency_key?: string },
  ) =>
    (await apiClient.post<One<MobileRegisterSession>>(`/register-sessions/${sessionId}/force-close`, payload)).data
      .data,
  getSession: async (sessionId: string) =>
    (await apiClient.get<One<MobileRegisterSession>>(`/register-sessions/${sessionId}`)).data.data,
  eligibleRefundSessions: async (params?: { sale_id?: string | number; shift_id?: string }) =>
    (await apiClient.get<One<EligibleRegisterMoneySession[]>>('/eligible-register-money-sessions', { params })).data.data,
}
