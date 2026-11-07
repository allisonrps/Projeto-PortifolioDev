import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdPeople, MdMenuBook, MdCalendarMonth, MdSettings,
  MdLogout, MdAttachMoney, MdClose, MdAssignment, MdPieChart,
  MdAdminPanelSettings
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';
import './Sidebar.css';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

const navItems = [
  { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { to: '/students', icon: <MdPeople />, label: 'Alunos' },
  { to: '/subjects', icon: <MdMenuBook />, label: 'Matérias' },
  { to: '/schedule', icon: <MdCalendarMonth />, label: 'Agenda' },
  { to: '/activities', icon: <MdAssignment />, label: 'Atividades Online' },
  { to: '/finance', icon: <MdAttachMoney />, label: 'Financeiro' },
  { to: '/statistics', icon: <MdPieChart />, label: 'Estatísticas' },
  { to: '/settings', icon: <MdSettings />, label: 'Configurações' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { professor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const professorName = professor?.name ? professor.name.replace(/^(professor|prof\.)\s+/i, '') : '';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <Logo size="sm" href="https://aura-teacher.vercel.app" />
          <button className="sidebar-close-btn" onClick={onClose} title="Fechar menu">
            <MdClose />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`} onClick={onClose}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
          {professor?.isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
              onClick={onClose}
              style={{ marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}
            >
              <span className="nav-icon"><MdAdminPanelSettings /></span>
              <span className="nav-label">Painel Admin</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar src={professor?.photoUrl} name={professorName || 'P'} size="sm" />
            <span className="sidebar-username">{professorName}</span>
          </div>
          <button className="nav-item nav-logout" onClick={handleLogout}>
            <span className="nav-icon"><MdLogout /></span>
            <span className="nav-label">Sair</span>
          </button>
          <div style={{ textAlign: 'center', padding: '10px 0 0 0', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: '8px', opacity: 0.7 }}>
            Desenvolvido por <strong style={{ color: 'var(--accent-primary)' }}>Allison Rodrigues</strong>
          </div>
        </div>
      </aside>
    </>
  );
}
