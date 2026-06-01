'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, GraduationCap, Mail, Phone, Pencil, UserX, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { useToast } from '@/hooks/use-toast';
import { teachersService, Teacher } from '@/services/teacher.service';
import { formatDate } from '@/lib/utils';

const createSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  joinDate: z.string().optional(),
});

const editSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

export default function TeachersPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { joinDate: new Date().toISOString().slice(0, 10) },
  });
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  const load = async () => {
    setLoading(true);
    try {
      setTeachers(await teachersService.list(search || undefined));
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load teachers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const onCreate = async (data: CreateForm) => {
    try {
      const payload = {
        ...data,
        phone: data.phone || undefined,
        address: data.address || undefined,
        qualification: data.qualification || undefined,
        joinDate: data.joinDate || undefined,
      };
      await teachersService.create(payload);
      toast({ title: 'Teacher added', description: `${data.firstName} ${data.lastName} can now log in.` });
      setCreateOpen(false);
      createForm.reset({ joinDate: new Date().toISOString().slice(0, 10) });
      load();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create',
        description: e.response?.data?.message?.[0] ?? 'Try again',
      });
    }
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    editForm.reset({
      firstName: t.firstName,
      lastName: t.lastName,
      phone: t.phone ?? '',
      address: t.address ?? '',
      qualification: t.qualification ?? '',
    });
  };

  const onEdit = async (data: EditForm) => {
    if (!editing) return;
    try {
      await teachersService.update(editing.id, {
        ...data,
        phone: data.phone || undefined,
        address: data.address || undefined,
        qualification: data.qualification || undefined,
      });
      toast({ title: 'Teacher updated' });
      setEditing(null);
      load();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: e.response?.data?.message?.[0] ?? 'Try again',
      });
    }
  };

  const toggleActive = async (t: Teacher) => {
    try {
      await teachersService.update(t.id, { isActive: !t.user?.isActive });
      toast({ title: t.user?.isActive ? 'Teacher deactivated' : 'Teacher activated' });
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Failed' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and their classroom assignments"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Teacher
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : teachers.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={search ? 'No teachers match your search' : 'No teachers yet'}
              description={search ? 'Try a different search term.' : 'Add the first teacher to get started.'}
              action={!search && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Teacher
                </Button>
              )}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  className="border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-accent/30 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {t.firstName[0]}{t.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {t.firstName} {t.lastName}
                        </p>
                        {!t.user?.isActive && <Badge variant="warning">Inactive</Badge>}
                      </div>
                      {t.qualification && (
                        <p className="text-xs text-muted-foreground truncate">{t.qualification}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                    {t.user?.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{t.user.email}</span>
                      </p>
                    )}
                    {t.phone && (
                      <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {t.phone}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{t._count?.sections ?? 0} sections</span>
                      <span>{t._count?.classSubjects ?? 0} subjects</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleActive(t)}
                      >
                        {t.user?.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Teacher</DialogTitle>
            <DialogDescription>Creates a login account with TEACHER role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input {...createForm.register('firstName')} />
                {createForm.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input {...createForm.register('lastName')} />
                {createForm.formState.errors.lastName && (
                  <p className="text-xs text-destructive">{createForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email (login)</Label>
              <Input type="email" {...createForm.register('email')} placeholder="teacher@school.edu.np" />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Initial Password</Label>
              <Input type="text" {...createForm.register('password')} placeholder="Min 6 characters" />
              {createForm.formState.errors.password && (
                <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...createForm.register('phone')} placeholder="98XXXXXXXX" />
              </div>
              <div className="space-y-1.5">
                <Label>Join Date</Label>
                <Input type="date" {...createForm.register('joinDate')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Qualification</Label>
              <Input {...createForm.register('qualification')} placeholder="M.Sc. Mathematics" />
            </div>

            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea {...createForm.register('address')} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>Create Teacher</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input {...editForm.register('firstName')} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input {...editForm.register('lastName')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...editForm.register('phone')} />
            </div>

            <div className="space-y-1.5">
              <Label>Qualification</Label>
              <Input {...editForm.register('qualification')} />
            </div>

            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea {...editForm.register('address')} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
