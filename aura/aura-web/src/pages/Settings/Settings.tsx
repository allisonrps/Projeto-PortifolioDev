import { useState } from 'react';
import { MdPalette, MdCheck, MdLock, MdOutlineWorkspacePremium } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import './Settings.css';

const presetColors = [
  '#7C3AED', '#8B5CF6', '#6366F1', '#3B82F6', '#06B6D4',
  '#14B8A6', '#10B981', '#22C55E', '#F59E0B', '#F97316',
  '#EF4444', '#EC4899', '#D946EF', '#8B5CF6', '#6D28D9',
];

export default function SettingsPage() {
  const { theme, primaryColor, secondaryColor, toggleTheme, setPrimaryColor, setSecondaryColor } = useTheme();
  const { professor, updateProfile } = useAuth();
  const [savingTheme, setSavingTheme] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    try {
      await updateProfile({ theme, primaryColor, secondaryColor });
      toast.success('Configurações de aparência salvas!');
    } catch {
      toast.error('Erro ao salvar tema.');
    }
    setSavingTheme(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Preencha todos os campos para alterar a senha.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Senha atual incorreta.');
    }
    setSavingPassword(false);
  };

  const getPlanName = (plan?: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium': return 'Premium';
      case 'standard': return 'Padrão';
      case 'basic': return 'Básico';
      default: return 'Gratuito';
    }
  };

  return (
    <div className="settings-page">
      {/* 1. Appearance / Theme Card (Full Width, Inline on Desktop) */}
      <Card variant="elevated" className="settings-card animate-slideUp">
        <h3 className="settings-section-title"><MdPalette /> Aparência</h3>
        
        <div className="theme-config-row">
          {/* Theme Option */}
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

          {/* Primary Color swatch */}
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

          {/* Secondary Color swatch */}
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
        </div>

        <div className="color-preview">
          <div className="preview-bar" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
          <span className="preview-label">Pré-visualização do gradiente do seu tema</span>
        </div>

        <div style={{ marginTop: 'var(--space-lg)' }}>
          <Button isLoading={savingTheme} onClick={handleSaveTheme}>Salvar Aparência</Button>
        </div>
      </Card>

      <div className="settings-grid">
        {/* 2. Redefinir Senha Card */}
        <Card variant="elevated" className="settings-card animate-slideUp blocker-card">
          <h3 className="settings-section-title"><MdLock /> Segurança</h3>
          <form onSubmit={handleChangePassword} className="settings-password-form">
            <Input
              label="Senha Atual"
              type="password"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Nova Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              required
            />
            <div style={{ marginTop: 'var(--space-md)' }}>
              <Button type="submit" isLoading={savingPassword} variant="primary" fullWidth>
                Alterar Senha
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Planos Card */}
        <Card variant="elevated" className="settings-card animate-slideUp blocker-card">
          <h3 className="settings-section-title"><MdOutlineWorkspacePremium /> Planos e Assinatura</h3>
          
          <div className="current-plan-wrap">
            <span className="current-plan-label">Seu Plano Atual:</span>
            <span className="current-plan-badge" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
              {getPlanName(professor?.planType)}
            </span>
          </div>

          <div className="plans-list">
            <div className={`plan-item ${professor?.planType === 'free' || !professor?.planType ? 'active-plan' : ''}`}>
              <div className="plan-header">
                <h4>Gratuito</h4>
                <span className="plan-price">R$ 0</span>
              </div>
              <p className="plan-desc">Gestão básica para começar.</p>
              <ul className="plan-features">
                <li>✓ Até 2 alunos particulares</li>
                <li>✓ Agenda semanal compacta</li>
                <li>✓ Controle de mensalidades</li>
              </ul>
            </div>

            <div className={`plan-item ${professor?.planType === 'basic' ? 'active-plan' : ''}`}>
              <div className="plan-header">
                <h4>Básico</h4>
                <span className="plan-price">R$ 29/mês</span>
              </div>
              <p className="plan-desc">Mais alunos para o seu dia a dia.</p>
              <ul className="plan-features">
                <li>✓ Até 10 alunos particulares</li>
                <li>✓ Agenda com histórico total</li>
                <li>✓ Cadastro de provas e exercícios</li>
              </ul>
            </div>

            <div className={`plan-item ${professor?.planType === 'standard' ? 'active-plan' : ''}`}>
              <div className="plan-header">
                <h4>Padrão</h4>
                <span className="plan-price">R$ 59/mês</span>
              </div>
              <p className="plan-desc">Controle completo do seu negócio.</p>
              <ul className="plan-features">
                <li>✓ Até 25 alunos particulares</li>
                <li>✓ Relatório financeiro de lucros</li>
                <li>✓ Suporte via Whatsapp</li>
              </ul>
            </div>

            <div className={`plan-item ${professor?.planType === 'premium' ? 'active-plan' : ''}`}>
              <div className="plan-header">
                <h4>Premium</h4>
                <span className="plan-price">R$ 99/mês</span>
              </div>
              <p className="plan-desc">Alunos ilimitados para alta demanda.</p>
              <ul className="plan-features">
                <li>✓ Alunos ILIMITADOS</li>
                <li>✓ Todos os recursos liberados</li>
                <li>✓ Exportação de dados completos</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
