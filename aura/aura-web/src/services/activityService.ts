import api from './api';
import type { TemplateActivity, StudentActivity } from '../types';

export const activityService = {
  // Templates endpoints
  createTemplate: (data: any) => api.post<TemplateActivity>('/activities/templates', data),
  getTemplates: () => api.get<TemplateActivity[]>('/activities/templates'),
  deleteTemplate: (id: string) => api.delete(`/activities/templates/${id}`),

  // Assignment & Review endpoints
  assignActivity: (data: { studentId: string; templateActivityId: string }) => 
    api.post<StudentActivity>('/activities/assign', data),
  getStudentActivities: (studentId: string) => 
    api.get<StudentActivity[]>(`/activities/student/${studentId}`),
  getActivityReview: (activityId: string) => 
    api.get<StudentActivity>(`/activities/review/${activityId}`),

  // Public/Student endpoints
  getPublicActivity: (activityId: string) => 
    api.get<StudentActivity>(`/activities/public/${activityId}`),
  submitPublicActivity: (activityId: string, answers: { questionId: string; selectedOption: string }[]) => 
    api.post<StudentActivity>(`/activities/public/${activityId}/submit`, { answers }),
};
