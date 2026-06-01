'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Plus, FileText, Receipt, TrendingUp, AlertCircle, Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import {
  invoicesService, Invoice, InvoiceStatus, InvoiceStats,
} from '@/services/billing.service';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusVariant: Record<InvoiceStatus, 'success' | 'warning' | 'info' | 'destructive' | 'secondary' | 'outline'> = {
  DRAFT: 'outline', SENT: 'info', PARTIALLY_PAID: 'warning', PAID: 'success', OVERDUE: 'destructive', CANCELLED: 'secondary',
};

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');

  const load = async () => {
    setLoading(true);
    try {
      const [inv, st] = await Promise.all([
        invoicesService.list({
          search: search || undefined,
          status: statusFilter || undefined,
        }),
        invoicesService.stats(),
      ]);
      setInvoices(inv);
      setStats(st);
    } catch { toast({ variant: 'destructive', title: 'Failed to load invoices' }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <Link href="/billing"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to billing</Button></Link>

      <PageHeader
        title="Invoices"
        description="View and manage all student invoices"
        action={
          <Link href="/billing/generate">
            <Button><Calendar className="h-4 w-4 mr-1" /> Generate Monthly Invoices</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Billed" value={stats ? formatCurrency(stats.totalBilled) : '—'} icon={Receipt} color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        <StatCard label="Collected" value={stats ? formatCurrency(stats.totalCollected) : '—'} icon={TrendingUp} color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
        <StatCard label="Outstanding" value={stats ? formatCurrency(stats.totalOutstanding) : '—'} icon={FileText} color="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
        <StatCard label="Overdue" value={stats?.counts.overdue ?? '—'} icon={AlertCircle} color="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400" />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice # or student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v as InvoiceStatus)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8" /></TableCell></TableRow>)
                ) : invoices.length === 0 ? (
                  <TableEmpty colSpan={8}>
                    <div className="flex flex-col items-center gap-2 py-6">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                      <p>No invoices yet</p>
                      <Link href="/billing/generate"><Button size="sm" variant="outline" className="mt-2"><Plus className="h-4 w-4 mr-1" /> Generate invoices</Button></Link>
                    </div>
                  </TableEmpty>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => router.push(`/billing/invoices/${inv.id}`)}>
                      <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        {inv.student && (
                          <div>
                            <p className="font-medium">{inv.student.firstName} {inv.student.lastName}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.student.studentId} · {inv.student.section?.class.name ?? '—'}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{monthName(inv.billingMonth)} {inv.billingYear}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600 dark:text-green-400">{formatCurrency(inv.paidAmount)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(inv.dueAmount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell><Badge variant={statusVariant[inv.status]}>{inv.status}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className={`rounded-md p-1.5 ${color}`}><Icon className="h-3.5 w-3.5" /></div>
        </div>
        <p className="text-2xl font-bold truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function monthName(m: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] ?? '';
}
