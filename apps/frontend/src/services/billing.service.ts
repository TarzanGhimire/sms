import api from '@/lib/axios';

export type FeeType = 'RECURRING' | 'ONE_TIME' | 'OPTIONAL';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'ESEWA' | 'KHALTI';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface FeeCategory {
  id: string;
  name: string;
  feeType: FeeType;
  description?: string | null;
  _count?: { feeStructures: number };
}

export interface FeeStructure {
  id: string;
  classId: string;
  feeCategoryId: string;
  amount: number;
  academicYearId?: string | null;
  isActive: boolean;
  class?: { name: string; academicYear?: { name: string } };
  feeCategory?: FeeCategory;
}

export interface Discount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string | null;
  isActive: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  discountAmount: number;
  netAmount: number;
  discount?: Discount | null;
}

export interface Payment {
  id: string;
  invoiceId: string;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
  invoice?: { invoiceNumber: string; student?: { studentId: string; firstName: string; lastName: string } };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  academicYearId: string;
  billingMonth: number;
  billingYear: number;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  fineAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  notes?: string | null;
  createdAt: string;
  student?: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    section?: { name: string; class: { name: string } } | null;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
  academicYear?: { name: string };
  _count?: { items: number; payments: number };
}

export interface InvoiceStats {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  counts: { paid: number; overdue: number; pending: number };
}

export const feeCategoriesService = {
  list: () => api.get<{ data: FeeCategory[] }>('/fee-categories').then((r) => r.data.data),
  create: (data: { name: string; feeType: FeeType; description?: string }) =>
    api.post<{ data: FeeCategory }>('/fee-categories', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; feeType: FeeType; description: string }>) =>
    api.put<{ data: FeeCategory }>(`/fee-categories/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/fee-categories/${id}`),
};

export const feeStructuresService = {
  list: (classId?: string) =>
    api.get<{ data: FeeStructure[] }>('/fee-structures', { params: { classId } }).then((r) => r.data.data),
  create: (data: { classId: string; feeCategoryId: string; amount: number }) =>
    api.post<{ data: FeeStructure }>('/fee-structures', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ amount: number; isActive: boolean }>) =>
    api.put<{ data: FeeStructure }>(`/fee-structures/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/fee-structures/${id}`),
};

export const discountsService = {
  list: () => api.get<{ data: Discount[] }>('/discounts').then((r) => r.data.data),
  create: (data: { name: string; type?: 'PERCENTAGE' | 'FIXED'; value: number; description?: string }) =>
    api.post<{ data: Discount }>('/discounts', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; value: number; isActive: boolean }>) =>
    api.put<{ data: Discount }>(`/discounts/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/discounts/${id}`),
};

export const invoicesService = {
  list: (params?: { studentId?: string; status?: InvoiceStatus; billingMonth?: number; billingYear?: number; search?: string }) =>
    api.get<{ data: Invoice[] }>('/invoices', { params }).then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Invoice }>(`/invoices/${id}`).then((r) => r.data.data),
  stats: () => api.get<{ data: InvoiceStats }>('/invoices/stats').then((r) => r.data.data),
  create: (data: {
    studentId: string;
    billingMonth: number;
    billingYear: number;
    dueDate?: string;
    items: { description: string; amount: number; discountAmount?: number }[];
    fineAmount?: number;
    notes?: string;
  }) => api.post<{ data: Invoice }>('/invoices', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ status: InvoiceStatus; dueDate: string; fineAmount: number; notes: string }>) =>
    api.put<{ data: Invoice }>(`/invoices/${id}`, data).then((r) => r.data.data),
  generateMonthly: (data: { classId?: string; sectionId?: string; billingMonth: number; billingYear: number; dueDay?: number }) =>
    api.post<{ data: { generated: number; skipped: number; details: { created: string[]; skipped: { studentId: string; reason: string }[] } } }>('/invoices/generate-monthly', data).then((r) => r.data.data),
  markOverdue: () => api.post('/invoices/mark-overdue', {}),
};

export const paymentsService = {
  list: (params?: { invoiceId?: string; studentId?: string; method?: PaymentMethod }) =>
    api.get<{ data: Payment[] }>('/payments', { params }).then((r) => r.data.data),
  create: (data: { invoiceId: string; amount: number; method: PaymentMethod; transactionId?: string; notes?: string }) =>
    api.post<{ data: Payment }>('/payments', data).then((r) => r.data.data),
  dailyCollection: (date?: string) =>
    api.get<{ data: { date: string; totalAmount: number; totalCount: number; byMethod: { method: PaymentMethod; amount: number; count: number }[] } }>('/payments/daily-collection', { params: { date } }).then((r) => r.data.data),
};
