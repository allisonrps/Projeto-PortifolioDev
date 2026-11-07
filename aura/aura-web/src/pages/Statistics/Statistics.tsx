import { useEffect, useState } from 'react';
import {
  MdPeople, MdAccessTime, MdMenuBook, MdCake, MdPercent, MdPieChart, MdCheckCircle
} from 'react-icons/md';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { dashboardService } from '../../services/dataServices';
import type { DashboardData, LessonStatusStat } from '../../types';
import './Statistics.css';

const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981', // Verde
  cancelled: '#EF4444', // Vermelho
  holiday: '#F59E0B',   // Amarelo
  scheduled: '#7C3AED', // Roxo
};

const MONTH_OPTIONS = [
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
  { value: 12, label: 'Dezembro' },
];

const SUBJECT_COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export default function StatisticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Period filters for Status distribution chart
  const [chartMode, setChartMode] = useState<'monthly' | 'yearly'>('monthly');
  const [chartMonth, setChartMonth] = useState<number>(new Date().getMonth() + 1);
  const [chartYear, setChartYear] = useState<number>(new Date().getFullYear());

  // Period filter for Effectiveness chart
  const [effMode, setEffMode] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.get();
      setData(res.data);
    } catch {
      // Silently handle
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="page-loading"><span className="loading-spinner" /></div>;
  }

  // --- Alunos statistics calculations ---
  const activeCount = data?.activeStudentsCount ?? 0;
  const archivedCount = data?.archivedStudentsCount ?? 0;
  const totalCount = data?.totalStudents ?? 0;

  const studentStats = [
    { label: 'Total de Alunos', value: totalCount, icon: <MdPeople />, color: 'primary' as const },
    { label: 'Alunos Ativos', value: activeCount, icon: <MdPeople />, color: 'success' as const },
    { label: 'Alunos Arquivados', value: archivedCount, icon: <MdPeople />, color: 'secondary' as const },
    { label: 'Frequência Média', value: `${data?.averageAttendanceRate ?? 0}%`, icon: <MdPercent />, color: 'warning' as const }
  ];

  const subjectChartData = (data?.subjectStats || []).map((s, idx) => ({
    name: s.subjectName,
    value: s.studentCount,
    color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
  }));

  // --- Teacher load calculations ---
  const teacherStats = [
    { label: 'Aulas Realizadas (Mês)', value: data?.monthlyLessonsCount ?? 0, hours: `${data?.monthlyWorkloadHours ?? 0}h`, icon: <MdAccessTime />, color: 'success' as const },
    { label: 'Aulas Realizadas (Ano)', value: data?.yearlyLessonsCount ?? 0, hours: `${data?.yearlyWorkloadHours ?? 0}h`, icon: <MdAccessTime />, color: 'primary' as const },
  ];

  const currentStats = chartMode === 'monthly'
    ? data?.monthlyLessonStatusStats || []
    : data?.yearlyLessonStatusStats || [];

  const chartData = currentStats
    .filter(s => s.count > 0)
    .map(s => ({
      name: s.label,
      value: s.count,
      hours: s.hours,
      percentage: s.percentage,
      color: STATUS_COLORS[s.status] || '#7C3AED'
    }));

  const effRate = effMode === 'monthly'
    ? data?.monthlyEffectivenessRate ?? 100
    : data?.yearlyEffectivenessRate ?? 100;

  const effChartData = [
    { name: 'Aulas Dadas', value: effRate, color: '#10B981' },
    { name: 'Outros (Cancelada/Feriado/Past)', value: Math.max(0, 100 - effRate), color: '#EF4444' }
  ];

  return (
    <div className="statistics-page animate-fadeIn" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>📊 Estatísticas & Carga Horária</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Análise detalhada de alunos, matérias, aulas e carga horária de ensino.
        </p>
      </div>

      {/* Seção 1: Gestão de Alunos */}
      <div className="dashboard-section" style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 className="dashboard-section-title" style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>👥 Estatísticas dos Alunos</h3>
        <div className="stats-grid">
          {studentStats.map((stat, i) => (
            <Card key={stat.label + '-' + i} variant="elevated" accentColor={stat.color} className="stat-card">
              <div className="stat-icon-wrap" data-color={stat.color}>{stat.icon}</div>
              <div className="stat-info">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="dashboard-grid" style={{ marginTop: 'var(--space-md)' }}>
          {/* Matérias stats */}
          <Card variant="elevated">
            <div className="card-section-header">
              <MdMenuBook /> <h3>Distribuição de Alunos por Matéria</h3>
            </div>
            {subjectChartData.length === 0 ? (
              <p className="empty-text">Nenhuma matéria com alunos cadastrados.</p>
            ) : (
              <div className="status-chart-container">
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {subjectChartData.map((entry: any, index: number) => (
                          <Cell key={`subject-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} aluno(s)`, name]}
                        contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="status-stats-list">
                  {subjectChartData.map((s, idx) => (
                    <div key={idx} className="status-stat-row">
                      <div className="status-stat-header">
                        <span className="status-color-dot" style={{ background: s.color }} />
                        <span className="status-stat-label">{s.name}</span>
                        <span className="status-stat-percent">{s.value} aluno(s)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Aniversariantes do Mês */}
          <Card variant="elevated">
            <div className="card-section-header">
              <MdCake className="birthday-header-icon" /> <h3>Aniversariantes do Mês</h3>
            </div>
            <div className="birthday-list">
              {data?.birthdayStudents.length === 0 ? (
                <p className="empty-text">Nenhum aniversariante este mês</p>
              ) : (
                data?.birthdayStudents.map(b => (
                  <div key={b.studentId} className="birthday-item">
                    <Avatar name={b.studentName} size="sm" />
                    <div className="birthday-info">
                      <p className="birthday-student-name">{b.studentName}</p>
                      <p className="birthday-desc">Dia {b.birthDay} — completando <strong style={{ color: 'var(--accent-primary)' }}>{b.age} anos</strong></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Seção 2: Ensino & Carga Horária */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title" style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>⏱️ Ensino & Carga Horária</h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {teacherStats.map((stat, i) => (
            <Card key={stat.label + '-' + i} variant="elevated" accentColor={stat.color} className="stat-card">
              <div className="stat-icon-wrap" data-color={stat.color}>{stat.icon}</div>
              <div className="stat-info">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value" style={{ fontSize: '20px' }}>
                  {stat.value} <span style={{ fontSize: '15px', color: 'var(--accent-secondary)', fontWeight: '600' }}>({stat.hours})</span>
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="dashboard-grid" style={{ marginTop: 'var(--space-md)' }}>
          {/* Distribuição de Status */}
          <Card variant="elevated">
            <div className="card-section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdPieChart /> <h3>Distribuição de Aulas & Carga Horária</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                <div className="chart-mode-toggle">
                  <button
                    className={`mode-btn ${chartMode === 'monthly' ? 'active' : ''}`}
                    onClick={() => setChartMode('monthly')}
                  >
                    Mês
                  </button>
                  <button
                    className={`mode-btn ${chartMode === 'yearly' ? 'active' : ''}`}
                    onClick={() => setChartMode('yearly')}
                  >
                    Anual
                  </button>
                </div>

                {chartMode === 'monthly' && (
                  <select
                    className="filter-select-sm"
                    value={chartMonth}
                    onChange={e => setChartMonth(parseInt(e.target.value))}
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}

                <select
                  className="filter-select-sm"
                  value={chartYear}
                  onChange={e => setChartYear(parseInt(e.target.value))}
                >
                  {[2026, 2025, 2024].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {chartData.length === 0 ? (
              <p className="empty-text">Nenhuma aula registrada para o período selecionado ({chartMode === 'monthly' ? `${MONTH_OPTIONS.find(m=>m.value===chartMonth)?.label}/${chartYear}` : `Acumulado ${chartYear}`}).</p>
            ) : (
              <div className="status-chart-container">
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val} aula(s) (${item.payload.hours}h) — ${item.payload.percentage}%`,
                          name
                        ]}
                        contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="status-stats-list">
                  {currentStats.map((stat: LessonStatusStat) => {
                    const color = STATUS_COLORS[stat.status] || '#7C3AED';
                    return (
                      <div key={stat.status} className="status-stat-row">
                        <div className="status-stat-header">
                          <span className="status-color-dot" style={{ background: color }} />
                          <span className="status-stat-label">{stat.label}</span>
                          <span className="status-stat-badge">{stat.count} aula(s) ({stat.hours}h)</span>
                          <span className="status-stat-percent">{stat.percentage}%</span>
                        </div>
                        <div className="status-stat-bar">
                          <div className="status-stat-fill" style={{ width: `${stat.percentage}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Efetividade */}
          <Card variant="elevated">
            <div className="card-section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MdCheckCircle style={{ color: 'var(--success)' }} /> <h3>Efetividade (Aulas Dadas)</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                <div className="chart-mode-toggle">
                  <button
                    className={`mode-btn ${effMode === 'monthly' ? 'active' : ''}`}
                    onClick={() => setEffMode('monthly')}
                  >
                    Mês
                  </button>
                  <button
                    className={`mode-btn ${effMode === 'yearly' ? 'active' : ''}`}
                    onClick={() => setEffMode('yearly')}
                  >
                    Anual
                  </button>
                </div>

                {effMode === 'monthly' && (
                  <select
                    className="filter-select-sm"
                    value={chartMonth}
                    onChange={e => setChartMonth(parseInt(e.target.value))}
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}

                <select
                  className="filter-select-sm"
                  value={chartYear}
                  onChange={e => setChartYear(parseInt(e.target.value))}
                >
                  {[2026, 2025, 2024].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="status-chart-container" style={{ position: 'relative' }}>
              <div style={{ width: '100%', height: 200, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={effChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={82}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      {effChartData.map((entry, index) => (
                        <Cell key={`eff-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val}%`, name]}
                      contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '26px', fontWeight: '800', color: '#10B981', display: 'block' }}>
                    {effRate}%
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {effMode === 'monthly' ? 'Efetividade Mês' : 'Efetividade Anual'}
                  </span>
                </div>
              </div>

              <div className="status-stats-list">
                <div className="status-stat-row">
                  <div className="status-stat-header">
                    <span className="status-color-dot" style={{ background: '#10B981' }} />
                    <span className="status-stat-label">Aulas Concluídas / Realmente Dadas</span>
                    <span className="status-stat-percent">{effRate}%</span>
                  </div>
                  <div className="status-stat-bar">
                    <div className="status-stat-fill" style={{ width: `${effRate}%`, background: '#10B981' }} />
                  </div>
                </div>

                <div className="status-stat-row">
                  <div className="status-stat-header">
                    <span className="status-color-dot" style={{ background: '#EF4444' }} />
                    <span className="status-stat-label">Faltas, Canceladas & Feriados</span>
                    <span className="status-stat-percent">{Math.max(0, 100 - effRate)}%</span>
                  </div>
                  <div className="status-stat-bar">
                    <div className="status-stat-fill" style={{ width: `${Math.max(0, 100 - effRate)}%`, background: '#EF4444' }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
