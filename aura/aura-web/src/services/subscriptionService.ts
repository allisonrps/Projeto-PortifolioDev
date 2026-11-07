import api from './api';
import type { SubscriptionSummary, SubscriptionCheckoutResponse } from '../types';

export const subscriptionService = {
  getSummary: () => api.get<SubscriptionSummary>('/subscriptions/summary'),

  createCheckout: (data: {
    planType: 'monthly' | 'annual';
    billingType: 'PIX' | 'UNDEFINED';
    cpfCnpj: string;
    phone?: string;
  }) => api.post<SubscriptionCheckoutResponse>('/subscriptions/checkout', data),

  verifyStatus: (id: string, simulateDemo = false) =>
    api.post<SubscriptionSummary>(`/subscriptions/${id}/verify?simulateDemo=${simulateDemo}`),
};
