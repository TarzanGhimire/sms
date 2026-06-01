import api from '@/lib/axios';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'ARCHIVED';
export type BloodGroup = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG';

export interface Guardian {
  id?: string;
  fullName: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  isPrimary?: boolean;
}

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  dob?: string | null;
  gender?: Gender | null;
  bloodGroup?: BloodGroup | null;
  address?: string | null;
  phone?: string | null;
  admissionDate: string;
  sectionId?: string | null;
  transportationStatus: boolean;
  status: StudentStatus;
  section?: { name: string; class: { name: string; academicYear?: { name: string } } } | null;
  guardians?: Guardian[];
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  dob?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  address?: string;
  phone?: string;
  admissionDate?: string;
  sectionId?: string;
  transportationStatus?: boolean;
  guardians?: Guardian[];
}

export interface StudentStats {
  total: number;
  active: number;
  byGender: { gender: Gender | null; _count: number }[];
}

export const studentsService = {
  list: (params?: { search?: string; sectionId?: string; classId?: string; status?: StudentStatus }) =>
    api.get<{ data: Student[] }>('/students', { params }).then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Student }>(`/students/${id}`).then((r) => r.data.data),
  stats: () => api.get<{ data: StudentStats }>('/students/stats').then((r) => r.data.data),
  create: (data: CreateStudentInput) =>
    api.post<{ data: Student }>('/students', data).then((r) => r.data.data),
  update: (id: string, data: Partial<CreateStudentInput> & { status?: StudentStatus }) =>
    api.put<{ data: Student }>(`/students/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/students/${id}`),
  addGuardian: (id: string, data: Guardian) =>
    api.post<{ data: Guardian }>(`/students/${id}/guardians`, data).then((r) => r.data.data),
  removeGuardian: (guardianId: string) => api.delete(`/students/guardians/${guardianId}`),
};
