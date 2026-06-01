'use client';

import { useEffect, useState } from 'react';
import { Printer, Loader2, GraduationCap } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { marksService, StudentReportCard } from '@/services/exam.service';
import { printElement } from '@/lib/print';
import { downloadFile } from '@/lib/download';
import { formatBs } from '@/lib/nepali-date';

interface Props {
  examId: string;
  studentId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ReportCardDialog({ examId, studentId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [card, setCard] = useState<StudentReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!card) return;
    setDownloading(true);
    try {
      await downloadFile(
        `/marks/report-card/pdf?examId=${examId}&studentId=${studentId}`,
        `report-card-${card.student.studentId}.pdf`,
      );
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    marksService.reportCard(examId, studentId)
      .then(setCard)
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load report card' }))
      .finally(() => setLoading(false));
  }, [open, examId, studentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl print:shadow-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Report Card</DialogTitle>
            <div className="flex gap-2 mr-8 print:hidden">
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={!card || downloading}>
                {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => printElement(document.getElementById('report-card'), `Report Card - ${card?.student.firstName ?? ''} ${card?.student.lastName ?? ''}`)}
                disabled={!card}
              >
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading || !card ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5" id="report-card">
            {/* Header */}
            <div className="text-center border-b border-border pb-4">
              <div className="flex justify-center mb-2">
                <div className="bg-primary rounded-full p-2">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-bold">My School</h2>
              <p className="text-sm text-muted-foreground">{card.exam.name}</p>
              <p className="text-xs text-muted-foreground">Academic Year {card.exam.academicYear}</p>
              <p className="text-xs text-muted-foreground mt-1">Issued: {formatBs(new Date())} BS</p>
            </div>

            {/* Student info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Student" value={`${card.student.firstName} ${card.student.lastName}`} />
              <InfoRow label="Student ID" value={card.student.studentId} />
              <InfoRow label="Class" value={`${card.student.className} — ${card.student.sectionName}`} />
              <InfoRow label="Guardian" value={card.student.guardian ?? '—'} />
            </div>

            {/* Marks table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Full</TableHead>
                    <TableHead className="text-right">Pass</TableHead>
                    <TableHead className="text-right">Obtained</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {card.subjects.map((s) => (
                    <TableRow key={s.subjectId}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right font-mono">{s.fullMarks}</TableCell>
                      <TableCell className="text-right font-mono">{s.passMarks}</TableCell>
                      <TableCell className="text-right font-mono">
                        {s.isAbsent ? <span className="text-muted-foreground">ABS</span> : s.obtained}
                      </TableCell>
                      <TableCell>{s.grade}</TableCell>
                      <TableCell>
                        <Badge variant={s.passed ? 'success' : 'destructive'} className="text-[10px]">
                          {s.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <SummaryCard label="Total" value={`${card.totalObtained}/${card.totalFull}`} />
              <SummaryCard label="Percentage" value={`${card.percentage}%`} />
              <SummaryCard label="GPA" value={card.gpa.toFixed(2)} />
              <SummaryCard label="Grade" value={card.overallGrade} />
              <SummaryCard
                label="Rank"
                value={card.rank ? `${card.rank} / ${card.totalStudents}` : '—'}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant={card.result === 'PASS' ? 'success' : 'destructive'} className="text-sm">
                Result: {card.result}
              </Badge>
              {card.exam.isPublished && <Badge variant="info">Published</Badge>}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs text-muted-foreground">
              <div className="border-t border-border pt-1">Class Teacher</div>
              <div className="border-t border-border pt-1">Principal</div>
              <div className="border-t border-border pt-1">Date</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
