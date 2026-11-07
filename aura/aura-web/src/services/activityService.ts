import api from './api';
import type { TemplateActivity, StudentActivity } from '../types';

export const activityService = {
  // Templates endpoints
  createTemplate: (data: any) => api.post<TemplateActivity>('/activities/templates', data),
  updateTemplate: (id: string, data: any) => api.put<TemplateActivity>(`/activities/templates/${id}`, data),
  getTemplates: () => api.get<TemplateActivity[]>('/activities/templates'),
  deleteTemplate: (id: string) => api.delete(`/activities/templates/${id}`),

  // Assignment & Review endpoints
  assignActivity: (data: { studentId: string; templateActivityId: string }) => 
    api.post<StudentActivity>('/activities/assign', data),
  getStudentActivities: (studentId: string) => 
    api.get<StudentActivity[]>(`/activities/student/${studentId}`),
  getActivityReview: (activityId: string) => 
    api.get<StudentActivity>(`/activities/review/${activityId}`),
  correctActivity: (activityId: string, corrections: { answerId: string; score: number; notes?: string }[]) => 
    api.post<StudentActivity>(`/activities/correct/${activityId}`, { corrections }),
  deleteStudentActivity: (id: string) => api.delete(`/activities/student-activity/${id}`),

  // Public/Student endpoints
  getPublicActivity: (activityId: string) => 
    api.get<StudentActivity>(`/activities/public/${activityId}`),
  submitPublicActivity: (activityId: string, answers: { questionId: string; selectedOption?: string | null; writtenAnswer?: string | null }[]) => 
    api.post<StudentActivity>(`/activities/public/${activityId}/submit`, { answers }),
};
