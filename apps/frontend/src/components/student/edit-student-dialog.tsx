'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { studentsService, Student, StudentStatus } from '@/services/student.service';
import { sectionsService, Section } from '@/services/academic.service';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'ARCHIVED']),
  transportationStatus: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function EditStudentDialog({
  open, onOpenChange, student, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: Student;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const sectionId = watch('sectionId');
  const status = watch('status');

  useEffect(() => {
    if (open) {
      sectionsService.list().then(setSections).catch(() => {});
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone ?? '',
        address: student.address ?? '',
        sectionId: student.sectionId ?? '',
        status: student.status,
        transportationStatus: student.transportationStatus,
      });
    }
  }, [open, student, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await studentsService.update(student.id, {
        ...data,
        sectionId: data.sectionId || undefined,
      });
      toast({ title: 'Student updated' });
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: e.response?.data?.message?.[0] ?? 'Try again',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register('phone')} />
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea {...register('address')} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select value={sectionId || 'none'} onValueChange={(v) => setValue('sectionId', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.class?.name} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue('status', v as StudentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  <SelectItem value="GRADUATED">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('transportationStatus')} className="h-4 w-4 rounded border-input" />
            Uses school transportation
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
