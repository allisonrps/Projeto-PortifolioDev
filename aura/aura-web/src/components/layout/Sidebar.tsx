import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPeople, MdMenuBook, MdCalendarMonth, MdSettings, MdLogout, MdAttachMoney } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';
import './Sidebar.css';

interface SidebarProps { isOpen: boolean; onClose: () => void; }

const navItems = [
  { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { to: '/students', icon: <MdPeople />, label: 'Alunos' },
  { to: '/subjects', icon: <MdMenuBook />, label: 'Matérias' },
  { to: '/schedule', icon: <MdCalendarMonth />, label: 'Agenda' },
  { to: '/finance', icon: <MdAttachMoney />, label: 'Financeiro' },
  { to: '/settings', icon: <MdSettings />, label: 'Configurações' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { professor, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-text">Aura</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`} onClick={onClose}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar src={professor?.photoUrl} name={professor?.name || 'P'} size="sm" />
            <span className="sidebar-username">{professor?.name}</span>
          </div>
          <button className="nav-item nav-logout" onClick={handleLogout}>
            <span className="nav-icon"><MdLogout /></span>
            <span className="nav-label">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
