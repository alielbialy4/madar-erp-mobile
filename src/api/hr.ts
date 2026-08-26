import { get, post, put } from './client';

export type EmploymentStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday';
export type AdjustmentType = 'incentive' | 'penalty';
export type PayrollRunStatus = 'draft' | 'approved' | 'partially_paid' | 'paid' | 'cancelled';

export type HrEmployee = {
  id: number;
  name: string;
  email?: string | null;
  status?: EmploymentStatus;
};

export type AttendanceRecord = {
  id?: number;
  user_id: number;
  date?: string;
  status: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  late_minutes?: number | null;
  notes?: string | null;
  user?: { id: number; name: string; email?: string } | null;
};

export type AttendanceDaySummary = {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  leave: number;
  holiday: number;
};

export type PayrollAdjustment = {
  id: number;
  user?: { id: number; name: string } | null;
  user_id?: number;
  type: AdjustmentType;
  category?: string;
  amount: number | string;
  reason?: string | null;
  effective_date: string;
  status: string;
};

export type PayrollRun = {
  id: string;
  year: number;
  month: number;
  status: PayrollRunStatus;
  total_net?: number | string | null;
  total_paid?: number | string | null;
  remaining_payable?: number | string | null;
  branch?: { id: string; name: string } | null;
};

export type Payslip = {
  id: number;
  user?: { id: number; name: string } | null;
  base_salary: number | string;
  commission_amount: number | string;
  incentives_total: number | string;
  penalties_total: number | string;
  absence_deductions: number | string;
  late_deductions: number | string;
  net: number | string;
  amount_paid?: number | string | null;
  payment_status?: string;
};

export type PayrollPaymentPayload = {
  payments: Array<{
    payslip_id: number;
    vault_id?: string;
    financial_account_id?: string;
    amount: string;
    branch_id?: string;
    paid_at?: string;
    reference?: string;
    idempotency_key: string;
  }>;
  vault_id?: string;
  financial_account_id?: string;
  idempotency_key?: string;
};

export const hrAPI = {
  employees: {
    list: (params?: Record<string, unknown>) => get<HrEmployee[]>('/hr/employees', params),
    get: (id: number) => get<HrEmployee>(`/hr/employees/${id}`),
    create: (data: Record<string, unknown>) => post<HrEmployee>('/hr/employees', data),
    update: (id: number, data: Record<string, unknown>) => put<HrEmployee>(`/hr/employees/${id}`, data),
  },
  attendance: {
    eligible: (branchId: string) => get<HrEmployee[]>('/hr/attendance/eligible', { branch_id: branchId }),
    list: (branchId: string, date: string) =>
      get<AttendanceRecord[]>('/hr/attendance', { branch_id: branchId, date }),
    history: (params: { branch_id: string; date_from: string; date_to: string; user_id?: number }) =>
      get<AttendanceRecord[]>('/hr/attendance', params),
    days: (params: { branch_id: string; date_from: string; date_to: string }) =>
      get<AttendanceDaySummary[]>('/hr/attendance/days', params),
    bulk: (payload: {
      branch_id: string;
      date: string;
      rows: Array<{ user_id: number; status: AttendanceStatus; check_in?: string; notes?: string }>;
    }) => post<{ updated?: number }>('/hr/attendance/bulk', payload),
    summary: (params: { user_id: number; year: number; month: number; branch_id?: string }) =>
      get<Record<string, unknown>>('/hr/attendance/summary', params),
  },
  adjustments: {
    list: (params?: Record<string, unknown>) => get<PayrollAdjustment[]>('/hr/adjustments', params),
    create: (data: Record<string, unknown>) => post<PayrollAdjustment>('/hr/adjustments', data),
    update: (id: number, data: Record<string, unknown>) => put<PayrollAdjustment>(`/hr/adjustments/${id}`, data),
    cancel: (id: number) => post<PayrollAdjustment>(`/hr/adjustments/${id}/cancel`),
  },
  payroll: {
    list: (params?: Record<string, unknown>) => get<PayrollRun[]>('/hr/payroll-runs', params),
    get: (id: string) => get<PayrollRun & { payslips?: Payslip[] }>(`/hr/payroll-runs/${id}`),
    create: (data: Record<string, unknown>) => post<PayrollRun>('/hr/payroll-runs', data),
    regenerate: (id: string) => post<PayrollRun>(`/hr/payroll-runs/${id}/regenerate`),
    approve: (id: string) => post<PayrollRun>(`/hr/payroll-runs/${id}/approve`),
    pay: (id: string, payload: PayrollPaymentPayload) => post<PayrollRun>(`/hr/payroll-runs/${id}/pay`, payload),
    cancel: (id: string) => post<PayrollRun>(`/hr/payroll-runs/${id}/cancel`),
  },
};
