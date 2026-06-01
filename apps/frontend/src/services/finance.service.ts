import api from '@/lib/axios';

export type ExpenseCategory =
  | 'ELECTRICITY' | 'INTERNET' | 'FUEL' | 'MAINTENANCE'
  | 'STATIONERY' | 'SALARY' | 'EQUIPMENT' | 'MISCELLANEOUS';

export type StaffType = 'TEACHING' | 'NON_TEACHING' | 'ADMIN';
export type PayrollStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string | null;
  receiptUrl?: string | null;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  byCategory: { category: ExpenseCategory; amount: number; count: number }[];
}

export interface Salary {
  id: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
}

export interface Staff {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  staffType: StaffType;
  phone?: string | null;
  joinDate: string;
  isActive: boolean;
  user?: { email: string; isActive: boolean };
  salary?: Salary | null;
  payrolls?: Payroll[];
}

export interface Payroll {
  id: string;
  staffId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: string | null;
  notes?: string | null;
  staff?: { id: string; firstName: string; lastName: string; staffType: StaffType };
}

export interface PayrollSummary {
  totalNet: number;
  count: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface FinancialOverview {
  period: { month: number; year: number };
  collected: number;
  billed: number;
  outstanding: number;
  expenses: number;
  payroll: number;
  totalExpense: number;
  netBalance: number;
}

export const expensesService = {
  list: (params?: { category?: ExpenseCategory; month?: number; year?: number }) =>
    api.get<{ data: Expense[] }>('/expenses', { params }).then((r) => r.data.data),
  summary: (month?: number, year?: number) =>
    api.get<{ data: ExpenseSummary }>('/expenses/summary', { params: { month, year } }).then((r) => r.data.data),
  create: (data: { title: string; category: ExpenseCategory; amount: number; date: string; description?: string }) =>
    api.post<{ data: Expense }>('/expenses', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ title: string; category: ExpenseCategory; amount: number; date: string; description: string }>) =>
    api.put<{ data: Expense }>(`/expenses/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/expenses/${id}`),
};

export const staffService = {
  list: (search?: string) =>
    api.get<{ data: Staff[] }>('/staff', { params: { search } }).then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Staff }>(`/staff/${id}`).then((r) => r.data.data),
  create: (data: { email: string; password: string; firstName: string; lastName: string; staffType: StaffType; phone?: string; basicSalary?: number; allowances?: number; deductions?: number }) =>
    api.post<{ data: Staff }>('/staff', data).then((r) => r.data.data),
  setSalary: (id: string, data: { basicSalary: number; allowances?: number; deductions?: number }) =>
    api.put<{ data: Salary }>(`/staff/${id}/salary`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/staff/${id}`),
};

export const payrollService = {
  list: (params?: { month?: number; year?: number; staffId?: string }) =>
    api.get<{ data: Payroll[] }>('/payroll', { params }).then((r) => r.data.data),
  summary: (month?: number, year?: number) =>
    api.get<{ data: PayrollSummary }>('/payroll/summary', { params: { month, year } }).then((r) => r.data.data),
  generateMonthly: (data: { month: number; year: number }) =>
    api.post<{ data: { generated: number; skipped: number; details: { created: string[]; skipped: { name: string; reason: string }[] } } }>('/payroll/generate-monthly', data).then((r) => r.data.data),
  update: (id: string, data: { bonus?: number; deductions?: number; notes?: string }) =>
    api.put<{ data: Payroll }>(`/payroll/${id}`, data).then((r) => r.data.data),
  markPaid: (id: string) => api.put<{ data: Payroll }>(`/payroll/${id}/mark-paid`, {}).then((r) => r.data.data),
};

export const reportsService = {
  financialOverview: (month?: number, year?: number) =>
    api.get<{ data: FinancialOverview }>('/reports/financial-overview', { params: { month, year } }).then((r) => r.data.data),
  monthlyTrend: (year?: number) =>
    api.get<{ data: { year: number; months: { month: number; collected: number; expense: number }[] } }>('/reports/monthly-trend', { params: { year } }).then((r) => r.data.data),
  outstandingByClass: () =>
    api.get<{ data: { className: string; dueAmount: number; count: number }[] }>('/reports/outstanding-by-class').then((r) => r.data.data),
};
