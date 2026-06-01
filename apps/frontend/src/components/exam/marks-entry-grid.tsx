'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { marksService, EntryGrid } from '@/services/exam.service';

interface Props {
  examId: string;
  sectionId: string;
  classId: string;
  isPublished: boolean;
}

// markEntries[studentId][subjectId] = { total, absent }
type EntryMap = Record<string, Record<string, { total: string; absent: boolean }>>;

export function MarksEntryGrid({ examId, sectionId, classId, isPublished }: Props) {
  const { toast } = useToast();
  const [grid, setGrid] = useState<EntryGrid | null>(null);
  const [entries, setEntries] = useState<EntryMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const g = await marksService.entryGrid(examId, sectionId);
      setGrid(g);
      // Seed entries from existing marks
      const map: EntryMap = {};
      for (const s of g.students) {
        map[s.id] = {};
        for (const subj of g.subjects) {
          const existing = g.marks.find((m) => m.studentId === s.id && m.subjectId === subj.subjectId);
          map[s.id][subj.subjectId] = {
            total: existing ? String(existing.totalMarks) : '',
            absent: existing?.isAbsent ?? false,
          };
        }
      }
      setEntries(map);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load marks grid' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [examId, sectionId]);

  const setCell = (studentId: string, subjectId: string, total: string) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subjectId]: { ...prev[studentId][subjectId], total } },
    }));
  };

  const toggleAbsent = (studentId: string, subjectId: string) => {
    setEntries((prev) => {
      const cur = prev[studentId][subjectId];
      return {
        ...prev,
        [studentId]: { ...prev[studentId], [subjectId]: { total: cur.absent ? cur.total : '', absent: !cur.absent } },
      };
    });
  };

  const handleSave = async () => {
    if (!grid) return;
    setSaving(true);
    try {
      const marks: { studentId: string; subjectId: string; totalMarks?: number; isAbsent?: boolean }[] = [];
      for (const s of grid.students) {
        for (const subj of grid.subjects) {
          const cell = entries[s.id]?.[subj.subjectId];
          if (!cell) continue;
          if (cell.absent) {
            marks.push({ studentId: s.id, subjectId: subj.subjectId, isAbsent: true, totalMarks: 0 });
          } else if (cell.total !== '') {
            marks.push({ studentId: s.id, subjectId: subj.subjectId, totalMarks: parseFloat(cell.total) });
          }
        }
      }
      const res = await marksService.bulkSave({ examId, classId, marks });
      toast({ title: 'Marks saved', description: `${res.saved} entries recorded` });
      load();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!grid) return null;

  if (grid.subjects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center border border-dashed border-border rounded-lg">
        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-medium">No subjects configured for {grid.section.className}</p>
        <p className="text-sm text-muted-foreground">
          Go to Academics → Class Subjects to assign subjects to this class first.
        </p>
      </div>
    );
  }

  if (grid.students.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center border border-dashed border-border rounded-lg">
        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-medium">No active students in this section</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isPublished && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          This exam is published. Unpublish it to edit marks.
        </div>
      )}

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card min-w-[180px]">Student</TableHead>
              {grid.subjects.map((s) => (
                <TableHead key={s.subjectId} className="text-center min-w-[110px]">
                  <div>{s.name}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    Full {s.fullMarks} · Pass {s.passMarks}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {grid.students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="sticky left-0 bg-card font-medium">
                  <div>{student.firstName} {student.lastName}</div>
                  <div className="text-xs text-muted-foreground font-mono">{student.studentId}</div>
                </TableCell>
                {grid.subjects.map((subj) => {
                  const cell = entries[student.id]?.[subj.subjectId] ?? { total: '', absent: false };
                  const val = parseFloat(cell.total);
                  const invalid = cell.total !== '' && (isNaN(val) || val < 0 || val > subj.fullMarks);
                  return (
                    <TableCell key={subj.subjectId} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Input
                          type="number"
                          value={cell.total}
                          disabled={cell.absent || isPublished}
                          onChange={(e) => setCell(student.id, subj.subjectId, e.target.value)}
                          className={`w-20 text-center h-8 ${invalid ? 'border-destructive' : ''}`}
                          placeholder="—"
                        />
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cell.absent}
                            disabled={isPublished}
                            onChange={() => toggleAbsent(student.id, subj.subjectId)}
                            className="h-3 w-3"
                          />
                          Absent
                        </label>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!isPublished && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Marks
          </Button>
        </div>
      )}
    </div>
  );
}
