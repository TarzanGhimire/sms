'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { useToast } from '@/hooks/use-toast';
import { academicYearsService, AcademicYear } from '@/services/academic.service';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  isCurrent: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function AcademicYearsTab() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const { toast } = useToast();

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const isCurrent = watch('isCurrent');

  const load = async () => {
    setLoading(true);
    try {
      setYears(await academicYearsService.list());
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to load academic years' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ name: '', startDate: '', endDate: '', isCurrent: false });
    setOpen(true);
  };

  const openEdit = (y: AcademicYear) => {
    setEditing(y);
    reset({
      name: y.name,
      startDate: y.startDate.slice(0, 10),
      endDate: y.endDate.slice(0, 10),
      isCurrent: y.isCurrent,
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await academicYearsService.update(editing.id, data);
        toast({ title: 'Academic year updated' });
      } else {
        await academicYearsService.create(data);
        toast({ title: 'Academic year created' });
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

  const handleDelete = async (y: AcademicYear) => {
    if (!confirm(`Delete academic year "${y.name}"?`)) return;
    try {
      await academicYearsService.remove(y.id);
      toast({ title: 'Deleted' });
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'Year may have linked data' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Academic Years</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> New Year
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : years.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No academic years yet"
            description="Add the first academic year to start setting up classes and students."
            action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Year</Button>}
          />
        ) : (
          <div className="space-y-2">
            {years.map((y) => (
              <div
                key={y.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 rounded-lg p-2.5">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{y.name}</p>
                      {y.isCurrent && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(y.startDate)} – {formatDate(y.endDate)} · {y._count?.classes ?? 0} classes
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(y)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(y)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{editing ? 'Edit Academic Year' : 'New Academic Year'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Year Name</Label>
              <Input id="name" placeholder="2081-2082" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrent ?? false}
                onChange={(e) => setValue('isCurrent', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">Set as current academic year</span>
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? 'Save Changes' : 'Create Year'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
