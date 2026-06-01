'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/layout/empty-state';
import { useToast } from '@/hooks/use-toast';
import { subjectsService, Subject } from '@/services/academic.service';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  code: z.string().min(1, 'Required'),
  isOptional: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const { toast } = useToast();

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const isOptional = watch('isOptional');

  const load = async () => {
    setLoading(true);
    try {
      setSubjects(await subjectsService.list());
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load subjects' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ name: '', code: '', isOptional: false });
    setOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    reset({ name: s.name, code: s.code, isOptional: s.isOptional });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await subjectsService.update(editing.id, data);
        toast({ title: 'Subject updated' });
      } else {
        await subjectsService.create(data);
        toast({ title: 'Subject created' });
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

  const handleDelete = async (s: Subject) => {
    if (!confirm(`Delete subject "${s.name}"?`)) return;
    try {
      await subjectsService.remove(s.id);
      toast({ title: 'Deleted' });
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Cannot delete', description: 'Subject is in use' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Subjects</CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> New Subject
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No subjects yet"
            description="Add subjects like Mathematics, English, Science."
            action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Subject</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="group relative p-4 border border-border rounded-lg hover:border-primary/40 hover:bg-accent/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 dark:bg-purple-950 rounded-lg p-2">
                    <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-[10px]">{s.code}</Badge>
                      {s.isOptional && <Badge variant="info">Optional</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Used in {s._count?.classSubjects ?? 0} classes
                    </p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card border border-border rounded-md p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(s)}
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
            <DialogTitle>{editing ? 'Edit Subject' : 'New Subject'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input id="name" placeholder="Mathematics" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="MATH" {...register('code')} />
                {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOptional ?? false}
                onChange={(e) => setValue('isOptional', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">Optional subject</span>
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {editing ? 'Save Changes' : 'Create Subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
