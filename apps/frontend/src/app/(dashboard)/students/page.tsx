'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users, Eye, Pencil, MoreVertical, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import {
  studentsService, Student, StudentStatus, StudentStats,
} from '@/services/student.service';
import { sectionsService, Section } from '@/services/academic.service';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<StudentStatus, 'success' | 'warning' | 'secondary' | 'info' | 'outline'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TRANSFERRED: 'info',
  GRADUATED: 'secondary',
  ARCHIVED: 'outline',
};

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');

  const load = async () => {
    setLoading(true);
    try {
      const [sList, secs, st] = await Promise.all([
        studentsService.list({
          search: search || undefined,
          sectionId: sectionFilter || undefined,
          status: statusFilter || undefined,
        }),
        sectionsService.list(),
        studentsService.stats(),
      ]);
      setStudents(sList);
      setSections(secs);
      setStats(st);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, sectionFilter, statusFilter]);

  const handleArchive = async (s: Student) => {
    if (!confirm(`Archive ${s.firstName} ${s.lastName}?`)) return;
    try {
      await studentsService.remove(s.id);
      toast({ title: 'Student archived' });
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to archive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student admissions, profiles, and records"
        action={
          <Link href="/students/new">
            <Button><Plus className="h-4 w-4 mr-1" /> Admit Student</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats?.total ?? '—'} color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        <StatCard label="Active" value={stats?.active ?? '—'} color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" />
        <StatCard label="Male" value={stats?.byGender.find((g) => g.gender === 'MALE')?._count ?? 0} color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" />
        <StatCard label="Female" value={stats?.byGender.find((g) => g.gender === 'FEMALE')?._count ?? 0} color="bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400" />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sectionFilter || 'all'} onValueChange={(v) => setSectionFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.class?.name} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v as StudentStatus)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                <SelectItem value="GRADUATED">Graduated</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Class / Section</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admitted</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-8" /></TableCell>
                    </TableRow>
                  ))
                ) : students.length === 0 ? (
                  <TableEmpty colSpan={7}>
                    <div className="flex flex-col items-center gap-2 py-6">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                      <p>No students found</p>
                      <Link href="/students/new">
                        <Button size="sm" variant="outline" className="mt-2">
                          <Plus className="h-4 w-4 mr-1" /> Admit your first student
                        </Button>
                      </Link>
                    </div>
                  </TableEmpty>
                ) : (
                  students.map((s) => {
                    const primaryGuardian = s.guardians?.[0];
                    return (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`/students/${s.id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {s.firstName[0]}{s.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{s.firstName} {s.lastName}</p>
                              {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                        <TableCell>
                          {s.section ? (
                            <span className="text-sm">
                              {s.section.class.name} <span className="text-muted-foreground">— {s.section.name}</span>
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {primaryGuardian ? (
                            <div>
                              <p className="text-sm">{primaryGuardian.fullName}</p>
                              <p className="text-xs text-muted-foreground">{primaryGuardian.phone}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(s.admissionDate)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/students/${s.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/students/${s.id}?edit=1`)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleArchive(s)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Archive className="h-4 w-4 mr-2" /> Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className={`rounded-md p-1.5 ${color}`}>
            <Users className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
