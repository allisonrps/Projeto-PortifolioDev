import api from './api';
import type { AuthResponse, Professor } from '../types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, confirmPassword: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password, confirmPassword }),
  getProfile: () => api.get<Professor>('/auth/profile'),
  updateProfile: (data: Partial<Professor>) => api.put<Professor>('/auth/profile', data),
  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{ photoUrl: string }>('/auth/photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
