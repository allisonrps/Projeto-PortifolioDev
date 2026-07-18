import { MdMenu, MdLightMode, MdDarkMode } from 'react-icons/md';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

interface HeaderProps { title: string; onMenuClick: () => void; }

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <button className="header-menu" onClick={onMenuClick}><MdMenu /></button>
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
        </button>
      </div>
    </header>
  );
}
