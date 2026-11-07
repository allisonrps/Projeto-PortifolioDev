import { useState } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { MdOutlineWorkspacePremium, MdLockOutline } from 'react-icons/md';
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
  '/statistics': 'Estatísticas',
  '/finance': 'Financeiro',
  '/activities': 'Atividades Online',
  '/admin': 'Painel Administrativo',
};

export default function AppLayout() {
  const { isAuthenticated, isLoading, professor } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) return <div className="loading-screen"><span className="loading-spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const title = pageTitles[location.pathname] || 'Aura';
  const isExpired = !professor?.isAdmin && (professor?.isWriteAllowed === false || professor?.subscriptionStatus === 'expired' || professor?.subscriptionStatus === 'blocked');
  const isTrial = !professor?.isAdmin && !isExpired && (professor?.subscriptionStatus === 'trial' || professor?.planType === 'trial' || professor?.planType === 'free');
  const daysRemaining = professor?.daysRemaining ?? 14;

  const goToSubscription = () => {
    navigate('/settings#subscription');
    setTimeout(() => {
      document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        {isExpired && (
          <div className="subscription-top-banner expired">
            <div className="subscription-top-banner-text">
              <MdLockOutline size={18} />
              <span>
                <strong>Período de acesso expirado (Modo Somente Leitura):</strong> Seus dados continuam salvos. Ative sua assinatura para voltar a cadastrar ou editar.
              </span>
            </div>
            <button type="button" className="subscription-top-banner-btn" onClick={goToSubscription}>
              Ativar Plano Pro
            </button>
          </div>
        )}
        {isTrial && (
          <div className="subscription-top-banner trial">
            <div className="subscription-top-banner-text">
              <MdOutlineWorkspacePremium size={18} />
              <span>
                <strong>Período de Teste Grátis:</strong> Restam <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong> com todos os recursos liberados.
              </span>
            </div>
            <button type="button" className="subscription-top-banner-btn" onClick={goToSubscription}>
              Conhecer Planos (R$ 29,90/mês)
            </button>
          </div>
        )}
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
