'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Plus, Trash2, User, Users, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { studentsService } from '@/services/student.service';
import { sectionsService, Section } from '@/services/academic.service';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  admissionDate: z.string().optional(),
  sectionId: z.string().optional(),
  transportationStatus: z.boolean().optional(),
  guardians: z.array(z.object({
    fullName: z.string().min(1, 'Required'),
    relationship: z.string().min(1, 'Required'),
    phone: z.string().min(1, 'Required'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    occupation: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })).min(1, 'At least one guardian is required'),
});

type FormData = z.infer<typeof schema>;

export default function NewStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      guardians: [{ fullName: '', relationship: 'Father', phone: '', isPrimary: true }],
      transportationStatus: false,
      admissionDate: new Date().toISOString().slice(0, 10),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'guardians' });

  useEffect(() => {
    sectionsService.list().then(setSections).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        dob: data.dob || undefined,
        bloodGroup: (data.bloodGroup as any) || undefined,
        gender: data.gender || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        admissionDate: data.admissionDate || undefined,
        sectionId: data.sectionId || undefined,
        guardians: data.guardians.map((g) => ({
          ...g,
          email: g.email || undefined,
          address: g.address || undefined,
          occupation: g.occupation || undefined,
        })),
      };
      const created = await studentsService.create(payload);
      toast({ title: 'Student admitted', description: `${created.firstName} ${created.lastName} (${created.studentId})` });
      router.push(`/students/${created.id}`);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to admit',
        description: e.response?.data?.message?.[0] ?? 'Try again',
      });
    }
  };

  const gender = watch('gender');
  const bloodGroup = watch('bloodGroup');
  const sectionId = watch('sectionId');

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/students">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to students
        </Button>
      </Link>

      <PageHeader title="Admit Student" description="Add a new student with guardian details" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Personal Information</CardTitle>
            </div>
            <CardDescription>Basic student details. A unique Student ID will be auto-generated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name *" error={errors.firstName?.message}>
                <Input {...register('firstName')} placeholder="Aarav" />
              </Field>
              <Field label="Last Name *" error={errors.lastName?.message}>
                <Input {...register('lastName')} placeholder="Sharma" />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Date of Birth">
                <Input type="date" {...register('dob')} />
              </Field>
              <Field label="Gender">
                <Select value={gender} onValueChange={(v) => setValue('gender', v as any)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Blood Group">
                <Select value={bloodGroup} onValueChange={(v) => setValue('bloodGroup', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg.replace('_POS', '+').replace('_NEG', '-')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone Number">
                <Input {...register('phone')} placeholder="98XXXXXXXX" />
              </Field>
              <Field label="Admission Date">
                <Input type="date" {...register('admissionDate')} />
              </Field>
            </div>

            <Field label="Address">
              <Textarea {...register('address')} placeholder="Street, City, District" rows={2} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Class Assignment</CardTitle>
            </div>
            <CardDescription>Assign the student to a section. You can do this later too.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Section">
              <Select value={sectionId} onValueChange={(v) => setValue('sectionId', v)}>
                <SelectTrigger><SelectValue placeholder="Choose section (optional)" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.class?.name} — Section {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" {...register('transportationStatus')} className="h-4 w-4 rounded border-input" />
              Uses school transportation
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Guardian Details</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ fullName: '', relationship: '', phone: '', isPrimary: false })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Guardian
              </Button>
            </div>
            <CardDescription>At least one guardian is required. The first is marked as primary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, idx) => (
              <div key={field.id}>
                {idx > 0 && <Separator className="mb-6" />}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">
                    Guardian {idx + 1} {idx === 0 && <span className="text-xs text-primary ml-1">(Primary)</span>}
                  </h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(idx)}
                      className="text-destructive hover:text-destructive h-7 w-7"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name *" error={errors.guardians?.[idx]?.fullName?.message}>
                    <Input {...register(`guardians.${idx}.fullName`)} placeholder="Ram Sharma" />
                  </Field>
                  <Field label="Relationship *" error={errors.guardians?.[idx]?.relationship?.message}>
                    <Input {...register(`guardians.${idx}.relationship`)} placeholder="Father, Mother, Uncle..." />
                  </Field>
                  <Field label="Phone *" error={errors.guardians?.[idx]?.phone?.message}>
                    <Input {...register(`guardians.${idx}.phone`)} placeholder="98XXXXXXXX" />
                  </Field>
                  <Field label="Email" error={errors.guardians?.[idx]?.email?.message}>
                    <Input type="email" {...register(`guardians.${idx}.email`)} placeholder="parent@example.com" />
                  </Field>
                  <Field label="Occupation">
                    <Input {...register(`guardians.${idx}.occupation`)} placeholder="Engineer" />
                  </Field>
                  <Field label="Address">
                    <Input {...register(`guardians.${idx}.address`)} placeholder="Same as student" />
                  </Field>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/students"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Admit Student
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
