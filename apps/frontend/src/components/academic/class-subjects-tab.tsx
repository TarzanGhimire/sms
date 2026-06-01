'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { classSubjectsService, ClassSubject } from '@/services/exam.service';
import { classesService, subjectsService, ClassItem, Subject } from '@/services/academic.service';

const schema = z.object({
  classId: z.string().min(1, 'Required'),
  subjectId: z.string().min(1, 'Required'),
  fullMarks: z.coerce.number().min(1),
  passMarks: z.coerce.number().min(0),
  practicalMarks: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export function ClassSubjectsTab() {
  const [items, setItems] = useState<ClassSubject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { fullMarks: 100, passMarks: 40 } });

  const classId = watch('classId');
  const subjectId = watch('subjectId');

  const load = async () => {
    setLoading(true);
    try {
      const [cs, c, s] = await Promise.all([
        classSubjectsService.list(classFilter || undefined),
        classesService.list(),
        subjectsService.list(),
      ]);
      setItems(cs);
      setClasses(c);
      setSubjects(s);
    } catch { toast({ variant: 'destructive', title: 'Failed to load' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [classFilter]);

  const openNew = () => {
    reset({ classId: classes[0]?.id ?? '', subjectId: subjects[0]?.id ?? '', fullMarks: 100, passMarks: 40, practicalMarks: 0 });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await classSubjectsService.create({
        ...data,
        practicalMarks: data.practicalMarks || undefined,
      });
      toast({ title: 'Subject assigned to class' });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    }
  };

  const handleDelete = async (cs: ClassSubject) => {
    if (!confirm(`Remove ${cs.subject?.name} from ${cs.class?.name}?`)) return;
    try { await classSubjectsService.remove(cs.id); toast({ title: 'Removed' }); load(); }
    catch { toast({ variant: 'destructive', title: 'Cannot remove', description: 'Subject has marks recorded' }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Class Subjects</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Configure which subjects each class teaches, with full/pass marks</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={classFilter || 'all'} onValueChange={(v) => setClassFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.academicYear?.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openNew} disabled={classes.length === 0 || subjects.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> Assign Subject
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Full Marks</TableHead>
                  <TableHead className="text-right">Pass Marks</TableHead>
                  <TableHead className="text-right">Practical</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableEmpty colSpan={7}>
                    <div className="flex flex-col items-center gap-2 py-6">
                      <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                      <p>No subjects assigned to classes yet</p>
                      <p className="text-xs">Create classes and subjects first, then assign them here.</p>
                    </div>
                  </TableEmpty>
                ) : (
                  items.map((cs) => (
                    <TableRow key={cs.id}>
                      <TableCell className="font-medium">{cs.class?.name}</TableCell>
                      <TableCell>
                        {cs.subject?.name} <Badge variant="outline" className="ml-1 font-mono text-[10px]">{cs.subject?.code}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{cs.fullMarks}</TableCell>
                      <TableCell className="text-right font-mono">{cs.passMarks}</TableCell>
                      <TableCell className="text-right font-mono">{cs.practicalMarks ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cs.teacher ? `${cs.teacher.firstName} ${cs.teacher.lastName}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(cs)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Subject to Class</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select value={classId} onValueChange={(v) => setValue('classId', v)}>
                <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.academicYear?.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.classId && <p className="text-xs text-destructive">{errors.classId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={(v) => setValue('subjectId', v)}>
                <SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Full Marks</Label>
                <Input type="number" {...register('fullMarks')} />
              </div>
              <div className="space-y-1.5">
                <Label>Pass Marks</Label>
                <Input type="number" {...register('passMarks')} />
              </div>
              <div className="space-y-1.5">
                <Label>Practical</Label>
                <Input type="number" {...register('practicalMarks')} placeholder="0" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Assign</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
