'use client';

import { useEffect, useState } from 'react';
import {
  Briefcase, Plus, Calendar, Wallet, CheckCircle2, Clock, Users, BadgeDollarSign,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { useToast } from '@/hooks/use-toast';
import {
  staffService, payrollService, Staff, Payroll, StaffType, PayrollSummary,
} from '@/services/finance.service';
import { formatCurrency } from '@/lib/utils';
import { billingPeriodBs } from '@/lib/nepali-date';

const staffTypeLabel: Record<StaffType, string> = {
  TEACHING: 'Teaching', NON_TEACHING: 'Non-Teaching', ADMIN: 'Admin',
};
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();

const staffSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email(),
  password: z.string().min(6),
  staffType: z.enum(['TEACHING', 'NON_TEACHING', 'ADMIN']),
  phone: z.string().optional(),
  basicSalary: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0).optional(),
  deductions: z.coerce.number().min(0).optional(),
});
type StaffForm = z.infer<typeof staffSchema>;

export default function PayrollPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'payroll' | 'staff'>('payroll');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [staffOpen, setStaffOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);

  const staffForm = useForm<StaffForm>({ resolver: zodResolver(staffSchema), defaultValues: { staffType: 'NON_TEACHING' } });

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, sum] = await Promise.all([
        staffService.list(),
        payrollService.list({ month, year }),
        payrollService.summary(month, year),
      ]);
      setStaff(s);
      setPayrolls(p);
      setSummary(sum);
    } catch { toast({ variant: 'destructive', title: 'Failed to load' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [month, year]);

  const onCreateStaff = async (data: StaffForm) => {
    try {
      await staffService.create({ ...data, phone: data.phone || undefined });
      toast({ title: 'Staff added' });
      setStaffOpen(false);
      staffForm.reset({ staffType: 'NON_TEACHING' });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    }
  };

  const handleGenerate = async () => {
    try {
      const res = await payrollService.generateMonthly({ month, year });
      toast({ title: 'Payroll generated', description: `${res.generated} generated · ${res.skipped} skipped` });
      setGenOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    }
  };

  const handleMarkPaid = async (p: Payroll) => {
    try { await payrollService.markPaid(p.id); toast({ title: 'Marked as paid' }); load(); }
    catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Manage staff salaries and monthly payroll"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStaffOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>
            <Button onClick={() => setGenOpen(true)}><Calendar className="h-4 w-4 mr-1" /> Generate Payroll</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Payroll" value={summary ? formatCurrency(summary.totalNet) : '—'} icon={Wallet} color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        <StatCard label="Paid" value={summary ? formatCurrency(summary.paidAmount) : '—'} icon={CheckCircle2} color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
        <StatCard label="Pending" value={summary ? formatCurrency(summary.pendingAmount) : '—'} icon={Clock} color="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
        <StatCard label="Staff" value={staff.length} icon={Users} color="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex gap-1 bg-muted/50 p-1 rounded-lg">
          <button onClick={() => setTab('payroll')} className={cn('flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'payroll' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
            <BadgeDollarSign className="h-4 w-4" /> Payroll
          </button>
          <button onClick={() => setTab('staff')} className={cn('flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'staff' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
            <Briefcase className="h-4 w-4" /> Staff
          </button>
        </div>

        {tab === 'payroll' && (
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(+v)}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>{[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{billingPeriodBs(month, year)} BS</span>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : tab === 'payroll' ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Basic</TableHead>
                    <TableHead className="text-right">Allowances</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.length === 0 ? (
                    <TableEmpty colSpan={8}>
                      <div className="flex flex-col items-center gap-2 py-6">
                        <Wallet className="h-8 w-8 text-muted-foreground/50" />
                        <p>No payroll for {monthNames[month - 1]} {year}</p>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => setGenOpen(true)}>
                          <Calendar className="h-4 w-4 mr-1" /> Generate now
                        </Button>
                      </div>
                    </TableEmpty>
                  ) : (
                    payrolls.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="font-medium">{p.staff?.firstName} {p.staff?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{p.staff && staffTypeLabel[p.staff.staffType]}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(p.basicSalary)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(p.allowances)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(p.bonus)}</TableCell>
                        <TableCell className="text-right font-mono text-red-600 dark:text-red-400">{formatCurrency(p.deductions)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(p.netSalary)}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'PAID' ? 'success' : p.status === 'PENDING' ? 'warning' : 'secondary'}>{p.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {p.status === 'PENDING' && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkPaid(p)}>Mark Paid</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            staff.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No staff yet"
                description="Add staff members with their salary details to run payroll."
                action={<Button onClick={() => setStaffOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>}
              />
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((s) => {
                      const net = s.salary ? s.salary.basicSalary + s.salary.allowances - s.salary.deductions : 0;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                          <TableCell><Badge variant="outline">{staffTypeLabel[s.staffType]}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.user?.email}</TableCell>
                          <TableCell className="text-right font-mono">{s.salary ? formatCurrency(s.salary.basicSalary) : <span className="text-muted-foreground text-xs">Not set</span>}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{s.salary ? formatCurrency(net) : '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Add staff dialog */}
      <Dialog open={staffOpen} onOpenChange={setStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff</DialogTitle>
            <DialogDescription>Create a staff member with salary for payroll.</DialogDescription>
          </DialogHeader>
          <form onSubmit={staffForm.handleSubmit(onCreateStaff)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input {...staffForm.register('firstName')} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input {...staffForm.register('lastName')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...staffForm.register('email')} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="text" {...staffForm.register('password')} placeholder="Min 6 chars" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Staff Type</Label>
                <Select value={staffForm.watch('staffType')} onValueChange={(v) => staffForm.setValue('staffType', v as StaffType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEACHING">Teaching</SelectItem>
                    <SelectItem value="NON_TEACHING">Non-Teaching</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...staffForm.register('phone')} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Basic Salary</Label>
                <Input type="number" {...staffForm.register('basicSalary')} />
              </div>
              <div className="space-y-1.5">
                <Label>Allowances</Label>
                <Input type="number" {...staffForm.register('allowances')} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Deductions</Label>
                <Input type="number" {...staffForm.register('deductions')} placeholder="0" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStaffOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={staffForm.formState.isSubmitting}>Add Staff</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate payroll dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Monthly Payroll</DialogTitle>
            <DialogDescription>
              Creates payroll records for all staff with a configured salary for {monthNames[month - 1]} {year}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate}>Generate for {monthNames[month - 1]} {year}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
