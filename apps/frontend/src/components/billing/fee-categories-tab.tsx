'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { feeCategoriesService, FeeCategory, FeeType } from '@/services/billing.service';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  feeType: z.enum(['RECURRING', 'ONE_TIME', 'OPTIONAL']),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const typeVariant: Record<FeeType, 'info' | 'warning' | 'secondary'> = {
  RECURRING: 'info', ONE_TIME: 'warning', OPTIONAL: 'secondary',
};
const typeLabel: Record<FeeType, string> = {
  RECURRING: 'Recurring', ONE_TIME: 'One-Time', OPTIONAL: 'Optional',
};

export function FeeCategoriesTab() {
  const [items, setItems] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeCategory | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const feeType = watch('feeType');

  const load = async () => {
    setLoading(true);
    try { setItems(await feeCategoriesService.list()); }
    catch { toast({ variant: 'destructive', title: 'Failed to load' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ name: '', feeType: 'RECURRING', description: '' });
    setOpen(true);
  };
  const openEdit = (c: FeeCategory) => {
    setEditing(c);
    reset({ name: c.name, feeType: c.feeType, description: c.description ?? '' });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, description: data.description || undefined };
      if (editing) await feeCategoriesService.update(editing.id, payload);
      else await feeCategoriesService.create(payload);
      toast({ title: editing ? 'Updated' : 'Created' });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    }
  };

  const handleDelete = async (c: FeeCategory) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try { await feeCategoriesService.remove(c.id); toast({ title: 'Deleted' }); load(); }
    catch { toast({ variant: 'destructive', title: 'Cannot delete', description: 'Category is in use' }); }
  };

  const grouped = {
    RECURRING: items.filter((i) => i.feeType === 'RECURRING'),
    ONE_TIME: items.filter((i) => i.feeType === 'ONE_TIME'),
    OPTIONAL: items.filter((i) => i.feeType === 'OPTIONAL'),
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fee Categories</CardTitle>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Category</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No fee categories yet"
            description="Add categories like Tuition Fee, Transportation, Lab Fee, Exam Fee."
            action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Category</Button>}
          />
        ) : (
          <div className="space-y-6">
            {(['RECURRING', 'ONE_TIME', 'OPTIONAL'] as FeeType[]).map((ft) => grouped[ft].length > 0 && (
              <div key={ft}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={typeVariant[ft]}>{typeLabel[ft]}</Badge>
                  <span className="text-xs text-muted-foreground">{grouped[ft].length} categories</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {grouped[ft].map((c) => (
                    <div key={c.id} className="group flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/30">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{c._count?.feeStructures ?? 0} classes</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'New Fee Category'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. Tuition Fee" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={feeType} onValueChange={(v) => setValue('feeType', v as FeeType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECURRING">Recurring (monthly)</SelectItem>
                  <SelectItem value="ONE_TIME">One-Time (admission, exam)</SelectItem>
                  <SelectItem value="OPTIONAL">Optional (events, extras)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={2} placeholder="Optional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{editing ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
