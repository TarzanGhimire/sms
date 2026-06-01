'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { useToast } from '@/hooks/use-toast';
import {
  classesService, academicYearsService, ClassItem, AcademicYear,
} from '@/services/academic.service';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  academicYearId: z.string().min(1, 'Required'),
  orderIndex: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export function ClassesTab() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const { toast } = useToast();

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const academicYearId = watch('academicYearId');

  const load = async () => {
    setLoading(true);
    try {
      const [c, y] = await Promise.all([
        classesService.list(yearFilter || undefined),
        academicYearsService.list(),
      ]);
      setClasses(c);
      setYears(y);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load classes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [yearFilter]);

  const openNew = () => {
    setEditing(null);
    const currentYear = years.find((y) => y.isCurrent);
    reset({
      name: '',
      academicYearId: currentYear?.id ?? years[0]?.id ?? '',
      orderIndex: 0,
    });
    setOpen(true);
  };

  const openEdit = (c: ClassItem) => {
    setEditing(c);
    reset({ name: c.name, academicYearId: c.academicYearId, orderIndex: c.orderIndex });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await classesService.update(editing.id, { name: data.name, orderIndex: data.orderIndex });
        toast({ title: 'Class updated' });
      } else {
        await classesService.create(data);
        toast({ title: 'Class created' });
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: e.response?.data?.message?.[0] ?? 'Try again',
      });
    }
  };

  const handleDelete = async (c: ClassItem) => {
    if (!confirm(`Delete class "${c.name}"?`)) return;
    try {
      await classesService.remove(c.id);
      toast({ title: 'Deleted' });
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'Class has linked data' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Classes</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={yearFilter || 'all'} onValueChange={(v) => setYearFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openNew} disabled={years.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> New Class
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={years.length === 0 ? 'Create an academic year first' : 'No classes yet'}
            description={
              years.length === 0
                ? 'Classes must belong to an academic year.'
                : 'Add classes like Nursery, LKG, Grade 1, etc.'
            }
            action={years.length > 0 && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Class</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classes.map((c) => (
              <div
                key={c.id}
                className="group relative p-4 border border-border rounded-lg hover:border-primary/40 hover:bg-accent/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.academicYear?.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c._count?.sections ?? 0} sections</span>
                  <span>{c._count?.subjects ?? 0} subjects</span>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card border border-border rounded-md p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Class' : 'New Class'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" placeholder="e.g. Grade 5" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select value={academicYearId} onValueChange={(v) => setValue('academicYearId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.academicYearId && <p className="text-sm text-destructive">{errors.academicYearId.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orderIndex">Display Order</Label>
              <Input id="orderIndex" type="number" min={0} {...register('orderIndex')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? 'Save Changes' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
