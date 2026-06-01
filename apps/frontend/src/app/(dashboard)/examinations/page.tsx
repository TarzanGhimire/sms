'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Pencil, Trash2, CheckCircle2, CalendarDays } from 'lucide-react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { useToast } from '@/hooks/use-toast';
import { examsService, Exam, ExamType } from '@/services/exam.service';
import { formatDate } from '@/lib/utils';

const examTypeLabel: Record<ExamType, string> = {
  FIRST_TERMINAL: 'First Terminal',
  MID_TERM: 'Mid-Term',
  SECOND_TERMINAL: 'Second Terminal',
  FINAL_EXAM: 'Final Exam',
  UNIT_TEST: 'Unit Test',
};

const schema = z.object({
  name: z.string().min(1, 'Required'),
  examType: z.enum(['FIRST_TERMINAL', 'MID_TERM', 'SECOND_TERMINAL', 'FINAL_EXAM', 'UNIT_TEST']),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
});

type FormData = z.infer<typeof schema>;

export default function ExaminationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const examType = watch('examType');

  const load = async () => {
    setLoading(true);
    try { setExams(await examsService.list()); }
    catch { toast({ variant: 'destructive', title: 'Failed to load exams' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ name: '', examType: 'FIRST_TERMINAL', startDate: '', endDate: '' });
    setOpen(true);
  };
  const openEdit = (e: Exam, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setEditing(e);
    reset({ name: e.name, examType: e.examType, startDate: e.startDate.slice(0, 10), endDate: e.endDate.slice(0, 10) });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) await examsService.update(editing.id, data);
      else await examsService.create(data);
      toast({ title: editing ? 'Exam updated' : 'Exam created' });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    }
  };

  const handleDelete = async (e: Exam, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!confirm(`Delete exam "${e.name}"?`)) return;
    try { await examsService.remove(e.id); toast({ title: 'Deleted' }); load(); }
    catch (err: any) { toast({ variant: 'destructive', title: 'Cannot delete', description: err.response?.data?.message?.[0] ?? 'Exam may be published' }); }
  };

  const togglePublish = async (e: Exam, ev: React.MouseEvent) => {
    ev.stopPropagation();
    try {
      await examsService.update(e.id, { isPublished: !e.isPublished });
      toast({ title: e.isPublished ? 'Results unpublished' : 'Results published' });
      load();
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        description="Create exams, enter marks, and publish results"
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Exam</Button>}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No exams yet"
          description="Create an exam like First Terminal or Final Exam to begin marks entry."
          action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Create Exam</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((e) => (
            <Card
              key={e.id}
              className="cursor-pointer hover:border-primary/40 transition-all group"
              onClick={() => router.push(`/examinations/${e.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-primary/10 rounded-lg p-2.5">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  {e.isPublished ? (
                    <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Published</Badge>
                  ) : (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{e.name}</h3>
                <Badge variant="info" className="mt-1">{examTypeLabel[e.examType]}</Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(e.startDate)} – {formatDate(e.endDate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{e._count?.marks ?? 0} marks recorded</p>

                <div className="flex gap-1 mt-4 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" onClick={(ev) => togglePublish(e, ev)} className="flex-1">
                    {e.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(ev) => openEdit(e, ev)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(ev) => handleDelete(e, ev)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Exam' : 'New Exam'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Exam Name</Label>
              <Input {...register('name')} placeholder="e.g. First Terminal Examination 2081" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Exam Type</Label>
              <Select value={examType} onValueChange={(v) => setValue('examType', v as ExamType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(examTypeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" {...register('endDate')} />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{editing ? 'Save Changes' : 'Create Exam'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
