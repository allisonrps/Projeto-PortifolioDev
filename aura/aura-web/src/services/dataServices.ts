import api from './api';
import type { Subject, Level, DashboardData, Lesson, MonthlyPayment, Exam, Exercise, ScheduleEntry, Holiday, ClassSheet } from '../types';

export const subjectService = {
  getAll: () => api.get<Subject[]>('/subjects'),
  getById: (id: string) => api.get<Subject>(`/subjects/${id}`),
  create: (data: { name: string }) => api.post<Subject>('/subjects', data),
  update: (id: string, data: { name: string }) => api.put<Subject>(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

export const levelService = {
  getBySubject: (subjectId: string) => api.get<Level[]>(`/levels/by-subject/${subjectId}`),
  create: (data: { subjectId: string; name: string }) => api.post<Level>('/levels', data),
  update: (id: string, data: { name: string }) => api.put<Level>(`/levels/${id}`, data),
  delete: (id: string) => api.delete(`/levels/${id}`),
};

export const dashboardService = {
  get: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<DashboardData>(`/dashboard${query}`);
  },
};

export const lessonService = {
  getAll: () => api.get<Lesson[]>('/lessons'),
  getByStudent: (studentId: string) => api.get<Lesson[]>(`/lessons/by-student/${studentId}`),
  getByWeek: (date: string) => api.get<Lesson[]>(`/lessons/week?date=${date}`),
  getById: (id: string) => api.get<Lesson>(`/lessons/${id}`),
  create: (data: Partial<Lesson>) => api.post<Lesson>('/lessons', data),
  update: (id: string, data: Partial<Lesson>) => api.put<Lesson>(`/lessons/${id}`, data),
  delete: (id: string) => api.delete(`/lessons/${id}`),
};

export const paymentService = {
  getByStudent: (studentId: string) => api.get<MonthlyPayment[]>(`/payments/by-student/${studentId}`),
  create: (data: Partial<MonthlyPayment>) => api.post<MonthlyPayment>('/payments', data),
  update: (id: string, data: Partial<MonthlyPayment>) => api.put<MonthlyPayment>(`/payments/${id}`, data),
  delete: (id: string) => api.delete(`/payments/${id}`),
};

export const examService = {
  getByStudent: (studentId: string) => api.get<Exam[]>(`/exams/by-student/${studentId}`),
  create: (data: Partial<Exam>) => api.post<Exam>('/exams', data),
  update: (id: string, data: Partial<Exam>) => api.put<Exam>(`/exams/${id}`, data),
  delete: (id: string) => api.delete(`/exams/${id}`),
};

export const exerciseService = {
  getByStudent: (studentId: string) => api.get<Exercise[]>(`/exercises/by-student/${studentId}`),
  create: (data: Partial<Exercise>) => api.post<Exercise>('/exercises', data),
  update: (id: string, data: Partial<Exercise>) => api.put<Exercise>(`/exercises/${id}`, data),
  delete: (id: string) => api.delete(`/exercises/${id}`),
};

export const scheduleService = {
  getAll: () => api.get<ScheduleEntry[]>('/schedule'),
  getByStudent: (studentId: string) => api.get<ScheduleEntry[]>(`/schedule/by-student/${studentId}`),
  create: (data: Partial<ScheduleEntry>) => api.post<ScheduleEntry>('/schedule', data),
  update: (id: string, data: Partial<ScheduleEntry>) => api.put<ScheduleEntry>(`/schedule/${id}`, data),
  delete: (id: string) => api.delete(`/schedule/${id}`),
  replicateWeek: (data: { startDate: string; endDate: string }) => api.post('/schedule/replicate-week', data),
  endSchedule: (id: string, endDate: string) => api.post(`/schedule/${id}/end`, { endDate }),
};

export const holidayService = {
  getAll: () => api.get<Holiday[]>('/holidays'),
  create: (data: Partial<Holiday>) => api.post<Holiday>('/holidays', data),
  update: (id: string, data: Partial<Holiday>) => api.put<Holiday>(`/holidays/${id}`, data),
  delete: (id: string) => api.delete(`/holidays/${id}`),
};

export const financeService = {
  getData: (month?: number, year?: number) => {
    const params = month && year ? `?month=${month}&year=${year}` : '';
    return api.get<any>(`/finance${params}`);
  },
  createManualEntry: (data: { amount: number; date: string; month?: number; year?: number; description: string }) =>
    api.post<any>('/finance/manual', data),
  deleteManualEntry: (id: string) =>
    api.delete(`/finance/manual/${id}`),
  _unused: () => {}, _dummy: () => {
  },
};

export const classSheetService = {
  getByLevel: (levelId: string) => api.get<ClassSheet[]>(`/class-sheets/by-level/${levelId}`),
  getById: (id: string) => api.get<ClassSheet>(`/class-sheets/${id}`),
  getPublic: (id: string) => api.get<ClassSheet>(`/class-sheets/public/${id}`),
  create: (data: { levelId: string; title: string; content: string }) => api.post<ClassSheet>('/class-sheets', data),
  update: (id: string, data: { title: string; content: string }) => api.put<ClassSheet>(`/class-sheets/${id}`, data),
  delete: (id: string) => api.delete(`/class-sheets/${id}`),
  getReleased: (studentId: string) => api.get<ClassSheet[]>(`/class-sheets/released-to-student/${studentId}`),
  releaseToStudent: (studentId: string, classSheetId: string) => api.post('/class-sheets/release-to-student', { studentId, classSheetId }),
  revokeFromStudent: (studentId: string, classSheetId: string) => api.post('/class-sheets/revoke-from-student', { studentId, classSheetId }),
};

export const publicStudentService = {
  getProfile: (studentId: string) => api.get<any>(`/public/student/${studentId}`),
  getExamsAndExercises: (studentId: string) => api.get<any[]>(`/public/student/${studentId}/exams-exercises`),
  getClassSheets: (studentId: string) => api.get<ClassSheet[]>(`/public/student/${studentId}/class-sheets`),
  getClassSheetDetail: (id: string) => api.get<ClassSheet>(`/public/student/class-sheets/${id}`),
  uploadPhoto: (studentId: string, imageBase64: string) => api.post<{ message: string; photoUrl: string }>(`/public/student/${studentId}/photo`, { imageBase64 }),
};
