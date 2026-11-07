import api from './api';
import type { AdminDashboardData } from '../types';

export const adminService = {
  getDashboard: () => api.get<AdminDashboardData>('/admin/dashboard'),

  updateProfessorLicense: (
    targetProfessorId: string,
    data: {
      action:
        | 'activate_monthly'
        | 'activate_annual'
        | 'activate_lifetime'
        | 'extend_trial'
        | 'block'
        | 'toggle_admin';
      customDays?: number;
      recordRevenue?: boolean;
    }
  ) => api.post<AdminDashboardData>(`/admin/professors/${targetProfessorId}/license`, data),

  preActivateEmail: (data: {
    email: string;
    name?: string;
    planType: 'monthly' | 'annual' | 'lifetime';
    initialPassword?: string;
  }) => api.post<AdminDashboardData>('/admin/pre-activate-email', data),

  updateGatewayConfig: (apiKey: string) =>
    api.post<AdminDashboardData>('/admin/gateway-config', { apiKey }),
};
