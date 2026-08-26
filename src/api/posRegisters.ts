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
    print_sequence_start?: number | null
    print_sequence_last?: number | null
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

export type RegisterReconciliationAdjustment = {
  id: string
  branch_id?: string
  shift_id?: string
  register_session_id: string
  source?: string
  amount: string
  direction: string
  reason?: string | null
  review_status: string
  review_note?: string | null
  created_at?: string
  register?: { uuid?: string; code?: string; name?: string }
  cashier?: { id?: number | null; name?: string | null }
  expected_cash?: string | null
  current_expected_cash?: string | null
  original_close_expected?: string | null
  counted_cash?: string | null
  variance?: string | null
  effective_variance?: string | null
  original_close_variance?: string | null
}

export type RegisterRollupSession = {
  uuid: string
  status: string
  opening_cash?: string
  expected_cash?: string
  current_expected_cash?: string | null
  original_close_expected?: string | null
  counted_cash?: string | null
  variance?: string | null
  raw_variance?: string | null
  effective_variance?: string | null
  original_close_variance?: string | null
  variance_severity?: string | null
  late_adjustment_count?: number
  server_pending_offline_count?: number
  reconciliation_state?: string | null
  last_activity_at?: string | null
  register?: { uuid?: string; code?: string; name?: string }
  cashier?: { id?: number; name?: string | null } | null
  metrics?: Record<string, string | boolean | null>
}

export type RegisterManagerDashboard = {
  open_session_count?: number
  review_required_count?: number
  server_pending_offline_count?: number
  rollup?: {
    expected_cash?: string | number | null
    counted_cash?: string | number | null
    is_count_complete?: boolean
    raw_variance?: string | number | null
    variance?: string | number | null
    total_shortage?: string | number | null
    total_overage?: string | number | null
    has_individual_variances?: boolean
    variance_severity?: string | null
    sessions?: RegisterRollupSession[]
  } | null
  registers?: Array<{
    uuid: string
    code: string
    name?: string
    reconciliation_status?: string | null
    current_session?: {
      uuid: string
      status: string
      expected_cash?: string | null
      cashier?: { id?: number; name?: string | null } | null
    } | null
  }> | null
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
  openSession: async (id: string, payload: { opening_cash: string; idempotency_key?: string; print_sequence_start?: number }) =>
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
  getShiftSessionSummary: async (shiftId: string) =>
    (await apiClient.get(`/shifts/${shiftId}/register-sessions/summary`)).data.data,
  getManagerDashboard: async (shiftId: string) =>
    (await apiClient.get<One<RegisterManagerDashboard>>(`/shifts/${shiftId}/register-manager-dashboard`)).data.data,
  listReconciliationAdjustments: async (status: 'open' | 'all' | 'resolved' = 'open', params?: { shift_id?: string }) =>
    (await apiClient.get<One<{ items: RegisterReconciliationAdjustment[]; open_count: number }>>(
      '/register-reconciliation-adjustments',
      { params: { status, ...params } },
    )).data.data,
  resolveReconciliationAdjustment: async (id: string, note?: string) =>
    (await apiClient.post(`/register-reconciliation-adjustments/${id}/resolve`, { note })).data.data,
  eligibleRefundSessions: async (params?: { sale_id?: string | number; shift_id?: string }) =>
    (await apiClient.get<One<EligibleRegisterMoneySession[]>>('/eligible-register-money-sessions', { params })).data.data,
}
