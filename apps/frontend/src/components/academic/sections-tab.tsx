'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { useToast } from '@/hooks/use-toast';
import {
  sectionsService, classesService, Section, ClassItem,
} from '@/services/academic.service';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  teacherId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SectionsTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classFilter, setClassFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const { toast } = useToast();

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const classId = watch('classId');

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        sectionsService.list(classFilter || undefined),
        classesService.list(),
      ]);
      setSections(s);
      setClasses(c);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load sections' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [classFilter]);

  const openNew = () => {
    setEditing(null);
    reset({ name: '', classId: classes[0]?.id ?? '', teacherId: '' });
    setOpen(true);
  };

  const openEdit = (s: Section) => {
    setEditing(s);
    reset({ name: s.name, classId: s.classId, teacherId: s.teacherId ?? '' });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, teacherId: data.teacherId || undefined };
      if (editing) {
        await sectionsService.update(editing.id, { name: payload.name, teacherId: payload.teacherId });
        toast({ title: 'Section updated' });
      } else {
        await sectionsService.create(payload);
        toast({ title: 'Section created' });
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

  const handleDelete = async (s: Section) => {
    if (!confirm(`Delete section "${s.name}"?`)) return;
    try {
      await sectionsService.remove(s.id);
      toast({ title: 'Deleted' });
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'Section has students' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Sections</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={classFilter || 'all'} onValueChange={(v) => setClassFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.academicYear?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openNew} disabled={classes.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> New Section
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : sections.length === 0 ? (
          <EmptyState
            icon={Users}
            title={classes.length === 0 ? 'Create classes first' : 'No sections yet'}
            description="Add sections like A, B, C under each class."
          />
        ) : (
          <div className="space-y-2">
            {sections.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-950 rounded-lg p-2.5">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {s.class?.name} — Section {s.name}
                      </p>
                      <Badge variant="outline">{s._count?.students ?? 0} students</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.teacher
                        ? `Class teacher: ${s.teacher.firstName} ${s.teacher.lastName}`
                        : 'No class teacher assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s)}
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
            <DialogTitle>{editing ? 'Edit Section' : 'New Section'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Section Name</Label>
              <Input id="name" placeholder="A" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={classId} onValueChange={(v) => setValue('classId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} · {c.academicYear?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classId && <p className="text-sm text-destructive">{errors.classId.message}</p>}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? 'Save Changes' : 'Create Section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
