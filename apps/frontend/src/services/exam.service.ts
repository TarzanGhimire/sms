import api from '@/lib/axios';

export type ExamType = 'FIRST_TERMINAL' | 'MID_TERM' | 'SECOND_TERMINAL' | 'FINAL_EXAM' | 'UNIT_TEST';

export interface Exam {
  id: string;
  name: string;
  examType: ExamType;
  academicYearId: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  academicYear?: { name: string };
  _count?: { marks: number };
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string | null;
  fullMarks: number;
  passMarks: number;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  class?: { name: string; academicYear?: { name: string } };
  subject?: { id: string; name: string; code: string };
  teacher?: { id: string; firstName: string; lastName: string } | null;
}

export interface EntryGridSubject {
  subjectId: string;
  name: string;
  code: string;
  fullMarks: number;
  passMarks: number;
  theoryMarks?: number | null;
  practicalMarks?: number | null;
  hasPractical: boolean;
}

export interface EntryGridMark {
  id: string;
  studentId: string;
  subjectId: string;
  theoryMarks: number | null;
  practicalMarks: number | null;
  totalMarks: number;
  grade: string | null;
  isAbsent: boolean;
}

export interface EntryGrid {
  exam: { id: string; name: string; isPublished: boolean };
  section: { id: string; name: string; className: string };
  students: { id: string; studentId: string; firstName: string; lastName: string }[];
  subjects: EntryGridSubject[];
  marks: EntryGridMark[];
}

export interface ReportCardSubject {
  subjectId: string;
  name: string;
  code: string;
  fullMarks: number;
  passMarks: number;
  theoryMarks: number | null;
  practicalMarks: number | null;
  obtained: number;
  grade: string | null;
  gradePoint: number | null;
  isAbsent: boolean;
  passed: boolean;
  remarks: string | null;
}

export interface ReportCard {
  studentId: string;
  studentCode: string;
  name: string;
  subjects: ReportCardSubject[];
  totalFull: number;
  totalObtained: number;
  percentage: number;
  gpa: number;
  overallGrade: string;
  result: 'PASS' | 'FAIL';
  rank: number | null;
}

export interface SectionResults {
  exam: { id: string; name: string; examType: ExamType; isPublished: boolean; academicYear: string };
  section: { id: string; name: string; className: string };
  results: ReportCard[];
}

export interface StudentReportCard extends ReportCard {
  exam: { id: string; name: string; examType: ExamType; isPublished: boolean; academicYear: string };
  student: {
    id: string; studentId: string; firstName: string; lastName: string;
    className: string; sectionName: string; guardian: string | null;
  };
  totalStudents: number;
}

export const examsService = {
  list: () => api.get<{ data: Exam[] }>('/exams').then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Exam }>(`/exams/${id}`).then((r) => r.data.data),
  create: (data: { name: string; examType: ExamType; startDate: string; endDate: string }) =>
    api.post<{ data: Exam }>('/exams', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; examType: ExamType; startDate: string; endDate: string; isPublished: boolean }>) =>
    api.put<{ data: Exam }>(`/exams/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/exams/${id}`),
};

export const classSubjectsService = {
  list: (classId?: string) =>
    api.get<{ data: ClassSubject[] }>('/class-subjects', { params: { classId } }).then((r) => r.data.data),
  create: (data: { classId: string; subjectId: string; teacherId?: string; fullMarks?: number; passMarks?: number; practicalMarks?: number }) =>
    api.post<{ data: ClassSubject }>('/class-subjects', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ fullMarks: number; passMarks: number; practicalMarks: number; teacherId: string }>) =>
    api.put<{ data: ClassSubject }>(`/class-subjects/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/class-subjects/${id}`),
};

export const marksService = {
  entryGrid: (examId: string, sectionId: string) =>
    api.get<{ data: EntryGrid }>('/marks/entry-grid', { params: { examId, sectionId } }).then((r) => r.data.data),
  results: (examId: string, sectionId: string) =>
    api.get<{ data: SectionResults }>('/marks/results', { params: { examId, sectionId } }).then((r) => r.data.data),
  reportCard: (examId: string, studentId: string) =>
    api.get<{ data: StudentReportCard }>('/marks/report-card', { params: { examId, studentId } }).then((r) => r.data.data),
  bulkSave: (data: { examId: string; classId: string; marks: { studentId: string; subjectId: string; theoryMarks?: number; practicalMarks?: number; totalMarks?: number; isAbsent?: boolean }[] }) =>
    api.post<{ data: { saved: number } }>('/marks/bulk', data).then((r) => r.data.data),
};
