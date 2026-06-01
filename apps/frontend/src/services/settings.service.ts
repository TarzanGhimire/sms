import api from '@/lib/axios';

export interface SchoolSettings {
  id: string;
  schoolName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  invoiceFooter?: string | null;
  receiptFooter?: string | null;
  finePerDay: number;
  fineGraceDays: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  monthRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeClasses: number;
  upcomingExams: number;
}

export const settingsService = {
  get: () => api.get<{ data: SchoolSettings }>('/settings').then((r) => r.data.data),
  update: (data: Partial<SchoolSettings>) =>
    api.put<{ data: SchoolSettings }>('/settings', data).then((r) => r.data.data),
};

export const dashboardService = {
  stats: () => api.get<{ data: DashboardStats }>('/dashboard/stats').then((r) => r.data.data),
};

export const backupService = {
  exportUrl: () => `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/backup/export`,
};
