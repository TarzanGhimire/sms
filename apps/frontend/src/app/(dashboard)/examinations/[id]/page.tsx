'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ClipboardEdit, Trophy, CheckCircle2, CalendarDays,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { cn, formatDate } from '@/lib/utils';
import { examsService, Exam, ExamType } from '@/services/exam.service';
import { sectionsService, Section } from '@/services/academic.service';
import { MarksEntryGrid } from '@/components/exam/marks-entry-grid';
import { ResultsView } from '@/components/exam/results-view';

const examTypeLabel: Record<ExamType, string> = {
  FIRST_TERMINAL: 'First Terminal', MID_TERM: 'Mid-Term',
  SECOND_TERMINAL: 'Second Terminal', FINAL_EXAM: 'Final Exam', UNIT_TEST: 'Unit Test',
};

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState<string>('');
  const [tab, setTab] = useState<'entry' | 'results'>('entry');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([examsService.get(id), sectionsService.list()])
      .then(([e, s]) => {
        setExam(e);
        setSections(s);
        if (s.length > 0) setSectionId(s[0].id);
      })
      .catch(() => { toast({ variant: 'destructive', title: 'Exam not found' }); router.push('/examinations'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !exam) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const selectedSection = sections.find((s) => s.id === sectionId);
  const classId = selectedSection?.classId ?? '';

  return (
    <div className="space-y-6">
      <Link href="/examinations"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to exams</Button></Link>

      <PageHeader
        title={exam.name}
        description={`${examTypeLabel[exam.examType]} · ${formatDate(exam.startDate)} – ${formatDate(exam.endDate)}`}
        action={exam.isPublished
          ? <Badge variant="success" className="gap-1 text-sm py-1.5 px-3"><CheckCircle2 className="h-3.5 w-3.5" /> Published</Badge>
          : <Badge variant="outline" className="text-sm py-1.5 px-3">Draft</Badge>}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Section:</span>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.class?.name} — Section {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="inline-flex gap-1 bg-muted/50 p-1 rounded-lg">
              <button
                onClick={() => setTab('entry')}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === 'entry' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <ClipboardEdit className="h-4 w-4" /> Marks Entry
              </button>
              <button
                onClick={() => setTab('results')}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === 'results' ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Trophy className="h-4 w-4" /> Results
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!sectionId ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center border border-dashed border-border rounded-lg">
          <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">No sections available</p>
          <p className="text-sm text-muted-foreground">Create sections in Academics first.</p>
        </div>
      ) : tab === 'entry' ? (
        <MarksEntryGrid examId={exam.id} sectionId={sectionId} classId={classId} isPublished={exam.isPublished} />
      ) : (
        <ResultsView examId={exam.id} sectionId={sectionId} />
      )}
    </div>
  );
}
