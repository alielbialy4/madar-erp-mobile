export type EmployeeFormFields = {
  name: string;
  email: string;
  phone: string;
  password: string;
  canLogin: boolean;
  branchId: string;
  employeeType: 'salary' | 'commission' | 'hybrid';
  baseSalary: string;
  commission: string;
  bankTransfer: string;
  employmentStatus: string;
  jobTitle: string;
  shiftStart: string;
  shiftEnd: string;
  lateGraceMinutes: string;
  lateDeductionPerMinute: string;
  absenceDeductionAmount: string;
};

export function buildEmployeeCreatePayload(fields: EmployeeFormFields): Record<string, unknown> {
  const canLogin = fields.canLogin;
  return {
    name: fields.name.trim(),
    email: fields.email.trim() || null,
    phone: fields.phone.trim() || null,
    can_login: canLogin,
    ...(canLogin
      ? {
          password: fields.password || 'changeme123',
          user_type: 'cashier',
        }
      : {}),
    branch_ids: fields.branchId.trim() ? [fields.branchId.trim()] : [],
    employee_type: fields.employeeType,
    is_active: 1,
    base_salary: Number(fields.baseSalary) || 0,
    commission: Number(fields.commission) || 0,
    bank_transfer: Number(fields.bankTransfer) || 0,
    employment_status: fields.employmentStatus || 'active',
    job_title: fields.jobTitle.trim() || null,
    shift_start: fields.shiftStart.trim() || null,
    shift_end: fields.shiftEnd.trim() || null,
    late_grace_minutes: fields.lateGraceMinutes.trim() ? Number(fields.lateGraceMinutes) : 15,
    late_deduction_per_minute: Number(fields.lateDeductionPerMinute) || 0,
    absence_deduction_amount: Number(fields.absenceDeductionAmount) || 0,
  };
}

export function buildEmployeeUpdatePayload(fields: EmployeeFormFields): Record<string, unknown> {
  return {
    name: fields.name.trim(),
    email: fields.email.trim() || null,
    phone: fields.phone.trim() || null,
    can_login: fields.canLogin,
    employee_type: fields.employeeType,
    base_salary: Number(fields.baseSalary) || 0,
    commission: Number(fields.commission) || 0,
    bank_transfer: Number(fields.bankTransfer) || 0,
    employment_status: fields.employmentStatus || 'active',
    job_title: fields.jobTitle.trim() || null,
    shift_start: fields.shiftStart.trim() || null,
    shift_end: fields.shiftEnd.trim() || null,
    late_grace_minutes: fields.lateGraceMinutes.trim() ? Number(fields.lateGraceMinutes) : 15,
    late_deduction_per_minute: Number(fields.lateDeductionPerMinute) || 0,
    absence_deduction_amount: Number(fields.absenceDeductionAmount) || 0,
    ...(fields.branchId.trim() ? { branch_ids: [fields.branchId.trim()] } : {}),
  };
}
