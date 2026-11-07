import { useState, useEffect, useMemo } from 'react';
import {
  MdAdminPanelSettings,
  MdTrendingUp,
  MdAttachMoney,
  MdVerified,
  MdPeople,
  MdSearch,
  MdRefresh,
  MdPersonAddAlt1,
  MdBlock,
  MdAutorenew,
  MdOutlineWorkspacePremium,
  MdOpenInNew,
  MdSecurity,
  MdMenuBook,
  MdAssignment,
  MdVpnKey
} from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import type { AdminDashboardData, AdminProfessorItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminPage() {
  const { professor } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'professors' | 'subscriptions'>('professors');

  // Filters for Professors tab
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'admin'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filters for Subscriptions tab
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'active' | 'pending' | 'other'>('all');

  // Pre-activate email modal state
  const [preModalOpen, setPreModalOpen] = useState(false);
  const [preEmail, setPreEmail] = useState('');
  const [preName, setPreName] = useState('');
  const [prePlanType, setPrePlanType] = useState<'annual' | 'monthly' | 'lifetime'>('annual');
  const [preInitialPassword, setPreInitialPassword] = useState('');
  const [savingPreActivate, setSavingPreActivate] = useState(false);

  // Gateway Asaas Vault modal state
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [gatewayApiKey, setGatewayApiKey] = useState('');
  const [savingGateway, setSavingGateway] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboard();
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao carregar o Painel Administrativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLicenseAction = async (
    prof: AdminProfessorItem,
    action: 'activate_monthly' | 'activate_annual' | 'activate_lifetime' | 'extend_trial' | 'block' | 'toggle_admin',
    label: string
  ) => {
    if (action === 'block') {
      if (!window.confirm(`Deseja realmente bloquear/expirar o acesso de "${prof.name}" (${prof.email})?`)) return;
    }

    setProcessingId(prof.id);
    try {
      const res = await adminService.updateProfessorLicense(prof.id, {
        action,
        customDays: action === 'extend_trial' ? 14 : undefined,
        recordRevenue: true,
      });
      setData(res.data);
      toast.success(`${label} aplicado com sucesso para ${prof.name}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao executar ação administrativa.');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePreActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preEmail.trim()) {
      toast.error('Informe o e-mail do professor.');
      return;
    }

    setSavingPreActivate(true);
    try {
      const res = await adminService.preActivateEmail({
        email: preEmail.trim(),
        name: preName.trim() || undefined,
        planType: prePlanType,
        initialPassword: preInitialPassword.trim() || undefined,
      });
      setData(res.data);
      toast.success(`Licença ${prePlanType === 'annual' ? 'Anual' : prePlanType === 'lifetime' ? 'Vitalícia' : 'Mensal'} ativada para ${preEmail.trim()}!`);
      setPreModalOpen(false);
      setPreEmail('');
      setPreName('');
      setPreInitialPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao ativar licença por e-mail.');
    } finally {
      setSavingPreActivate(false);
    }
  };

  const handleSaveGatewayKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayApiKey.trim()) {
      toast.error('Cole a chave de API do Asaas ($aact_prod_...).');
      return;
    }
    setSavingGateway(true);
    try {
      const res = await adminService.updateGatewayConfig(gatewayApiKey.trim());
      setData(res.data);
      toast.success('Chave de API do Asaas salva com segurança no cofre do servidor!');
      setGatewayModalOpen(false);
      setGatewayApiKey('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar chave do Asaas.');
    } finally {
      setSavingGateway(false);
    }
  };

  const filteredProfessors = useMemo(() => {
    if (!data?.professors) return [];
    return data.professors.filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.cpfCnpj && p.cpfCnpj.includes(q)) ||
        (p.phone && p.phone.includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return p.subscriptionStatus === 'active';
      if (statusFilter === 'trial') return p.subscriptionStatus === 'trial';
      if (statusFilter === 'expired') return p.subscriptionStatus === 'expired' || p.subscriptionStatus === 'blocked';
      if (statusFilter === 'admin') return p.isAdmin;
      return true;
    });
  }, [data, searchTerm, statusFilter]);

  const filteredSubscriptions = useMemo(() => {
    if (!data?.recentSubscriptions) return [];
    return data.recentSubscriptions.filter(s => {
      if (subStatusFilter === 'active') return s.status === 'active';
      if (subStatusFilter === 'pending') return s.status === 'pending';
      if (subStatusFilter === 'other') return s.status !== 'active' && s.status !== 'pending';
      return true;
    });
  }, [data, subStatusFilter]);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getPlanBadge = (prof: AdminProfessorItem) => {
    if (prof.subscriptionStatus === 'blocked') {
      return <span className="admin-status-badge blocked">Bloqueado</span>;
    }
    if (prof.subscriptionStatus === 'expired') {
      return <span className="admin-status-badge expired">Expirado</span>;
    }
    if (prof.subscriptionStatus === 'active') {
      if (prof.planType === 'lifetime') {
        return <span className="admin-status-badge lifetime">Vitalício</span>;
      }
      if (prof.planType === 'annual') {
        return <span className="admin-status-badge annual">Pro Anual ({prof.daysRemaining}d)</span>;
      }
      return <span className="admin-status-badge monthly">Pro Mensal ({prof.daysRemaining}d)</span>;
    }
    return <span className="admin-status-badge trial">Trial ({prof.daysRemaining}d)</span>;
  };

  if (loading && !data) {
    return (
      <div className="admin-page">
        <Card variant="elevated">
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Carregando indicadores administrativos...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Top Action Header */}
      <div className="admin-top-bar">
        <div>
          <h2 className="admin-heading">
            <MdAdminPanelSettings /> Painel Administrativo & Assinaturas
          </h2>
          <p className="admin-subheading">
            Acompanhe receitas recorrentes, métricas de uso da plataforma e gerencie licenças de professores em tempo real.
          </p>
        </div>
        <div className="admin-top-actions">
          <Button variant="outline" onClick={loadDashboard} isLoading={loading}>
            <MdRefresh size={18} /> Atualizar
          </Button>
          <Button variant="outline" onClick={() => setGatewayModalOpen(true)}>
            <MdVpnKey size={18} /> {data?.gatewayConfigured ? 'Asaas Conectado' : 'Configurar Chave Asaas'}
          </Button>
          <Button variant="primary" onClick={() => setPreModalOpen(true)}>
            <MdPersonAddAlt1 size={18} /> Liberar Licença por E-mail
          </Button>
        </div>
      </div>

      {/* Row 1: Financial & Subscription KPIs */}
      {data && (
        <div className="admin-kpi-grid">
          <Card variant="elevated" className="admin-kpi-card">
            <div className="admin-kpi-icon violet"><MdTrendingUp /></div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">MRR (Receita Recorrente Mensal)</span>
              <strong className="admin-kpi-value">{formatCurrency(data.mrr)}</strong>
              <span className="admin-kpi-foot">ARR Projetado: <strong>{formatCurrency(data.arr)}</strong>/ano</span>
            </div>
          </Card>

          <Card variant="elevated" className="admin-kpi-card">
            <div className="admin-kpi-icon emerald"><MdAttachMoney /></div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">Faturamento Total Acumulado</span>
              <strong className="admin-kpi-value">{formatCurrency(data.totalPlatformRevenue)}</strong>
              <span className="admin-kpi-foot">Soma de assinaturas confirmadas</span>
            </div>
          </Card>

          <Card variant="elevated" className="admin-kpi-card">
            <div className="admin-kpi-icon cyan"><MdVerified /></div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">Assinantes Pro Ativos</span>
              <strong className="admin-kpi-value">{data.activeSubscribersCount}</strong>
              <span className="admin-kpi-foot">
                {data.annualSubscribersCount} Anuais • {data.monthlySubscribersCount} Mensais
                {data.lifetimeSubscribersCount > 0 ? ` • ${data.lifetimeSubscribersCount} Vitalícios` : ''}
              </span>
            </div>
          </Card>

          <Card variant="elevated" className="admin-kpi-card">
            <div className="admin-kpi-icon amber"><MdPeople /></div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">Base de Professores ({data.totalProfessors})</span>
              <strong className="admin-kpi-value">{data.trialProfessorsCount} em Teste</strong>
              <span className="admin-kpi-foot">
                {data.expiredOrBlockedCount} expirados ou bloqueados
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Row 2: Platform Usage Metrics */}
      {data && (
        <div className="admin-usage-strip">
          <div className="admin-usage-pill">
            <MdPeople />
            <span><strong>{data.totalProfessors}</strong> Professores Cadastrados</span>
          </div>
          <div className="admin-usage-pill">
            <MdOutlineWorkspacePremium />
            <span><strong>{data.totalPlatformStudents}</strong> Alunos na Plataforma</span>
          </div>
          <div className="admin-usage-pill">
            <MdMenuBook />
            <span><strong>{data.totalPlatformLessons}</strong> Aulas Registradas</span>
          </div>
          <div className="admin-usage-pill">
            <MdAssignment />
            <span><strong>{data.totalPlatformActivities}</strong> Modelos de Provas/Atividades</span>
          </div>
          <div className="admin-usage-pill" onClick={() => setGatewayModalOpen(true)} style={{ cursor: 'pointer' }}>
            <MdVpnKey />
            <span>
              Gateway Asaas:{' '}
              <strong>
                {data.gatewayConfigured
                  ? data.gatewayEnvironment === 'production'
                    ? `Produção Ativo (${data.maskedGatewayKey ?? 'Configurado'})`
                    : `Sandbox (${data.maskedGatewayKey ?? 'Configurado'})`
                  : 'Modo Demonstração'}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="admin-tabs-bar">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'professors' ? 'active' : ''}`}
          onClick={() => setActiveTab('professors')}
        >
          Gestão de Professores ({data?.professors.length ?? 0})
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Histórico de Assinaturas e Pagamentos ({data?.recentSubscriptions.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Professors Management */}
      {activeTab === 'professors' && (
        <Card variant="elevated" className="admin-section-card">
          <div className="admin-filters-row">
            <div className="admin-search-box">
              <MdSearch className="admin-search-icon" />
              <input
                type="text"
                className="input-field admin-search-input"
                placeholder="Buscar professor por nome, e-mail, telefone ou CPF/CNPJ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-filter-pills">
              <button
                type="button"
                className={`admin-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Todos ({data?.professors.length ?? 0})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Ativos ({data?.activeSubscribersCount ?? 0})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${statusFilter === 'trial' ? 'active' : ''}`}
                onClick={() => setStatusFilter('trial')}
              >
                Em Teste ({data?.trialProfessorsCount ?? 0})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${statusFilter === 'expired' ? 'active' : ''}`}
                onClick={() => setStatusFilter('expired')}
              >
                Expirados/Bloq ({data?.expiredOrBlockedCount ?? 0})
              </button>
            </div>
          </div>

          <div className="admin-professors-list">
            {filteredProfessors.length === 0 ? (
              <p className="admin-empty-text">Nenhum professor encontrado para os filtros selecionados.</p>
            ) : (
              filteredProfessors.map(prof => {
                const expiryDate = prof.subscriptionExpiresAt || prof.trialEndsAt;
                const isBusy = processingId === prof.id;

                return (
                  <div key={prof.id} className="admin-prof-row">
                    <div className="admin-prof-main">
                      <div className="admin-prof-title-line">
                        <strong>{prof.name}</strong>
                        {prof.isAdmin && <span className="admin-role-tag"><MdSecurity /> Admin</span>}
                        {getPlanBadge(prof)}
                      </div>
                      <div className="admin-prof-meta-line">
                        <span>{prof.email}</span>
                        {prof.phone && <span>• Tel: {prof.phone}</span>}
                        {prof.cpfCnpj && <span>• Doc: {prof.cpfCnpj}</span>}
                        <span>• Cadastro: {new Date(prof.createdAt).toLocaleDateString('pt-BR')}</span>
                        {expiryDate && prof.planType !== 'lifetime' && (
                          <span>• Vencimento: <strong>{new Date(expiryDate).toLocaleDateString('pt-BR')}</strong></span>
                        )}
                      </div>
                      <div className="admin-prof-stats-line">
                        <span>👥 <strong>{prof.activeStudentsCount}</strong> alunos ativos ({prof.studentsCount} total)</span>
                        <span>📅 <strong>{prof.lessonsCount}</strong> aulas</span>
                        <span>📝 <strong>{prof.activitiesCount}</strong> atividades</span>
                        <span>💰 Pago: <strong>{formatCurrency(prof.totalPaidAmount)}</strong></span>
                      </div>
                    </div>

                    <div className="admin-prof-actions">
                      <button
                        type="button"
                        disabled={isBusy}
                        className="admin-act-btn annual"
                        title="Ativar ou renovar licença anual (+365 dias)"
                        onClick={() => handleLicenseAction(prof, 'activate_annual', 'Licença Anual (+1 ano)')}
                      >
                        +1 Ano (Anual)
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        className="admin-act-btn monthly"
                        title="Ativar ou renovar licença mensal (+30 dias)"
                        onClick={() => handleLicenseAction(prof, 'activate_monthly', 'Licença Mensal (+30 dias)')}
                      >
                        +30d (Mensal)
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        className="admin-act-btn lifetime"
                        title="Conceder licença vitalícia gratuita"
                        onClick={() => handleLicenseAction(prof, 'activate_lifetime', 'Licença Vitalícia')}
                      >
                        Vitalício
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        className="admin-act-btn trial"
                        title="Estender período de teste por +14 dias"
                        onClick={() => handleLicenseAction(prof, 'extend_trial', '+14 dias de Trial')}
                      >
                        <MdAutorenew /> +14d Trial
                      </button>
                      {prof.subscriptionStatus !== 'blocked' && prof.id !== professor?.id && !prof.isAdmin && (
                        <button
                          type="button"
                          disabled={isBusy}
                          className="admin-act-btn block"
                          title="Bloquear escrita / Expirar acesso"
                          onClick={() => handleLicenseAction(prof, 'block', 'Bloqueio de licença')}
                        >
                          <MdBlock /> Bloquear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab 2: Subscriptions & Payments History */}
      {activeTab === 'subscriptions' && (
        <Card variant="elevated" className="admin-section-card">
          <div className="admin-filters-row">
            <div className="admin-filter-pills">
              <button
                type="button"
                className={`admin-filter-chip ${subStatusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSubStatusFilter('all')}
              >
                Todas ({data?.recentSubscriptions.length ?? 0})
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${subStatusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setSubStatusFilter('active')}
              >
                Confirmadas / Ativas
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${subStatusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setSubStatusFilter('pending')}
              >
                Aguardando Pagamento
              </button>
              <button
                type="button"
                className={`admin-filter-chip ${subStatusFilter === 'other' ? 'active' : ''}`}
                onClick={() => setSubStatusFilter('other')}
              >
                Vencidas / Canceladas
              </button>
            </div>
          </div>

          <div className="admin-professors-list">
            {filteredSubscriptions.length === 0 ? (
              <p className="admin-empty-text">Nenhuma transação encontrada.</p>
            ) : (
              filteredSubscriptions.map(sub => (
                <div key={sub.id} className="admin-prof-row">
                  <div className="admin-prof-main">
                    <div className="admin-prof-title-line">
                      <strong>{sub.professorName}</strong>
                      <span className="admin-sub-email">({sub.professorEmail})</span>
                      <span className={`admin-status-badge ${sub.status === 'active' ? 'annual' : sub.status === 'pending' ? 'trial' : 'expired'}`}>
                        {sub.status === 'active' ? 'Pago / Ativo' : sub.status === 'pending' ? 'Pendente' : sub.status}
                      </span>
                    </div>
                    <div className="admin-prof-meta-line">
                      <span>Plano: <strong>{sub.planType === 'annual' ? 'Aura Pro Anual' : 'Aura Pro Mensal'}</strong></span>
                      <span>• Valor: <strong>{formatCurrency(sub.price)}</strong></span>
                      <span>• Forma: <strong>{sub.billingType}</strong></span>
                      <span>• Gerada em: {new Date(sub.createdAt).toLocaleDateString('pt-BR')}</span>
                      {sub.endDate && (
                        <span>• Vigência até: <strong>{new Date(sub.endDate).toLocaleDateString('pt-BR')}</strong></span>
                      )}
                    </div>
                  </div>
                  {sub.invoiceUrl && (
                    <div className="admin-prof-actions">
                      <a
                        href={sub.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-act-btn monthly"
                        style={{ textDecoration: 'none' }}
                      >
                        <MdOpenInNew /> Ver Fatura Asaas
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Modal: Liberar / Pré-Ativar Licença por E-mail */}
      <Modal
        isOpen={preModalOpen}
        onClose={() => setPreModalOpen(false)}
        title="Liberar ou Pré-Ativar Licença por E-mail"
      >
        <form onSubmit={handlePreActivateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Se o e-mail já estiver cadastrado no Aura, a licença será ativada imediatamente. Se ainda não tiver conta, o sistema criará a conta já com a licença ativa.
          </p>

          <Input
            label="E-mail do Professor *"
            type="email"
            placeholder="Ex: fernandasanaiotinogueira@gmail.com"
            value={preEmail}
            onChange={e => setPreEmail(e.target.value)}
            required
          />

          <Input
            label="Nome do Professor (Opcional se já tiver conta)"
            placeholder="Ex: Fernanda Sanaioti Nogueira"
            value={preName}
            onChange={e => setPreName(e.target.value)}
          />

          <div className="input-group">
            <label className="input-label">Tipo de Licença *</label>
            <select
              className="input-field"
              value={prePlanType}
              onChange={e => setPrePlanType(e.target.value as 'annual' | 'monthly' | 'lifetime')}
            >
              <option value="annual">Aura Pro Anual (+365 dias — R$ 299,00)</option>
              <option value="monthly">Aura Pro Mensal (+30 dias — R$ 29,90)</option>
              <option value="lifetime">Licença Vitalícia (Cortesia / Parceiro)</option>
            </select>
          </div>

          <Input
            label="Senha Inicial (Apenas caso a conta ainda não exista — padrão: Aura@123)"
            type="text"
            placeholder="Deixe em branco para usar Aura@123"
            value={preInitialPassword}
            onChange={e => setPreInitialPassword(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button type="button" variant="outline" onClick={() => setPreModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={savingPreActivate}>
              Ativar Licença Agora
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cofre Seguro da Chave Asaas */}
      <Modal
        isOpen={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        title="Cofre Seguro — Integração Asaas (Produção)"
      >
        <form onSubmit={handleSaveGatewayKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: 1.5 }}>
            <div>
              <strong>Status Atual:</strong>{' '}
              {data?.gatewayConfigured ? (
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  Conectado ({data.gatewayEnvironment === 'production' ? 'Produção' : 'Sandbox'})
                </span>
              ) : (
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>Não configurado (Modo Demo)</span>
              )}
            </div>
            {data?.maskedGatewayKey && (
              <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                Chave em uso: {data.maskedGatewayKey}
              </div>
            )}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            A chave fica armazenada de forma criptografada/isolada no banco de dados e no arquivo local ignorado pelo Git, sem nunca ser exposta no código-fonte público.
          </p>

          <Input
            label="Nova Chave de API do Asaas ($aact_prod_...)"
            type="password"
            placeholder="Cole aqui sua chave $aact_prod_..."
            value={gatewayApiKey}
            onChange={e => setGatewayApiKey(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button type="button" variant="outline" onClick={() => setGatewayModalOpen(false)}>
              Fechar
            </Button>
            <Button type="submit" variant="primary" isLoading={savingGateway}>
              Salvar no Cofre Seguro
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
