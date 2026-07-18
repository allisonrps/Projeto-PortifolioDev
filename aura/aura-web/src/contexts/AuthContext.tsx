import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { Professor } from '../types';

interface AuthContextType {
  professor: Professor | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Professor>) => Promise<void>;
  setProfessor: (p: Professor) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('aura_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authService.getProfile()
        .then(res => setProfessor(res.data))
        .catch(() => { localStorage.removeItem('aura_token'); setToken(null); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    localStorage.setItem('aura_token', res.data.token);
    setToken(res.data.token);
    setProfessor(res.data.professor);
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const res = await authService.register(name, email, password, confirmPassword);
    localStorage.setItem('aura_token', res.data.token);
    setToken(res.data.token);
    setProfessor(res.data.professor);
  };

  const logout = () => {
    localStorage.removeItem('aura_token');
    setToken(null);
    setProfessor(null);
  };

  const updateProfile = async (data: Partial<Professor>) => {
    const res = await authService.updateProfile(data);
    setProfessor(res.data);
  };

  return (
    <AuthContext.Provider value={{
      professor, token, isAuthenticated: !!token && !!professor,
      isLoading, login, register, logout, updateProfile, setProfessor
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
