import api from './api';
import type { Student, StudentDetail } from '../types';

export const studentService = {
  getAll: () => api.get<Student[]>('/students'),
  getById: (id: string) => api.get<StudentDetail>(`/students/${id}`),
  create: (data: Partial<Student>) => api.post<Student>('/students', data),
  update: (id: string, data: Partial<Student>) => api.put<Student>(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{ photoUrl: string }>(`/students/${id}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
