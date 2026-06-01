'use client';

import { useEffect, useState } from 'react';
import {
  TrendingDown, Plus, Trash2, Pencil, Zap, Wifi, Fuel, Wrench,
  PencilRuler, Users, Package, MoreHorizontal,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { expensesService, Expense, ExpenseCategory, ExpenseSummary } from '@/services/finance.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatBs } from '@/lib/nepali-date';

const categoryIcon: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  ELECTRICITY: Zap, INTERNET: Wifi, FUEL: Fuel, MAINTENANCE: Wrench,
  STATIONERY: PencilRuler, SALARY: Users, EQUIPMENT: Package, MISCELLANEOUS: MoreHorizontal,
};
const categoryLabel: Record<ExpenseCategory, string> = {
  ELECTRICITY: 'Electricity', INTERNET: 'Internet', FUEL: 'Fuel', MAINTENANCE: 'Maintenance',
  STATIONERY: 'Stationery', SALARY: 'Salary', EQUIPMENT: 'Equipment', MISCELLANEOUS: 'Miscellaneous',
};
const categories = Object.keys(categoryLabel) as ExpenseCategory[];

const schema = z.object({
  title: z.string().min(1, 'Required'),
  category: z.enum(['ELECTRICITY', 'INTERNET', 'FUEL', 'MAINTENANCE', 'STATIONERY', 'SALARY', 'EQUIPMENT', 'MISCELLANEOUS']),
  amount: z.coerce.number().min(0),
  date: z.string().min(1, 'Required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const now = new Date();

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });
  const category = watch('category');

  const load = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        expensesService.list({ month, year }),
        expensesService.summary(month, year),
      ]);
      setExpenses(list);
      setSummary(sum);
    } catch { toast({ variant: 'destructive', title: 'Failed to load expenses' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [month, year]);

  const openNew = () => {
    setEditing(null);
    reset({ title: '', category: 'MISCELLANEOUS', amount: 0, date: new Date().toISOString().slice(0, 10), description: '' });
    setOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    reset({ title: e.title, category: e.category, amount: e.amount, date: e.date.slice(0, 10), description: e.description ?? '' });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, description: data.description || undefined };
      if (editing) await expensesService.update(editing.id, payload);
      else await expensesService.create(payload);
      toast({ title: editing ? 'Expense updated' : 'Expense added' });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    }
  };

  const handleDelete = async (e: Expense) => {
    if (!confirm(`Delete "${e.title}"?`)) return;
    try { await expensesService.remove(e.id); toast({ title: 'Deleted' }); load(); }
    catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and categorize school operating expenses"
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>}
      />

      <div className="flex items-center gap-2">
        <Select value={String(month)} onValueChange={(v) => setMonth(+v)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(+v)}>
          <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total this month</p>
            <p className="text-3xl font-bold mt-1">{summary ? formatCurrency(summary.total) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary?.count ?? 0} expenses</p>

            <div className="mt-4 space-y-2">
              {summary?.byCategory.map((c) => {
                const Icon = categoryIcon[c.category];
                const pct = summary.total > 0 ? (c.amount / summary.total) * 100 : 0;
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3" /> {categoryLabel[c.category]}
                      </span>
                      <span className="font-mono">{formatCurrency(c.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [1, 2, 3].map((i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>)
                  ) : expenses.length === 0 ? (
                    <TableEmpty colSpan={5}>
                      <div className="flex flex-col items-center gap-2 py-6">
                        <TrendingDown className="h-8 w-8 text-muted-foreground/50" />
                        <p>No expenses this month</p>
                      </div>
                    </TableEmpty>
                  ) : (
                    expenses.map((e) => {
                      const Icon = categoryIcon[e.category];
                      return (
                        <TableRow key={e.id}>
                          <TableCell>
                            <p className="font-medium">{e.title}</p>
                            {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1"><Icon className="h-3 w-3" /> {categoryLabel[e.category]}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>{formatBs(e.date)} BS</div>
                            <div className="text-xs opacity-70">{formatDate(e.date)}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">{formatCurrency(e.amount)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input {...register('title')} placeholder="e.g. Monthly electricity bill" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setValue('category', v as ExpenseCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (NPR)</Label>
                <Input type="number" step="0.01" {...register('amount')} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={2} placeholder="Optional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{editing ? 'Save Changes' : 'Add Expense'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
