'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Calendar, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { invoicesService } from '@/services/billing.service';
import { classesService, sectionsService, ClassItem, Section } from '@/services/academic.service';

const schema = z.object({
  scope: z.enum(['ALL', 'CLASS', 'SECTION']),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  billingMonth: z.coerce.number().min(1).max(12),
  billingYear: z.coerce.number(),
  dueDay: z.coerce.number().min(1).max(31).optional(),
});

type FormData = z.infer<typeof schema>;

export default function GenerateInvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [result, setResult] = useState<{ generated: number; skipped: number; details: { created: string[]; skipped: { studentId: string; reason: string }[] } } | null>(null);

  const now = new Date();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        scope: 'ALL',
        billingMonth: now.getMonth() + 1,
        billingYear: now.getFullYear(),
        dueDay: 20,
      },
    });

  const scope = watch('scope');
  const classId = watch('classId');
  const sectionId = watch('sectionId');
  const billingMonth = watch('billingMonth');

  useEffect(() => {
    classesService.list().then(setClasses).catch(() => {});
    sectionsService.list().then(setSections).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        billingMonth: data.billingMonth,
        billingYear: data.billingYear,
        dueDay: data.dueDay,
      };
      if (data.scope === 'CLASS' && data.classId) payload.classId = data.classId;
      if (data.scope === 'SECTION' && data.sectionId) payload.sectionId = data.sectionId;

      const res = await invoicesService.generateMonthly(payload);
      setResult(res);
      toast({
        title: 'Generation complete',
        description: `${res.generated} invoices created · ${res.skipped} skipped`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: e.response?.data?.message?.[0] ?? 'Try again',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/billing/invoices"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to invoices</Button></Link>

      <PageHeader
        title="Generate Monthly Invoices"
        description="Auto-create recurring invoices for active students based on their class fee structure"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Generation Parameters
          </CardTitle>
          <CardDescription>
            Only RECURRING fee categories are included. Students without sections or fee structures will be skipped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Scope</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['ALL', 'CLASS', 'SECTION'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('scope', s)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      scope === s ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    {s === 'ALL' ? 'All active students' : s === 'CLASS' ? 'Specific class' : 'Specific section'}
                  </button>
                ))}
              </div>
            </div>

            {scope === 'CLASS' && (
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select value={classId} onValueChange={(v) => setValue('classId', v)}>
                  <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} · {c.academicYear?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === 'SECTION' && (
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select value={sectionId} onValueChange={(v) => setValue('sectionId', v)}>
                  <SelectTrigger><SelectValue placeholder="Choose section" /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.class?.name} - {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Billing Month</Label>
                <Select value={String(billingMonth)} onValueChange={(v) => setValue('billingMonth', parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)}>{monthName(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input type="number" {...register('billingYear')} />
                {errors.billingYear && <p className="text-xs text-destructive">{errors.billingYear.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Due Day</Label>
                <Input type="number" min="1" max="31" {...register('dueDay')} />
                <p className="text-xs text-muted-foreground">Day of month (default: 20)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/billing/invoices"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Invoices
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generation Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium">Generated</p>
                  <p className="text-2xl font-bold">{result.generated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-medium">Skipped</p>
                  <p className="text-2xl font-bold">{result.skipped}</p>
                </div>
              </div>
            </div>

            {result.details.skipped.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Skipped students</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.details.skipped.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/40 rounded">
                      <span className="font-mono">{s.studentId}</span>
                      <Badge variant="outline" className="font-normal">{s.reason}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.generated > 0 && (
              <Button onClick={() => router.push('/billing/invoices')} className="w-full">
                View Generated Invoices
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function monthName(m: number): string {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] ?? '';
}
