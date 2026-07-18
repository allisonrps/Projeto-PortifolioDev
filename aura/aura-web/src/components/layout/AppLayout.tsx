import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students': 'Alunos',
  '/subjects': 'Matérias',
  '/schedule': 'Agenda',
  '/settings': 'Configurações',
};

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (isLoading) return <div className="loading-screen"><span className="loading-spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const title = pageTitles[location.pathname] || 'Aura';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
