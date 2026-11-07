import { useNavigate, useLocation } from 'react-router-dom';
import { MdMenu, MdLightMode, MdDarkMode, MdArrowBack } from 'react-icons/md';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

interface HeaderProps { title: string; onMenuClick: () => void; }

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isSubPage = location.pathname.startsWith('/students/') && location.pathname !== '/students';

  return (
    <header className="header">
      {isSubPage ? (
        <button 
          className="header-back-btn" 
          onClick={() => navigate('/students')} 
          title="Voltar para Alunos" 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-primary)', 
            fontSize: '22px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '8px', 
            marginRight: '8px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <MdArrowBack />
        </button>
      ) : (
        <button className="header-menu" onClick={onMenuClick}><MdMenu /></button>
      )}
      <h1 className="header-title">{isSubPage ? 'Detalhes do Aluno' : title}</h1>
      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
        </button>
      </div>
    </header>
  );
}
