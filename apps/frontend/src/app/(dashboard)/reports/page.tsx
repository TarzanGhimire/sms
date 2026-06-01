'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, Receipt, Scale, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import {
  reportsService, FinancialOverview,
} from '@/services/finance.service';
import { formatCurrency } from '@/lib/utils';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();

export default function ReportsPage() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [trend, setTrend] = useState<{ month: number; collected: number; expense: number }[]>([]);
  const [byClass, setByClass] = useState<{ className: string; dueAmount: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      const [o, t, c] = await Promise.all([
        reportsService.financialOverview(month, year),
        reportsService.monthlyTrend(year),
        reportsService.outstandingByClass(),
      ]);
      setOverview(o);
      setTrend(t.months);
      setByClass(c);
    } catch { toast({ variant: 'destructive', title: 'Failed to load reports' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [month, year]);

  const maxTrend = Math.max(1, ...trend.flatMap((t) => [t.collected, t.expense]));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Financial overview and insights" />

      <div className="flex items-center gap-2">
        <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(+v)}>
          <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>{[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : overview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Collected" value={formatCurrency(overview.collected)} icon={TrendingUp} color="text-green-600" bg="bg-green-50 dark:bg-green-950" />
            <MetricCard label="Outstanding Dues" value={formatCurrency(overview.outstanding)} icon={AlertCircle} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-950" />
            <MetricCard label="Billed (month)" value={formatCurrency(overview.billed)} icon={Receipt} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950" />
            <MetricCard label="Expenses" value={formatCurrency(overview.expenses)} icon={TrendingDown} color="text-red-600" bg="bg-red-50 dark:bg-red-950" />
            <MetricCard label="Payroll" value={formatCurrency(overview.payroll)} icon={Wallet} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950" />
            <MetricCard
              label="Net Balance"
              value={formatCurrency(overview.netBalance)}
              icon={Scale}
              color={overview.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}
              bg={overview.netBalance >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Collection vs Expense — {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-48 pt-4">
                {trend.map((t) => (
                  <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-0.5 h-40">
                      <div
                        className="w-1/2 bg-green-500 rounded-t transition-all"
                        style={{ height: `${(t.collected / maxTrend) * 100}%` }}
                        title={`Collected: ${formatCurrency(t.collected)}`}
                      />
                      <div
                        className="w-1/2 bg-red-400 rounded-t transition-all"
                        style={{ height: `${(t.expense / maxTrend) * 100}%` }}
                        title={`Expense: ${formatCurrency(t.expense)}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{monthNames[t.month - 1]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-500" /> Collected</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-400" /> Expense</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outstanding Dues by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Outstanding Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byClass.length === 0 ? (
                      <TableEmpty colSpan={3}>
                        <p className="py-6">No outstanding dues 🎉</p>
                      </TableEmpty>
                    ) : (
                      byClass.map((c) => (
                        <TableRow key={c.className}>
                          <TableCell className="font-medium">{c.className}</TableCell>
                          <TableCell className="text-right">{c.count}</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-orange-600 dark:text-orange-400">
                            {formatCurrency(c.dueAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className={`rounded-md p-1.5 ${bg}`}><Icon className={`h-3.5 w-3.5 ${color}`} /></div>
        </div>
        <p className="text-2xl font-bold truncate">{value}</p>
      </CardContent>
    </Card>
  );
}
