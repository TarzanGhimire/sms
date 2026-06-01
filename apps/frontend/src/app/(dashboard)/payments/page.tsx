'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, Banknote, Building2, Smartphone, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { paymentsService, Payment, PaymentMethod } from '@/services/billing.service';
import { formatCurrency, formatDate } from '@/lib/utils';

const methodIcon: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
  CASH: Banknote, BANK_TRANSFER: Building2, ESEWA: Smartphone, KHALTI: Smartphone,
};
const methodLabel: Record<PaymentMethod, string> = {
  CASH: 'Cash', BANK_TRANSFER: 'Bank', ESEWA: 'eSewa', KHALTI: 'Khalti',
};

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [daily, setDaily] = useState<{ date: string; totalAmount: number; totalCount: number; byMethod: { method: PaymentMethod; amount: number; count: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([
        paymentsService.list({ method: methodFilter || undefined }),
        paymentsService.dailyCollection(date),
      ]);
      setPayments(p);
      setDaily(d);
    } catch { toast({ variant: 'destructive', title: 'Failed to load' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [methodFilter, date]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Receipts"
        description="Track all payment activity and daily collections"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <p className="font-semibold">Daily Collection</p>
            </div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{daily ? formatCurrency(daily.totalAmount) : '—'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{daily?.totalCount ?? 0} transactions</p>
            </div>
            {(['CASH', 'BANK_TRANSFER', 'ESEWA', 'KHALTI'] as PaymentMethod[]).map((m) => {
              const stat = daily?.byMethod.find((b) => b.method === m);
              const Icon = methodIcon[m];
              return (
                <div key={m} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{methodLabel[m]}</p>
                  </div>
                  <p className="text-lg font-bold">{stat ? formatCurrency(stat.amount) : 'Rs. 0'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat?.count ?? 0} txns</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">All Payments</p>
            <Select value={methodFilter || 'all'} onValueChange={(v) => setMethodFilter(v === 'all' ? '' : v as PaymentMethod)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All methods" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="ESEWA">eSewa</SelectItem>
                <SelectItem value="KHALTI">Khalti</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>)
                ) : payments.length === 0 ? (
                  <TableEmpty colSpan={7}>
                    <div className="flex flex-col items-center gap-2 py-6">
                      <Receipt className="h-8 w-8 text-muted-foreground/50" />
                      <p>No payments recorded yet</p>
                    </div>
                  </TableEmpty>
                ) : (
                  payments.map((p) => {
                    const Icon = methodIcon[p.method];
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.receiptNumber}</TableCell>
                        <TableCell>
                          {p.invoice && (
                            <Link href={`/billing/invoices/${p.invoiceId}`} className="text-primary hover:underline font-mono text-sm">
                              {p.invoice.invoiceNumber}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.invoice?.student && (
                            <div>
                              <p className="text-sm font-medium">{p.invoice.student.firstName} {p.invoice.student.lastName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{p.invoice.student.studentId}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{methodLabel[p.method]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(p.paidAt ?? p.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'PENDING' ? 'warning' : 'destructive'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
