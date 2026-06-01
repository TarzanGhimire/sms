'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin, Calendar, User,
  Users, Briefcase, Heart, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  studentsService, Student, StudentStatus,
} from '@/services/student.service';
import { formatDate } from '@/lib/utils';
import { EditStudentDialog } from '@/components/student/edit-student-dialog';

const statusVariant: Record<StudentStatus, 'success' | 'warning' | 'secondary' | 'info' | 'outline'> = {
  ACTIVE: 'success', INACTIVE: 'warning', TRANSFERRED: 'info', GRADUATED: 'secondary', ARCHIVED: 'outline',
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(search.get('edit') === '1');

  const load = async () => {
    setLoading(true);
    try {
      const s = await studentsService.get(params.id);
      setStudent(s);
    } catch {
      toast({ variant: 'destructive', title: 'Student not found' });
      router.push('/students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/students">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to students
        </Button>
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {student.firstName[0]}{student.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">
                    {student.firstName} {student.lastName}
                  </h1>
                  <Badge variant={statusVariant[student.status]}>{student.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{student.studentId}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {student.section && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {student.section.class.name} — Section {student.section.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Admitted {formatDate(student.admissionDate)}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Date of Birth" value={student.dob ? formatDate(student.dob) : '—'} />
            <InfoRow label="Gender" value={student.gender ?? '—'} />
            <InfoRow label="Blood Group" value={student.bloodGroup?.replace('_POS', '+').replace('_NEG', '-') ?? '—'} icon={Heart} />
            <InfoRow label="Phone" value={student.phone ?? '—'} icon={Phone} />
            <InfoRow label="Address" value={student.address ?? '—'} icon={MapPin} />
            <InfoRow label="Transport" value={student.transportationStatus ? 'Uses school bus' : 'Self-arranged'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Guardians
            </CardTitle>
            <CardDescription>{student.guardians?.length ?? 0} guardian(s) on record</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.guardians?.length ? (
              student.guardians.map((g, idx) => (
                <div key={g.id ?? idx}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{g.fullName}</p>
                      <p className="text-xs text-muted-foreground">{g.relationship}</p>
                    </div>
                    {g.isPrimary && <Badge variant="info">Primary</Badge>}
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {g.phone}</p>
                    {g.email && <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> {g.email}</p>}
                    {g.occupation && <p className="flex items-center gap-2"><Briefcase className="h-3 w-3" /> {g.occupation}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No guardians on record.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <EditStudentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student}
        onSaved={load}
      />
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
