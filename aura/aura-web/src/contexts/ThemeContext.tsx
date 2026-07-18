import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

function hexToRgb(hex: string): string {
  if (!hex || hex[0] !== '#' || hex.length < 7) return '124, 58, 237';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function adjustColor(hex: string, amount: number): string {
  if (!hex || hex[0] !== '#' || hex.length < 7) return '#7C3AED';
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function applyColorVars(color: string, prefix: string) {
  const root = document.documentElement;
  const rgb = hexToRgb(color);
  root.style.setProperty(`--${prefix}`, color);
  root.style.setProperty(`--${prefix}-hover`, adjustColor(color, -20));
  root.style.setProperty(`--${prefix}-light`, `rgba(${rgb}, 0.15)`);
  root.style.setProperty(`--${prefix}-rgb`, rgb);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { professor } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('aura_theme') as 'light' | 'dark') || 'dark'
  );
  const [primaryColor, setPrimary] = useState(
    () => localStorage.getItem('aura_primary') || '#7C3AED'
  );
  const [secondaryColor, setSecondary] = useState(
    () => localStorage.getItem('aura_secondary') || '#06B6D4'
  );

  useEffect(() => {
    if (professor) {
      setTheme((professor.theme as 'light' | 'dark') || 'dark');
      setPrimary(professor.primaryColor || '#7C3AED');
      setSecondary(professor.secondaryColor || '#06B6D4');
    }
  }, [professor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura_theme', theme);
  }, [theme]);

  useEffect(() => {
    applyColorVars(primaryColor, 'accent-primary');
    localStorage.setItem('aura_primary', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    applyColorVars(secondaryColor, 'accent-secondary');
    localStorage.setItem('aura_secondary', secondaryColor);
  }, [secondaryColor]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const setPrimaryColor = (c: string) => setPrimary(c);
  const setSecondaryColor = (c: string) => setSecondary(c);

  return (
    <ThemeContext.Provider value={{ theme, primaryColor, secondaryColor, toggleTheme, setPrimaryColor, setSecondaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
