import api from '@/lib/axios';

export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  qualification?: string | null;
  joinDate: string;
  isActive: boolean;
  user?: { email: string; isActive: boolean; lastLogin?: string | null };
  _count?: { sections: number; classSubjects: number };
}

export interface CreateTeacherInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  qualification?: string;
  joinDate?: string;
  photoUrl?: string;
}

export const teachersService = {
  list: (search?: string) =>
    api.get<{ data: Teacher[] }>('/teachers', { params: { search } }).then((r) => r.data.data),
  get: (id: string) => api.get<{ data: Teacher }>(`/teachers/${id}`).then((r) => r.data.data),
  create: (data: CreateTeacherInput) =>
    api.post<{ data: Teacher }>('/teachers', data).then((r) => r.data.data),
  update: (id: string, data: Partial<CreateTeacherInput> & { isActive?: boolean }) =>
    api.put<{ data: Teacher }>(`/teachers/${id}`, data).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/teachers/${id}`),
};
