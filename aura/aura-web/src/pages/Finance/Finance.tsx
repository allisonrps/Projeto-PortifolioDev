import { useEffect, useState, type FormEvent } from 'react';
import { MdTrendingUp, MdAttachMoney, MdAccountBalanceWallet, MdCalendarToday, MdAdd, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { financeService, paymentService } from '../../services/dataServices';
import type { FinanceData } from '../../types';
import toast from 'react-hot-toast';

interface ManualFinanceEntry {
  id: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  description: string;
}
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Finance.css';

const PIE_COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const MONTHS_LIST = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];

const YEARS_LIST = [2024, 2025, 2026, 2027, 2028, 2029];

const LOCAL_MANUAL_ENTRIES_KEY = 'aura_manual_finance_entries';

function getStoredManualEntries(): ManualFinanceEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_MANUAL_ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredManualEntries(entries: ManualFinanceEntry[]) {
  try {
    localStorage.setItem(LOCAL_MANUAL_ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage quota errors
  }
}

function formatDateBr(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localEntries, setLocalEntries] = useState<ManualFinanceEntry[]>(() => getStoredManualEntries());
  
  // Selection period states
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const navigate = useNavigate();

  // Manual entry modal states
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  const loadData = () => {
    setLoading(true);
    financeService.getData(selectedMonth, selectedYear)
      .then(async res => {
        setData(res.data);
        // Try syncing any local-only entries if backend now supports manual entries
        const stored = getStoredManualEntries();
        if (stored.length > 0 && Array.isArray(res.data?.manualEntries)) {
          const remaining: ManualFinanceEntry[] = [];
          let syncedAny = false;
          for (const item of stored) {
            if (item.id.startsWith('local-')) {
              try {
                await financeService.createManualEntry({
                  amount: item.amount,
                  date: item.date,
                  month: item.month,
                  year: item.year,
                  description: item.description
                });
                syncedAny = true;
              } catch {
                remaining.push(item);
              }
            }
          }
          if (syncedAny) {
            saveStoredManualEntries(remaining);
            setLocalEntries(remaining);
            const refreshed = await financeService.getData(selectedMonth, selectedYear);
            setData(refreshed.data);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const openManualModal = () => {
    const now = new Date();
    const day = String(Math.min(now.getDate(), 28)).padStart(2, '0');
    const monthStr = String(selectedMonth).padStart(2, '0');
    setManualAmount('');
    setManualDate(`${selectedYear}-${monthStr}-${day}`);
    setManualDescription('');
    setIsManualModalOpen(true);
  };

  const handleCreateManualEntry = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(String(manualAmount).replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    if (!manualDate) {
      toast.error('Informe a data do lançamento.');
      return;
    }
    if (!manualDescription.trim()) {
      toast.error('Informe uma descrição.');
      return;
    }

    const dateParts = manualDate.split('-');
    const entryYear = dateParts.length === 3 ? Number(dateParts[0]) : selectedYear;
    const entryMonth = dateParts.length === 3 ? Number(dateParts[1]) : selectedMonth;

    setSubmittingManual(true);
    try {
      await financeService.createManualEntry({
        amount: numericAmount,
        date: manualDate,
        month: entryMonth,
        year: entryYear,
        description: manualDescription.trim()
      });
      toast.success('Lançamento manual adicionado!');
      setIsManualModalOpen(false);
      const freshData = await financeService.getData(selectedMonth, selectedYear);
      setData(freshData.data);
    } catch {
      // Fallback para armazenamento local caso o backend esteja atualizando
      const fallbackEntry: ManualFinanceEntry = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        amount: numericAmount,
        date: manualDate,
        month: entryMonth,
        year: entryYear,
        description: manualDescription.trim()
      };
      const updatedLocal = [fallbackEntry, ...getStoredManualEntries()];
      saveStoredManualEntries(updatedLocal);
      setLocalEntries(updatedLocal);
      toast.success('Lançamento manual adicionado!');
      setIsManualModalOpen(false);
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleDeleteManualEntry = async (id: string) => {
    if (id.startsWith('local-')) {
      const updatedLocal = getStoredManualEntries().filter(m => m.id !== id);
      saveStoredManualEntries(updatedLocal);
      setLocalEntries(updatedLocal);
      toast.success('Lançamento removido.');
      return;
    }

    try {
      await financeService.deleteManualEntry(id);
      toast.success('Lançamento removido.');
      const freshData = await financeService.getData(selectedMonth, selectedYear);
      setData(freshData.data);
    } catch {
      toast.error('Erro ao remover lançamento manual.');
    }
  };

  const handleTogglePaymentStatus = async (item: FinanceData['studentPaymentStatuses'][0]) => {
    if (!data) return;
    const previousStatuses = [...data.studentPaymentStatuses];

    // Optimistic UI Update
    setData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        studentPaymentStatuses: prev.studentPaymentStatuses.map(s => {
          if (s.studentId === item.studentId) {
            return {
              ...s,
              isPaid: !item.isPaid,
              paymentId: item.isPaid ? null : `temp-${Date.now()}`
            };
          }
          return s;
        })
      };
    });

    try {
      if (item.isPaid && item.paymentId) {
        await paymentService.delete(item.paymentId);
      } else {
        const res = await paymentService.create({
          studentId: item.studentId,
          month: selectedMonth,
          year: selectedYear,
          amount: item.monthlyPrice || 0,
          isPaid: true,
          paidAt: new Date().toISOString()
        });

        // Set the actual paymentId from response
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            studentPaymentStatuses: prev.studentPaymentStatuses.map(s => {
              if (s.studentId === item.studentId) {
                return { ...s, paymentId: res.data.id };
              }
              return s;
            })
          };
        });
      }
      // Silently refresh summary stats in background
      const freshData = await financeService.getData(selectedMonth, selectedYear);
      setData(freshData.data);
    } catch {
      // Rollback on error
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          studentPaymentStatuses: previousStatuses
        };
      });
      toast.error('Erro ao atualizar status do pagamento.');
    }
  };

  if (loading || !data) return <div className="page-loading"><span className="loading-spinner" /></div>;

  const monthLabel = MONTHS_LIST.find(m => m.value === selectedMonth)?.label || '';

  const serverManualEntries = data?.manualEntries || [];
  const serverIds = new Set(serverManualEntries.map(m => m.id));
  const unsyncedLocalAll = localEntries.filter(m => !serverIds.has(m.id));
  const unsyncedLocalMonth = unsyncedLocalAll.filter(m => m.month === selectedMonth && m.year === selectedYear);
  const unsyncedLocalYear = unsyncedLocalAll.filter(m => m.year === selectedYear);

  const manualEntries = [...unsyncedLocalMonth, ...serverManualEntries];
  const effectiveMonthlyRevenue = (data?.monthlyRevenue ?? 0) + unsyncedLocalMonth.reduce((acc, m) => acc + m.amount, 0);
  const effectiveYearlyRevenue = (data?.yearlyRevenue ?? 0) + unsyncedLocalYear.reduce((acc, m) => acc + m.amount, 0);
  const effectiveTotalRevenue = (data?.totalRevenue ?? 0) + unsyncedLocalAll.reduce((acc, m) => acc + m.amount, 0);

  const summaryCards = [
    {
      icon: <MdAttachMoney />,
      label: `Faturamento de ${monthLabel.toUpperCase()} / ${selectedYear}`,
      value: `R$ ${effectiveMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'primary' as const
    },
    {
      icon: <MdTrendingUp />,
      label: `Faturamento Anual (${selectedYear})`,
      value: `R$ ${effectiveYearlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'secondary' as const
    },
    {
      icon: <MdAccountBalanceWallet />,
      label: 'Total Geral Acumulado',
      value: `R$ ${effectiveTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'success' as const
    }
  ];

  const hasAnyEntries = manualEntries.length > 0 || (data?.studentPaymentStatuses.length ?? 0) > 0;

  return (
    <div className="finance-page">
      <div className="finance-header flex-header">
        <div>
          <h2 className="finance-title">Gestão Financeira</h2>
          <p className="finance-subtitle">Monitore sua progressão de ganhos, receitas por matéria e pendências de mensalidades.</p>
        </div>

        {/* Period Selector Controls */}
        <div className="period-selectors">
          <div className="selector-wrap">
            <MdCalendarToday className="selector-icon" />
            <select
              className="finance-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS_LIST.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="selector-wrap">
            <MdCalendarToday className="selector-icon" />
            <select
              className="finance-select"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {YEARS_LIST.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid">
        {summaryCards.map((card, i) => (
          <Card key={card.label} variant="elevated" accentColor={card.color} className={`stat-card animate-slideUp stagger-${i + 1}`}>
            <div className="stat-icon-wrap" data-color={card.color}>{card.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quadro de Mensalidades e Lançamentos Manuais (Acima dos gráficos, abaixo dos KPIs) */}
      <Card variant="elevated" className="students-payments-card animate-slideUp stagger-4">
        <div className="card-header-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 className="table-card-title">Situação de Mensalidades</h3>
            <Badge variant="info">{monthLabel} de {selectedYear}</Badge>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<MdAdd />}
            onClick={openManualModal}
          >
            Lançamento Manual
          </Button>
        </div>

        <div className="payments-list-wrapper" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {!hasAnyEntries ? (
            <div className="empty-table-row" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Nenhum lançamento ou aluno cadastrado para exibir neste período.
            </div>
          ) : (
            <>
              {/* Linhas de Lançamento Manual posicionadas ACIMA das mensalidades: VALOR - DATA - Descrição */}
              {manualEntries.map(entry => {
                const priceStr = entry.amount % 1 === 0 ? `R$ ${entry.amount.toFixed(0)}` : `R$ ${entry.amount.toFixed(2)}`;
                const dateFormatted = formatDateBr(entry.date);

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px var(--space-md)',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      className="finance-pay-badge"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '95px',
                        height: '36px',
                        borderRadius: '18px',
                        border: '2px solid var(--success)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--success)',
                        fontWeight: 800,
                        fontSize: '13px',
                        flexShrink: 0
                      }}
                      title="Lançamento Manual"
                    >
                      {priceStr}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {dateFormatted}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>-</span>
                        <span className="profile-cell-name" style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.description}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteManualEntry(entry.id)}
                        title="Excluir lançamento manual"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          flexShrink: 0,
                          transition: 'color var(--transition-fast)'
                        }}
                        onMouseOver={e => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Linhas de Mensalidades dos Alunos */}
              {data?.studentPaymentStatuses.map(item => {
                const priceStr = item.monthlyPrice % 1 === 0 ? `R$ ${item.monthlyPrice.toFixed(0)}` : `R$ ${item.monthlyPrice.toFixed(2)}`;
                
                return (
                  <div 
                    key={item.studentId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px var(--space-md)',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-tertiary)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Botão circular de valor/status ANTES do aluno */}
                    <button
                      className="finance-pay-badge"
                      onClick={() => handleTogglePaymentStatus(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '95px',
                        height: '36px',
                        borderRadius: '18px',
                        border: '2px solid',
                        borderColor: item.isPaid ? 'var(--success)' : 'var(--warning)',
                        background: item.isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.isPaid ? 'var(--success)' : 'var(--warning)',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '13px',
                        transition: 'all var(--transition-fast)',
                        flexShrink: 0
                      }}
                      title={item.isPaid ? "Clique para marcar como Pendente" : "Clique para marcar como Pago"}
                    >
                      {priceStr}
                    </button>

                    {/* Informações do Aluno */}
                    <div
                      className="student-profile-cell clickable"
                      onClick={() => navigate(`/students/${item.studentId}`)}
                      title="Ver perfil do aluno"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                        minWidth: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <Avatar name={item.studentName} size="sm" shape="square" />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span className="profile-cell-name" style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.studentName}</span>
                        {(item.subjectName || item.levelName) && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.subjectName}{item.levelName ? ` - ${item.levelName}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </Card>

      {/* Gráficos */}
      <div className="finance-charts-grid">
        {/* Progression Chart */}
        <Card variant="elevated" className="chart-card animate-slideUp stagger-5">
          <h3 className="chart-title">Evolução Mensal do Faturamento</h3>
          <div className="chart-container">
            {data?.revenueProgression.length === 0 ? (
              <div className="empty-chart">Nenhum histórico de mensalidade registrada</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.revenueProgression} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="monthName" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                    formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Subjects Revenue Chart */}
        <Card variant="elevated" className="chart-card animate-slideUp stagger-6">
          <h3 className="chart-title">Faturamento por Matéria</h3>
          <div className="chart-container pie-container">
            {data?.revenueBySubject.length === 0 ? (
              <div className="empty-chart">Dados insuficientes para gerar divisão por matéria</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.revenueBySubject}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="subjectName"
                  >
                    {data?.revenueBySubject.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                    formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Ganhos']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Lançamento Manual */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Novo Lançamento Manual"
        size="sm"
      >
        <form onSubmit={handleCreateManualEntry} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Ex: 150.00"
            value={manualAmount}
            onChange={e => setManualAmount(e.target.value)}
            required
          />
          <Input
            label="Data"
            type="date"
            value={manualDate}
            onChange={e => setManualDate(e.target.value)}
            required
          />
          <Input
            label="Descrição"
            type="text"
            placeholder="Ex: Aula avulsa, apostila..."
            value={manualDescription}
            onChange={e => setManualDescription(e.target.value)}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
            <Button type="button" variant="ghost" onClick={() => setIsManualModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingManual}>
              Salvar Lançamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
