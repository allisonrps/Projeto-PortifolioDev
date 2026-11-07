import { useState, useEffect } from 'react';
import {
  MdPalette, MdCheck, MdLock, MdOutlineWorkspacePremium,
  MdContentCopy, MdOpenInNew, MdRefresh, MdQrCode2, MdVerified,
  MdExpandMore, MdDescription, MdCloudUpload, MdSupportAgent, MdEmail
} from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LegalModal, { type LegalDocType } from '../../components/legal/LegalModal';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { subscriptionService } from '../../services/subscriptionService';
import type { SubscriptionSummary, SubscriptionCheckoutResponse } from '../../types';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './Settings.css';

const presetColors = [
  '#7C3AED', '#8B5CF6', '#6366F1', '#3B82F6', '#06B6D4',
  '#14B8A6', '#10B981', '#22C55E', '#F59E0B', '#F97316',
  '#EF4444', '#EC4899', '#D946EF', '#8B5CF6', '#6D28D9',
];

type SettingsSectionKey = 'appearance' | 'export' | 'security' | 'subscription' | 'backup' | 'support';

export default function SettingsPage() {
  const { theme, primaryColor, secondaryColor, visualTheme, toggleTheme, setPrimaryColor, setSecondaryColor, setVisualTheme } = useTheme();
  const { professor, updateProfile, setProfessor } = useAuth();
  const [savingTheme, setSavingTheme] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);

  // All expandable cards collapsed by default
  const [expandedSections, setExpandedSections] = useState<Record<SettingsSectionKey, boolean>>({
    appearance: false,
    export: false,
    security: false,
    subscription: false,
    backup: false,
    support: false,
  });

  const toggleSection = (key: SettingsSectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Export format preference state
  const [exportFormat, setExportFormat] = useState<'pdf' | 'doc'>(
    (localStorage.getItem('aura_export_format') as 'pdf' | 'doc') || 'pdf'
  );

  // Subscription & Checkout state
  const [subSummary, setSubSummary] = useState<SubscriptionSummary | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [billingType, setBillingType] = useState<'PIX' | 'UNDEFINED'>('PIX');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [activeCheckout, setActiveCheckout] = useState<SubscriptionCheckoutResponse | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadSubscriptionSummary = async () => {
    try {
      const res = await subscriptionService.getSummary();
      setSubSummary(res.data);
      if (res.data.cpfCnpj && !cpfCnpj) {
        setCpfCnpj(res.data.cpfCnpj);
      }
    } catch {
      // Fallback silencioso
    }
  };

  useEffect(() => {
    loadSubscriptionSummary();
    if (window.location.hash === '#subscription') {
      setExpandedSections(prev => ({ ...prev, subscription: true }));
      setTimeout(() => {
        document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, []);

  // Automatic polling while checkout modal is open with an active charge
  useEffect(() => {
    if (!checkoutModalOpen || !activeCheckout) return;
    const timer = setInterval(async () => {
      try {
        const res = await subscriptionService.verifyStatus(activeCheckout.subscriptionId, false);
        setSubSummary(res.data);
        if (res.data.subscriptionStatus === 'active') {
          const profRes = await authService.getProfile();
          setProfessor(profRes.data);
          toast.success('Pagamento confirmado! Sua assinatura Aura Pro está ativa.');
          setCheckoutModalOpen(false);
          setActiveCheckout(null);
        }
      } catch {
        // ignore polling error
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [checkoutModalOpen, activeCheckout]);

  const handleOpenSubscribeModal = (plan: 'monthly' | 'annual') => {
    setSelectedPlan(plan);
    setActiveCheckout(null);
    if (subSummary?.cpfCnpj) setCpfCnpj(subSummary.cpfCnpj);
    else if (professor?.cpfCnpj) setCpfCnpj(professor.cpfCnpj);
    setCheckoutModalOpen(true);
  };

  const handleGenerateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cpfCnpj.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }

    setCreatingCheckout(true);
    try {
      const res = await subscriptionService.createCheckout({
        planType: selectedPlan,
        billingType,
        cpfCnpj: digits,
        phone: professor?.phone
      });
      setActiveCheckout(res.data);
      loadSubscriptionSummary();
      toast.success('Cobrança gerada com sucesso!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Não foi possível gerar a cobrança.';
      toast.error(msg);
    } finally {
      setCreatingCheckout(false);
    }
  };

  const handleVerifyPaymentNow = async (subscriptionId: string, simulateDemo = false) => {
    setVerifyingPayment(true);
    try {
      const res = await subscriptionService.verifyStatus(subscriptionId, simulateDemo);
      setSubSummary(res.data);
      const profRes = await authService.getProfile();
      setProfessor(profRes.data);

      if (res.data.subscriptionStatus === 'active') {
        toast.success('Pagamento confirmado! Assinatura Aura Pro ativada com sucesso!');
        setCheckoutModalOpen(false);
        setActiveCheckout(null);
      } else {
        toast('Pagamento ainda aguarda compensação pela instituição financeira. Tente novamente em instantes.', { icon: '⏳' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao verificar status do pagamento.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleCopyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código PIX Copia e Cola copiado!');
  };

  const handleSaveExportPreferences = () => {
    localStorage.setItem('aura_export_format', exportFormat);
    toast.success('Preferência de exportação salva com sucesso!');
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    try {
      await updateProfile({ theme, primaryColor, secondaryColor, visualTheme });
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

  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const response = await api.get('/backup/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `aura_backup_${new Date().toISOString().split('T')[0]}.json`;
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = matches[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Backup gerado e baixado com sucesso!');
    } catch {
      toast.error('Erro ao gerar arquivo de backup.');
    } finally {
      setExportingBackup(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      'Tem certeza que deseja restaurar este backup? TODOS os seus dados atuais (alunos, aulas, mensalidades, modelos, etc.) serão APAGADOS e substituídos. Esta ação não pode ser desfeita!'
    );
    if (!confirmRestore) {
      e.target.value = '';
      return;
    }

    setImportingBackup(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/backup/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Backup restaurado com sucesso! Recarregando dados...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      const apiError = err.response?.data?.error || err.response?.data?.message || 'Erro ao importar backup.';
      toast.error(apiError);
    } finally {
      setImportingBackup(false);
      e.target.value = '';
    }
  };

  const effectiveStatus = subSummary?.subscriptionStatus || professor?.subscriptionStatus || 'trial';
  const effectivePlan = subSummary?.planType || professor?.planType || 'trial';
  const effectiveDays = subSummary?.daysRemaining ?? professor?.daysRemaining ?? 14;
  const effectiveExpiry = subSummary?.subscriptionExpiresAt || subSummary?.trialEndsAt || professor?.subscriptionExpiresAt || professor?.trialEndsAt;

  const getPlanLabel = () => {
    if (effectiveStatus === 'expired') return 'Período Expirado (Somente Leitura)';
    if (effectiveStatus === 'active') {
      return effectivePlan === 'annual' ? 'Aura Pro Anual (Ativo)' : 'Aura Pro Mensal (Ativo)';
    }
    return `Teste Grátis (${effectiveDays}d restantes)`;
  };

  const getVisualThemeLabel = () => {
    if (visualTheme === 'cyber-grid') return 'Vibrant Square';
    return 'Clássico';
  };

  return (
    <div className="settings-page">
      {/* 1. Aparência */}
      <Card variant="elevated" className={`settings-accordion-card animate-slideUp ${expandedSections.appearance ? 'expanded' : ''}`}>
        <div
          role="button"
          tabIndex={0}
          className="settings-accordion-header"
          onClick={() => toggleSection('appearance')}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleSection('appearance')}
          aria-expanded={expandedSections.appearance}
        >
          <div className="settings-accordion-title-wrap">
            <span className="settings-accordion-icon"><MdPalette /></span>
            <div className="settings-accordion-headings">
              <span className="settings-accordion-title">Aparência</span>
              <span className="settings-accordion-subtitle">
                Tema {theme === 'light' ? 'Claro' : 'Escuro'} • Estilo {getVisualThemeLabel()} • Cores personalizadas
              </span>
            </div>
          </div>
          <div className="settings-accordion-right">
            <div className="settings-color-dots-preview">
              <span style={{ background: primaryColor }} />
              <span style={{ background: secondaryColor }} />
            </div>
            <MdExpandMore className={`settings-accordion-chevron ${expandedSections.appearance ? 'open' : ''}`} />
          </div>
        </div>

        {expandedSections.appearance && (
          <div className="settings-accordion-body animate-fadeIn">
            <div className="theme-config-row">
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
            </div>

            <div className="settings-group" style={{ marginTop: 'var(--space-md)', width: '100%' }}>
              <label className="settings-label">Estética Visual (Estilo do Painel)</label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Personalize o formato geométrico das caixas, contornos e sombras dos cards e botões.
              </p>
              <div className="theme-switcher" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', width: '100%' }}>
                <button type="button" className={`theme-option ${visualTheme === 'classic' ? 'active' : ''}`} onClick={() => setVisualTheme('classic')}>
                  <span style={{ fontWeight: 600, display: 'block' }}>Clássico</span>
                  <span style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '2px' }}>Bordas arredondadas e luz suave</span>
                </button>
                <button type="button" className={`theme-option ${visualTheme === 'cyber-grid' ? 'active' : ''}`} onClick={() => setVisualTheme('cyber-grid')}>
                  <span style={{ fontWeight: 600, display: 'block' }}>Vibrant Square</span>
                  <span style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginTop: '2px' }}>Contornos grossos e cores vivas</span>
                </button>
              </div>
            </div>

            <div className="color-preview">
              <div className="preview-bar" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
              <span className="preview-label">Pré-visualização do gradiente do seu tema</span>
            </div>

            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Button isLoading={savingTheme} onClick={handleSaveTheme}>Salvar Aparência</Button>
            </div>
          </div>
        )}
      </Card>

      {/* 2. Planos e Assinatura */}
      <div id="subscription-section">
        <Card variant="elevated" className={`settings-accordion-card animate-slideUp ${expandedSections.subscription ? 'expanded' : ''}`}>
          <div
            role="button"
            tabIndex={0}
            className="settings-accordion-header"
            onClick={() => toggleSection('subscription')}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleSection('subscription')}
            aria-expanded={expandedSections.subscription}
          >
            <div className="settings-accordion-title-wrap">
              <span className="settings-accordion-icon"><MdOutlineWorkspacePremium /></span>
              <div className="settings-accordion-headings">
                <span className="settings-accordion-title">Planos e Assinatura</span>
                <span className="settings-accordion-subtitle">
                  {effectiveStatus === 'expired'
                    ? 'Período expirado — ative um plano para liberar cadastros e edições'
                    : `Restam ${effectiveDays} ${effectiveDays === 1 ? 'dia' : 'dias'} de acesso completo${effectiveExpiry ? ` (válido até ${new Date(effectiveExpiry).toLocaleDateString('pt-BR')})` : ''}`}
                </span>
              </div>
            </div>
            <div className="settings-accordion-right">
              <span
                className="current-plan-badge"
                style={{
                  background: effectiveStatus === 'expired'
                    ? '#EF4444'
                    : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                }}
              >
                {getPlanLabel()}
              </span>
              <MdExpandMore className={`settings-accordion-chevron ${expandedSections.subscription ? 'open' : ''}`} />
            </div>
          </div>

          {expandedSections.subscription && (
            <div className="settings-accordion-body animate-fadeIn">
              <div className="plans-list">
                {/* Plano Pro Mensal */}
                <div className={`plan-item ${effectiveStatus === 'active' && effectivePlan === 'monthly' ? 'active-plan' : ''}`}>
                  <div className="plan-header">
                    <h4>Aura Pro Mensal</h4>
                    <span className="plan-price">R$ 29,90<small style={{ fontSize: '11px', fontWeight: 500 }}>/mês</small></span>
                  </div>
                  <p className="plan-desc">Acesso completo e ilimitado com renovação flexível mês a mês.</p>
                  <ul className="plan-features">
                    <li>✓ Alunos e turmas ILIMITADOS</li>
                    <li>✓ Agenda completa e replicação</li>
                    <li>✓ Controle financeiro e mensalidades</li>
                    <li>✓ Provas, atividades online e Portal do Aluno</li>
                    <li>✓ Pagamento via PIX, Cartão ou Boleto</li>
                  </ul>
                  <div style={{ marginTop: '16px' }}>
                    <Button
                      variant={effectiveStatus === 'active' && effectivePlan === 'monthly' ? 'outline' : 'primary'}
                      fullWidth
                      onClick={() => handleOpenSubscribeModal('monthly')}
                    >
                      {effectiveStatus === 'active' && effectivePlan === 'monthly' ? 'Renovar +30 dias' : 'Assinar Plano Mensal'}
                    </Button>
                  </div>
                </div>

                {/* Plano Pro Anual */}
                <div className={`plan-item plan-featured ${effectiveStatus === 'active' && effectivePlan === 'annual' ? 'active-plan' : ''}`}>
                  <div className="plan-save-tag">Economize 2 meses (R$ 24,90/mês)</div>
                  <div className="plan-header">
                    <h4>Aura Pro Anual</h4>
                    <span className="plan-price">R$ 299,00<small style={{ fontSize: '11px', fontWeight: 500 }}>/ano</small></span>
                  </div>
                  <p className="plan-desc">12 meses de acesso total com desconto especial para professores.</p>
                  <ul className="plan-features">
                    <li>✓ Todos os recursos do Aura Pro</li>
                    <li>✓ Alunos, fichas e provas ILIMITADOS</li>
                    <li>✓ Exportação PDF, Word e Backups</li>
                    <li>✓ 2 meses grátis em relação ao mensal</li>
                    <li>✓ PIX imediato ou Cartão via Asaas</li>
                  </ul>
                  <div style={{ marginTop: '16px' }}>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleOpenSubscribeModal('annual')}
                    >
                      {effectiveStatus === 'active' && effectivePlan === 'annual' ? 'Renovar +1 Ano' : 'Assinar Plano Anual'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 3. Preferências de Exportação */}
      <Card variant="elevated" className={`settings-accordion-card animate-slideUp ${expandedSections.export ? 'expanded' : ''}`}>
        <div
          role="button"
          tabIndex={0}
          className="settings-accordion-header"
          onClick={() => toggleSection('export')}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleSection('export')}
          aria-expanded={expandedSections.export}
        >
          <div className="settings-accordion-title-wrap">
            <span className="settings-accordion-icon"><MdDescription /></span>
            <div className="settings-accordion-headings">
              <span className="settings-accordion-title">Exportação</span>
              <span className="settings-accordion-subtitle">
                Formato padrão atual: {exportFormat === 'pdf' ? 'PDF (Documento Portátil)' : 'Word (.doc)'}
              </span>
            </div>
          </div>
          <div className="settings-accordion-right">
            <MdExpandMore className={`settings-accordion-chevron ${expandedSections.export ? 'open' : ''}`} />
          </div>
        </div>

        {expandedSections.export && (
          <div className="settings-accordion-body animate-fadeIn">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
              Defina o formato de arquivo padrão utilizado ao exportar as provas e exercícios.
            </p>
            <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="settings-label">Formato de Exportação Padrão</label>
              <div className="theme-switcher" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '4px', maxWidth: '520px' }}>
                <label
                  className={`theme-option ${exportFormat === 'pdf' ? 'active' : ''}`}
                  style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: '10px', padding: '12px 16px', cursor: 'pointer', fontSize: '14px' }}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span>PDF (Documento Portátil)</span>
                </label>
                <label
                  className={`theme-option ${exportFormat === 'doc' ? 'active' : ''}`}
                  style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: '10px', padding: '12px 16px', cursor: 'pointer', fontSize: '14px' }}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="doc"
                    checked={exportFormat === 'doc'}
                    onChange={() => setExportFormat('doc')}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                  />
                  <span>Word (.doc)</span>
                </label>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Button onClick={handleSaveExportPreferences}>Salvar Preferência</Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Segurança / Redefinir Senha */}
      <Card variant="elevated" className={`settings-accordion-card animate-slideUp ${expandedSections.security ? 'expanded' : ''}`}>
        <div
          role="button"
          tabIndex={0}
          className="settings-accordion-header"
          onClick={() => toggleSection('security')}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleSection('security')}
          aria-expanded={expandedSections.security}
        >
          <div className="settings-accordion-title-wrap">
            <span className="settings-accordion-icon"><MdLock /></span>
            <div className="settings-accordion-headings">
              <span className="settings-accordion-title">Segurança</span>
              <span className="settings-accordion-subtitle">
                Alteração de senha de acesso da sua conta ({professor?.email})
              </span>
            </div>
          </div>
          <div className="settings-accordion-right">
            <MdExpandMore className={`settings-accordion-chevron ${expandedSections.security ? 'open' : ''}`} />
          </div>
        </div>

        {expandedSections.security && (
          <div className="settings-accordion-body animate-fadeIn">
            <form onSubmit={handleChangePassword} className="settings-password-form" style={{ maxWidth: '480px' }}>
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
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <Button type="submit" isLoading={savingPassword} variant="primary">
                  Alterar Senha
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* 5. Backup e Restauração */}
      <Card variant="elevated" className={`settings-accordion-card animate-slideUp ${expandedSections.backup ? 'expanded' : ''}`}>
        <div
          role="button"
          tabIndex={0}
          className="settings-accordion-header"
          onClick={() => toggleSection('backup')}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleSection('backup')}
          aria-expanded={expandedSections.backup}
        >
          <div className="settings-accordion-title-wrap">
            <span className="settings-accordion-icon"><MdCloudUpload /></span>
            <div className="settings-accordion-headings">
              <span className="settings-accordion-title">Backup e Restauração de Dados</span>
              <span className="settings-accordion-subtitle">
                Exporte uma cópia de segurança completa (.json) ou restaure seus dados
              </span>
            </div>
          </div>
          <div className="settings-accordion-right">
            <MdExpandMore className={`settings-accordion-chevron ${expandedSections.backup ? 'open' : ''}`} />
          </div>
        </div>

        {expandedSections.backup && (
          <div className="settings-accordion-body animate-fadeIn">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: '1.6' }}>
              Baixe uma cópia completa de todos os seus dados (perfil, alunos, matérias, aulas, mensalidades, provas, exercícios e modelos) para salvaguarda, ou importe um arquivo de backup para restaurar suas informações no sistema.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <Button onClick={handleExportBackup} isLoading={exportingBackup} variant="outline">
                Gerar e Baixar Backup
              </Button>

              <div style={{ position: 'relative', display: 'inline-block' }}>
                <input
                  type="file"
                  accept=".json"
                  id="backup-file-input"
                  style={{ display: 'none' }}
                  onChange={handleImportBackup}
                  disabled={importingBackup}
                />
                <Button
                  onClick={() => document.getElementById('backup-file-input')?.click()}
                  isLoading={importingBackup}
                  variant="primary"
                >
                  Importar e Restaurar Backup
                </Button>
              </div>
            </div>

            <div className="settings-warning-banner" style={{ marginTop: '14px', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '4px solid #EF4444', padding: '12px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              ⚠️ <strong>ATENÇÃO:</strong> Ao importar um arquivo de backup, todos os seus dados atuais cadastrados no Aura serão permanentemente apagados e substituídos pelos dados do arquivo de backup. Essa ação é irreversível.
            </div>
          </div>
        )}
      </Card>

      {/* 6. Suporte, Contato e Termos Legais */}
      <Card variant="elevated" className={`settings-accordion-card animate-slideUp ${expandedSections.support ? 'expanded' : ''}`}>
        <div
          role="button"
          tabIndex={0}
          className="settings-accordion-header"
          onClick={() => toggleSection('support')}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleSection('support')}
          aria-expanded={expandedSections.support}
        >
          <div className="settings-accordion-title-wrap">
            <span className="settings-accordion-icon"><MdSupportAgent /></span>
            <div className="settings-accordion-headings">
              <span className="settings-accordion-title">Suporte, Contato e Termos Legais</span>
              <span className="settings-accordion-subtitle">
                Atendimento ao assinante (allisonrps.dev@gmail.com) • Termos de Uso e Política de Privacidade (LGPD)
              </span>
            </div>
          </div>
          <div className="settings-accordion-right">
            <MdExpandMore className={`settings-accordion-chevron ${expandedSections.support ? 'open' : ''}`} />
          </div>
        </div>

        {expandedSections.support && (
          <div className="settings-accordion-body animate-fadeIn">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
              Precisa de ajuda com sua assinatura, dúvidas sobre recursos da plataforma ou sugestões de melhorias? Nossa equipe da <strong>Vector Software</strong> atende diretamente pelo canal oficial abaixo:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <a
                href={`mailto:allisonrps.dev@gmail.com?subject=${encodeURIComponent(`Suporte Aura — ${professor?.name || 'Professor'} (${professor?.email || ''})`)}`}
                style={{ textDecoration: 'none' }}
              >
                <Button type="button" variant="primary">
                  <MdEmail size={18} /> Enviar E-mail (allisonrps.dev@gmail.com)
                </Button>
              </a>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText('allisonrps.dev@gmail.com');
                  toast.success('E-mail de suporte copiado: allisonrps.dev@gmail.com');
                }}
              >
                <MdContentCopy size={16} /> Copiar E-mail de Suporte
              </Button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Documentos Legais da Plataforma:
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => setLegalDoc('terms')}>
                <MdDescription size={16} /> Termos de Uso
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setLegalDoc('privacy')}>
                <MdLock size={16} /> Política de Privacidade (LGPD)
              </Button>
            </div>
          </div>
        )}
      </Card>

      <LegalModal
        docType={legalDoc}
        onClose={() => setLegalDoc(null)}
        onSwitchDoc={type => setLegalDoc(type)}
      />

      {/* Modal de Checkout Asaas (PIX / Cartão / Boleto) */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={activeCheckout ? 'Concluir Pagamento da Assinatura' : 'Assinar Aura Pro'}
      >
        {!activeCheckout ? (
          <form onSubmit={handleGenerateCheckout} className="checkout-modal-form">
            <div className="checkout-plan-selector">
              <button
                type="button"
                className={`checkout-plan-tab ${selectedPlan === 'monthly' ? 'active' : ''}`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <strong>Plano Mensal</strong>
                <span>R$ 29,90 / mês</span>
              </button>
              <button
                type="button"
                className={`checkout-plan-tab ${selectedPlan === 'annual' ? 'active' : ''}`}
                onClick={() => setSelectedPlan('annual')}
              >
                <strong>Plano Anual (-17%)</strong>
                <span>R$ 299,00 / ano</span>
              </button>
            </div>

            <div className="settings-group">
              <label className="settings-label">Forma de Pagamento Preferida</label>
              <div className="checkout-billing-options">
                <label className={`checkout-billing-opt ${billingType === 'PIX' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="billingType"
                    checked={billingType === 'PIX'}
                    onChange={() => setBillingType('PIX')}
                  />
                  <div>
                    <strong>PIX (Liberação Imediata)</strong>
                    <span>Gera QR Code e código PIX Copia e Cola na tela</span>
                  </div>
                </label>
                <label className={`checkout-billing-opt ${billingType === 'UNDEFINED' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="billingType"
                    checked={billingType === 'UNDEFINED'}
                    onChange={() => setBillingType('UNDEFINED')}
                  />
                  <div>
                    <strong>Cartão de Crédito, PIX ou Boleto</strong>
                    <span>Abre a fatura segura do Asaas + QR Code PIX</span>
                  </div>
                </label>
              </div>
            </div>

            <Input
              label="CPF ou CNPJ do Titular *"
              placeholder="Digite apenas números ou 000.000.000-00"
              value={cpfCnpj}
              onChange={e => setCpfCnpj(e.target.value)}
              required
            />

            <div className="checkout-summary-box">
              <div>
                <span>Plano selecionado:</span>
                <strong>{selectedPlan === 'annual' ? 'Aura Pro Anual (12 meses)' : 'Aura Pro Mensal (30 dias)'}</strong>
              </div>
              <div>
                <span>Total a pagar:</span>
                <strong style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>
                  {selectedPlan === 'annual' ? 'R$ 299,00' : 'R$ 29,90'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="outline" onClick={() => setCheckoutModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={creatingCheckout}>
                Gerar Cobrança Segura
              </Button>
            </div>
          </form>
        ) : (
          <div className="checkout-payment-view">
            <div className="checkout-summary-box">
              <div>
                <span>Assinatura:</span>
                <strong>{activeCheckout.planType === 'annual' ? 'Aura Pro Anual (12 meses)' : 'Aura Pro Mensal (30 dias)'}</strong>
              </div>
              <div>
                <span>Valor:</span>
                <strong style={{ fontSize: '18px', color: 'var(--accent-primary)' }}>
                  R$ {activeCheckout.price.toFixed(2).replace('.', ',')}
                </strong>
              </div>
            </div>

            {activeCheckout.gatewayMessage && (
              <div className="checkout-sandbox-notice">
                {activeCheckout.gatewayMessage}
              </div>
            )}

            {/* QR Code PIX */}
            <div className="checkout-pix-container">
              {activeCheckout.pixQrCodeImage ? (
                <img
                  src={`data:image/png;base64,${activeCheckout.pixQrCodeImage}`}
                  alt="QR Code PIX Asaas"
                  className="checkout-pix-qr"
                />
              ) : (
                <div className="checkout-pix-placeholder">
                  <MdQrCode2 size={84} />
                  <span>QR Code PIX pronto para pagamento</span>
                </div>
              )}

              {activeCheckout.pixCopyPaste && (
                <div className="checkout-copy-paste-wrap">
                  <label className="settings-label" style={{ fontSize: '12px' }}>PIX Copia e Cola:</label>
                  <div className="checkout-copy-row">
                    <input
                      type="text"
                      readOnly
                      className="input-field"
                      value={activeCheckout.pixCopyPaste}
                      style={{ fontSize: '12px' }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopyPixCode(activeCheckout.pixCopyPaste!)}
                    >
                      <MdContentCopy /> Copiar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Link para Fatura Oficial Asaas (Cartão de Crédito / Boleto / PIX) */}
            {activeCheckout.invoiceUrl && (
              <a
                href={activeCheckout.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="checkout-invoice-link"
              >
                <MdOpenInNew size={18} />
                Pagar com Cartão de Crédito ou Boleto no Ambiente Seguro Asaas
              </a>
            )}

            <div className="checkout-actions-footer">
              <Button
                type="button"
                variant="primary"
                fullWidth
                isLoading={verifyingPayment}
                onClick={() => handleVerifyPaymentNow(activeCheckout.subscriptionId, false)}
              >
                <MdRefresh size={18} /> Já realizei o pagamento (Verificar agora)
              </Button>

              {activeCheckout.isSandboxOrDemo && !subSummary?.gatewayConfigured && (
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  isLoading={verifyingPayment}
                  onClick={() => handleVerifyPaymentNow(activeCheckout.subscriptionId, true)}
                >
                  <MdVerified size={18} /> Simular Pagamento Aprovado (Modo Teste)
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
