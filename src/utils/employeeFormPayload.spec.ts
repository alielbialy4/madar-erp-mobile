import assert from 'node:assert/strict';
import { buildEmployeeCreatePayload, buildEmployeeUpdatePayload } from './employeeFormPayload';

function run() {
  const created = buildEmployeeCreatePayload({
    name: ' Ali ',
    email: 'a@x.com',
    phone: '010',
    password: 'secret',
    canLogin: true,
    branchId: 'b1',
    employeeType: 'salary',
    baseSalary: '5000',
    commission: '0',
    bankTransfer: '0',
    employmentStatus: 'active',
    jobTitle: 'Cashier',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    lateGraceMinutes: '15',
    lateDeductionPerMinute: '1',
    absenceDeductionAmount: '100',
  });
  assert.equal(created.name, 'Ali');
  assert.equal(created.can_login, true);
  assert.equal(created.password, 'secret');
  assert.deepEqual(created.branch_ids, ['b1']);
  assert.equal(created.base_salary, 5000);
  assert.equal(created.employee_type, 'salary');

  const noLogin = buildEmployeeCreatePayload({
    name: 'Worker',
    email: '',
    phone: '',
    password: '',
    canLogin: false,
    branchId: '',
    employeeType: 'commission',
    baseSalary: '',
    commission: '10',
    bankTransfer: '',
    employmentStatus: 'active',
    jobTitle: '',
    shiftStart: '',
    shiftEnd: '',
    lateGraceMinutes: '',
    lateDeductionPerMinute: '',
    absenceDeductionAmount: '',
  });
  assert.equal(noLogin.can_login, false);
  assert.equal(noLogin.password, undefined);
  assert.deepEqual(noLogin.branch_ids, []);
  assert.equal(noLogin.commission, 10);

  const updated = buildEmployeeUpdatePayload({
    name: 'B',
    email: '',
    phone: '',
    password: '',
    canLogin: false,
    branchId: 'b2',
    employeeType: 'hybrid',
    baseSalary: '1',
    commission: '2',
    bankTransfer: '3',
    employmentStatus: 'on_leave',
    jobTitle: 'Mgr',
    shiftStart: '10:00',
    shiftEnd: '18:00',
    lateGraceMinutes: '5',
    lateDeductionPerMinute: '0',
    absenceDeductionAmount: '0',
  });
  assert.equal(updated.employment_status, 'on_leave');
  assert.deepEqual(updated.branch_ids, ['b2']);
  assert.equal(updated.password, undefined);

  console.log('employeeFormPayload.spec.ts: ok');
}

run();
