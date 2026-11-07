import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aura_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_professor');
      window.location.href = '/login';
    } else if (error.response?.status === 402) {
      const msg = error.response?.data?.message || 'Seu período de teste ou assinatura expirou. Ative seu plano em Configurações para criar ou editar registros.';
      toast.error(msg, { id: 'subscription-expired-toast', duration: 6000 });
    }
    return Promise.reject(error);
  }
);

export default api;
