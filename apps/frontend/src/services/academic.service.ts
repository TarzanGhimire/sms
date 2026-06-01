import api from '@/lib/axios';

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  _count?: { classes: number };
}

export interface ClassItem {
  id: string;
  name: string;
  orderIndex: number;
  academicYearId: string;
  academicYear?: { name: string };
  _count?: { sections: number; subjects: number };
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  teacherId?: string | null;
  class?: { name: string; academicYear?: { name: string } };
  teacher?: { id: string; firstName: string; lastName: string } | null;
  _count?: { students: number };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  isOptional: boolean;
  _count?: { classSubjects: number };
}

export const academicYearsService = {
  list: () => api.get<{ data: AcademicYear[] }>('/academic-years').then((r) => r.data.data),
  create: (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) =>
    api.post<{ data: AcademicYear }>('/academic-years', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; startDate: string; endDate: string; isCurrent: boolean }>) =>
    api.put<{ data: AcademicYear }>(`/academic-years/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/academic-years/${id}`),
};

export const classesService = {
  list: (academicYearId?: string) =>
    api.get<{ data: ClassItem[] }>('/classes', { params: { academicYearId } }).then((r) => r.data.data),
  get: (id: string) => api.get<{ data: any }>(`/classes/${id}`).then((r) => r.data.data),
  create: (data: { name: string; academicYearId: string; orderIndex?: number }) =>
    api.post<{ data: ClassItem }>('/classes', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; orderIndex: number }>) =>
    api.put<{ data: ClassItem }>(`/classes/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/classes/${id}`),
};

export const sectionsService = {
  list: (classId?: string) =>
    api.get<{ data: Section[] }>('/sections', { params: { classId } }).then((r) => r.data.data),
  create: (data: { name: string; classId: string; teacherId?: string }) =>
    api.post<{ data: Section }>('/sections', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; teacherId: string }>) =>
    api.put<{ data: Section }>(`/sections/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/sections/${id}`),
};

export const subjectsService = {
  list: () => api.get<{ data: Subject[] }>('/subjects').then((r) => r.data.data),
  create: (data: { name: string; code: string; isOptional?: boolean }) =>
    api.post<{ data: Subject }>('/subjects', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; code: string; isOptional: boolean }>) =>
    api.put<{ data: Subject }>(`/subjects/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/subjects/${id}`),
};
