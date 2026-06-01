'use client';

import { useEffect, useState } from 'react';
import { Percent, Plus, Pencil, Trash2 } from 'lucide-react';
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
import { discountsService, Discount } from '@/services/billing.service';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().min(0, 'Must be 0 or more'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function DiscountsTab() {
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const type = watch('type');

  const load = async () => {
    setLoading(true);
    try { setItems(await discountsService.list()); }
    catch { toast({ variant: 'destructive', title: 'Failed to load' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ name: '', type: 'PERCENTAGE', value: 0, description: '' });
    setOpen(true);
  };
  const openEdit = (d: Discount) => {
    setEditing(d);
    reset({ name: d.name, type: d.type, value: d.value, description: d.description ?? '' });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, description: data.description || undefined };
      if (editing) await discountsService.update(editing.id, payload);
      else await discountsService.create(payload);
      toast({ title: editing ? 'Updated' : 'Created' });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    }
  };

  const handleDelete = async (d: Discount) => {
    if (!confirm(`Delete "${d.name}"?`)) return;
    try { await discountsService.remove(d.id); toast({ title: 'Deleted' }); load(); }
    catch { toast({ variant: 'destructive', title: 'Cannot delete', description: 'Discount is in use' }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Discounts & Scholarships</CardTitle>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New Discount</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Percent}
            title="No discounts yet"
            description="Add discounts like Sibling Discount, Merit Scholarship, Staff Discount."
            action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Discount</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((d) => (
              <div key={d.id} className="group relative p-4 border border-border rounded-lg hover:border-primary/40 hover:bg-accent/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{d.name}</p>
                    <Badge variant={d.type === 'PERCENTAGE' ? 'info' : 'warning'} className="mt-1">
                      {d.type === 'PERCENTAGE' ? `${d.value}%` : `NPR ${d.value}`}
                    </Badge>
                  </div>
                  {!d.isActive && <Badge variant="outline">Inactive</Badge>}
                </div>
                {d.description && <p className="text-xs text-muted-foreground mt-2">{d.description}</p>}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card border border-border rounded-md p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d)}>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Discount' : 'New Discount'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. Sibling Discount" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed amount (NPR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input type="number" step="0.01" min="0" {...register('value')} />
                {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={2} placeholder="Optional notes" />
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
