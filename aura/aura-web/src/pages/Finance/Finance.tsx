import { useEffect, useState } from 'react';
import { MdTrendingUp, MdAttachMoney, MdAccountBalanceWallet, MdChevronRight, MdCalendarToday } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { financeService } from '../../services/dataServices';
import type { FinanceData } from '../../types';
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

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Selection period states
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    financeService.getData(selectedMonth, selectedYear)
      .then(res => {
        setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  if (loading || !data) return <div className="page-loading"><span className="loading-spinner" /></div>;

  const monthLabel = MONTHS_LIST.find(m => m.value === selectedMonth)?.label || '';

  const summaryCards = [
    {
      icon: <MdAttachMoney />,
      label: `Faturamento de ${monthLabel.toUpperCase()} / ${selectedYear}`,
      value: `R$ ${(data?.monthlyRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'primary' as const
    },
    {
      icon: <MdTrendingUp />,
      label: `Faturamento Anual (${selectedYear})`,
      value: `R$ ${(data?.yearlyRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'secondary' as const
    },
    {
      icon: <MdAccountBalanceWallet />,
      label: 'Total Geral Acumulado',
      value: `R$ ${(data?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: 'success' as const
    }
  ];

  return (
    <div className="finance-page">
      <div className="finance-header flex-header">
        <div>
          <h2 className="finance-title">Gestão Financeira</h2>
          <p className="finance-subtitle">Monitore sua progressão de ganhos, receitas por matéria e pendências de mensalidades.</p>
        </div>

        {/* Period Selector Controls */}
        <div className="period-selectors animate-fadeIn">
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

      <div className="finance-charts-grid">
        {/* Progression Chart */}
        <Card variant="elevated" className="chart-card animate-slideUp stagger-4">
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
        <Card variant="elevated" className="chart-card animate-slideUp stagger-5">
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

      {/* Student payment list */}
      <Card variant="elevated" className="students-payments-card animate-slideUp stagger-6">
        <div className="card-header-bar">
          <h3 className="table-card-title">Situação de Mensalidades</h3>
          <Badge variant="info">{monthLabel} de {selectedYear}</Badge>
        </div>

        <div className="table-responsive">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Mensalidade</th>
                <th>Status</th>
                <th>Valor Pago</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.studentPaymentStatuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-table-row">
                    Nenhum aluno cadastrado para exibir pagamentos.
                  </td>
                </tr>
              ) : (
                data?.studentPaymentStatuses.map(item => (
                  <tr key={item.studentId}>
                    <td>
                      <div className="student-profile-cell">
                        <Avatar name={item.studentName} size="sm" />
                        <span className="profile-cell-name">{item.studentName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="monthly-price-badge">R$ {item.monthlyPrice.toFixed(2)}</span>
                    </td>
                    <td>
                      {item.isPaid ? (
                        <Badge variant="success">PAGO</Badge>
                      ) : (
                        <Badge variant="danger">PENDENTE</Badge>
                      )}
                    </td>
                    <td>
                      <span className={`paid-value-cell ${item.isPaid ? 'is-paid-val' : 'is-pending-val'}`}>
                        R$ {item.amountPaid.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="manage-payment-btn"
                        onClick={() => navigate(`/students/${item.studentId}`, { state: { activeTab: 'payments' } })}
                      >
                        Gerenciar Mensalidade <MdChevronRight className="btn-chevron-icon" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
