'use client';

import { useEffect, useState } from 'react';
import { Trophy, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { marksService, SectionResults } from '@/services/exam.service';
import { ReportCardDialog } from '@/components/exam/report-card-dialog';

interface Props {
  examId: string;
  sectionId: string;
}

export function ResultsView({ examId, sectionId }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<SectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewStudent, setViewStudent] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    marksService.results(examId, sectionId)
      .then(setData)
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load results' }))
      .finally(() => setLoading(false));
  }, [examId, sectionId]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data) return null;

  const withMarks = data.results.filter((r) => r.subjects.length > 0).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  if (withMarks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center border border-dashed border-border rounded-lg">
        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-medium">No results yet</p>
        <p className="text-sm text-muted-foreground">Enter marks in the Marks Entry tab first.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
              <TableHead className="text-right">GPA</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withMarks.map((r) => (
              <TableRow key={r.studentId}>
                <TableCell>
                  {r.rank === 1 ? (
                    <Badge variant="warning" className="gap-1"><Trophy className="h-3 w-3" /> 1st</Badge>
                  ) : (
                    <span className="font-semibold text-muted-foreground pl-2">{r.rank}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.studentCode}</div>
                </TableCell>
                <TableCell className="text-right font-mono">{r.totalObtained} / {r.totalFull}</TableCell>
                <TableCell className="text-right font-mono">{r.percentage}%</TableCell>
                <TableCell className="text-right font-mono font-semibold">{r.gpa.toFixed(2)}</TableCell>
                <TableCell><Badge variant="info">{r.overallGrade}</Badge></TableCell>
                <TableCell>
                  <Badge variant={r.result === 'PASS' ? 'success' : 'destructive'}>{r.result}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setViewStudent(r.studentId)}>
                    <Eye className="h-4 w-4 mr-1" /> Card
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {viewStudent && (
        <ReportCardDialog
          examId={examId}
          studentId={viewStudent}
          open={!!viewStudent}
          onOpenChange={(o) => !o && setViewStudent(null)}
        />
      )}
    </>
  );
}
