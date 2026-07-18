import { useState } from 'react';
import { MdPalette, MdCheck } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Settings.css';

const presetColors = [
  '#7C3AED', '#8B5CF6', '#6366F1', '#3B82F6', '#06B6D4',
  '#14B8A6', '#10B981', '#22C55E', '#F59E0B', '#F97316',
  '#EF4444', '#EC4899', '#D946EF', '#8B5CF6', '#6D28D9',
];

export default function SettingsPage() {
  const { theme, primaryColor, secondaryColor, toggleTheme, setPrimaryColor, setSecondaryColor } = useTheme();
  const { updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ theme, primaryColor, secondaryColor });
      toast.success('Configurações salvas!');
    } catch { toast.error('Erro ao salvar.'); }
    setSaving(false);
  };

  return (
    <div className="settings-page">
      <Card variant="elevated" className="animate-slideUp">
        <h3 className="settings-section-title"><MdPalette /> Aparência</h3>

        <div className="settings-group">
          <label className="settings-label">Tema</label>
          <div className="theme-switcher">
            <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
              <div className="theme-preview theme-light-preview" /> <span>Claro</span>
            </button>
            <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
              <div className="theme-preview theme-dark-preview" /> <span>Escuro</span>
            </button>
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label">Cor Primária</label>
          <div className="color-grid">
            {presetColors.map(c => (
              <button key={`p-${c}`} className={`color-swatch ${primaryColor === c ? 'active' : ''}`}
                style={{ background: c }} onClick={() => setPrimaryColor(c)}>
                {primaryColor === c && <MdCheck />}
              </button>
            ))}
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="color-picker" title="Cor customizada" />
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label">Cor Secundária</label>
          <div className="color-grid">
            {presetColors.map(c => (
              <button key={`s-${c}`} className={`color-swatch ${secondaryColor === c ? 'active' : ''}`}
                style={{ background: c }} onClick={() => setSecondaryColor(c)}>
                {secondaryColor === c && <MdCheck />}
              </button>
            ))}
            <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="color-picker" title="Cor customizada" />
          </div>
        </div>

        <div className="color-preview">
          <div className="preview-bar" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
          <span className="preview-label">Pré-visualização do gradiente</span>
        </div>

        <div style={{ marginTop: 'var(--space-xl)' }}>
          <Button isLoading={saving} onClick={handleSave}>Salvar Configurações</Button>
        </div>
      </Card>
    </div>
  );
}
