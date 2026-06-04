'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, FileText,
  Receipt, CreditCard, TrendingDown, Briefcase, BarChart3,
  Settings, ChevronRight, School,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useBranding } from '@/hooks/use-branding';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/students', icon: Users, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT'] },
  { label: 'Teachers', href: '/teachers', icon: GraduationCap, roles: ['SUPER_ADMIN', 'PRINCIPAL'] },
  { label: 'Academics', href: '/academics', icon: BookOpen, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { label: 'Examinations', href: '/examinations', icon: FileText, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { label: 'Billing', href: '/billing', icon: Receipt, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { label: 'Payments', href: '/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { label: 'Expenses', href: '/expenses', icon: TrendingDown, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { label: 'Payroll', href: '/payroll', icon: Briefcase, roles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const branding = useBranding();

  const filtered = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? ''),
  );

  return (
    <aside className="w-64 bg-sidebar flex flex-col h-full border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        {branding?.logoUrl ? (
          <div className="h-8 w-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branding.logoUrl} alt="School logo" className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="bg-sidebar-primary rounded-lg p-1.5 shrink-0">
            <School className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
        <span className="font-bold text-sidebar-foreground text-sm truncate">{branding?.schoolName ?? 'School ERP'}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 px-3">v1.0.0</p>
      </div>
    </aside>
  );
}
