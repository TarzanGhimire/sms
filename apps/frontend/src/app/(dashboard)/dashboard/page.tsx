'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, GraduationCap, Receipt, TrendingUp, AlertCircle, BookOpen, CalendarDays, FileText,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService, DashboardStats } from '@/services/settings.service';
import { formatCurrency } from '@/lib/utils';
import { todayBs } from '@/lib/nepali-date';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bsDate, setBsDate] = useState('');

  useEffect(() => {
    setBsDate(todayBs());
    dashboardService.stats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin', PRINCIPAL: 'Principal',
    ACCOUNTANT: 'Accountant', TEACHER: 'Teacher',
  };

  const cards = [
    { title: 'Total Students', value: stats?.totalStudents ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', href: '/students' },
    { title: 'Total Staff', value: stats?.totalStaff ?? 0, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', href: '/teachers' },
    { title: 'Revenue (this month)', value: stats ? formatCurrency(stats.monthRevenue) : '—', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950', href: '/payments' },
    { title: 'Pending Invoices', value: stats?.pendingInvoices ?? 0, icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950', href: '/billing/invoices' },
    { title: 'Overdue Payments', value: stats?.overdueInvoices ?? 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', href: '/billing/invoices' },
    { title: 'Active Classes', value: stats?.activeClasses ?? 0, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950', href: '/academics' },
    { title: 'Upcoming Exams', value: stats?.upcomingExams ?? 0, icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950', href: '/examinations' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Logged in as{' '}
            <span className="font-medium text-foreground">{roleLabels[user?.role ?? ''] ?? user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
          <CalendarDays className="h-4 w-4" />
          <span>{bsDate} BS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.title} href={c.href}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <div className={`${c.bg} p-2 rounded-lg`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold truncate">{c.value}</div>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
