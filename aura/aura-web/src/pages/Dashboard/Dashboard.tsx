import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdPeople, MdAccessTime, MdMenuBook, MdCake, MdPersonOff, MdSchool,
  MdPercent, MdCalendarToday, MdCalendarMonth, MdPieChart, MdCheckCircle,
  MdVisibility, MdVisibilityOff, MdEdit, MdSchedule, MdCancel
} from 'react-icons/md';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { dashboardService, lessonService } from '../../services/dataServices';
import type { DashboardData, LessonStatusStat, Lesson } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './Dashboard.css';

const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981', // Verde / Sucesso
  cancelled: '#EF4444', // Vermelho / Perigo
  holiday: '#F59E0B',   // Amarelo / Alerta
  scheduled: '#7C3AED', // Roxo / Primário
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Section visibility toggles (hidden by default)
  const [showStudentsSection, setShowStudentsSection] = useState(false);
  const [showTeacherSection, setShowTeacherSection] = useState(false);

  // Period filters for Status distribution chart
  const [chartMode, setChartMode] = useState<'monthly' | 'yearly'>('monthly');
  const [chartMonth, setChartMonth] = useState<number>(new Date().getMonth() + 1);
  const [chartYear, setChartYear] = useState<number>(new Date().getFullYear());

  // Period filter for Effectiveness chart
  const [effMode, setEffMode] = useState<'monthly' | 'yearly'>('monthly');

  // Edit Lesson Modal state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonStatus, setLessonStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'holiday'>('scheduled');
  const [lessonNotes, setLessonNotes] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);

  const handleOpenEditLesson = (lesson: Lesson, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLesson(lesson);
    setLessonStatus(lesson.status);
    setLessonNotes(lesson.notes || '');
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;
    setSavingLesson(true);
    try {
      await lessonService.update(selectedLesson.id, {
        status: lessonStatus,
        notes: lessonNotes
      });
      toast.success('Aula atualizada!');
      setLessonModalOpen(false);
      dashboardService.get(chartMonth, chartYear).then(r => setData(r.data));
    } catch {
      toast.error('Erro ao atualizar a aula.');
    }
    setSavingLesson(false);
  };

  useEffect(() => {
    setLoading(true);
    dashboardService.get(chartMonth, chartYear)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chartMonth, chartYear]);

  if (loading || !data) return <div className="page-loading"><span className="loading-spinner" /></div>;

  const studentStats = [
    { icon: <MdPeople />, label: 'Total de Alunos', value: data?.totalStudents ?? 0, color: 'primary' as const },
    { icon: <MdPeople />, label: 'Alunos Ativos', value: data?.activeStudentsCount ?? 0, color: 'success' as const },
    { icon: <MdPersonOff />, label: 'Alunos Arquivados', value: data?.archivedStudentsCount ?? 0, color: 'danger' as const },
    { icon: <MdPercent />, label: 'Presença Média', value: `${data?.averageAttendanceRate ?? 100}%`, color: 'warning' as const },
    { icon: <MdSchool />, label: 'Matérias Ativas', value: data?.subjectStats.length ?? 0, color: 'secondary' as const },
  ];

  const teacherStats = [
    {
      icon: <MdCalendarToday />,
      label: 'Aulas / Horas no Mês',
      value: `${data?.monthlyLessonsCount ?? 0} aulas`,
      hours: `${data?.monthlyWorkloadHours ?? 0}h`,
      color: 'primary' as const
    },
    {
      icon: <MdCalendarMonth />,
      label: 'Aulas / Horas no Ano',
      value: `${data?.yearlyLessonsCount ?? 0} aulas`,
      hours: `${data?.yearlyWorkloadHours ?? 0}h`,
      color: 'secondary' as const
    },
  ];

  const currentStats: LessonStatusStat[] = chartMode === 'monthly'
    ? (data?.monthlyLessonStatusStats || [])
    : (data?.yearlyLessonStatusStats || []);

  const chartData = currentStats
    .filter((s: LessonStatusStat) => s.count > 0)
    .map((s: LessonStatusStat) => ({
      name: s.label,
      value: s.count,
      hours: s.hours,
      percentage: s.percentage,
      color: STATUS_COLORS[s.status] || '#7C3AED'
    }));

  const subjectChartData = (data?.subjectStats || [])
    .filter(s => s.studentCount > 0)
    .map((s, idx) => ({
      name: s.subjectName,
      value: s.studentCount,
      color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
    }));

  const effRate = effMode === 'monthly'
    ? (data?.monthlyEffectivenessRate ?? 100)
    : (data?.yearlyEffectivenessRate ?? 100);

  const effChartData = [
    { name: 'Aulas Dadas', value: effRate, color: '#10B981' },
    { name: 'Não Dadas / Faltas', value: Math.max(0, 100 - effRate), color: 'rgba(239, 68, 68, 0.2)' }
  ];

  const today = new Date();
  const todayDay = today.getDate();
  const todaysBirthdays = data?.birthdayStudents?.filter(
    b => b.birthDay === todayDay
  ) || [];

  const todayFormatted = format(today, "EEEE, dd/MM", { locale: ptBR });
  const todayTitle = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <div className="dashboard animate-fadeIn">
      {/* 1. Card PRIMEIRO: Aulas de Hoje */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <Card variant="elevated" className="animate-slideUp stagger-1">
          <div className="card-section-header">
            <MdAccessTime /> <h3>{todayTitle}</h3>
          </div>

          {todaysBirthdays.length > 0 && (
            <div 
              className="birthday-reminder-banner animate-slideDown"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '12px var(--space-md)',
                marginBottom: 'var(--space-md)',
                color: 'var(--text-primary)',
              }}
            >
              <span style={{ fontSize: '24px' }}>🎉</span>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--accent-primary)', fontWeight: 800 }}>
                  Aniversariante(s) do Dia!
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Hoje é o aniversário de:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {todaysBirthdays.map(b => `${b.studentName} (${b.age} ${b.age === 1 ? 'ano' : 'anos'})`).join(', ')}
                  </strong>
                  . Não se esqueça de dar os parabéns! 🎂🎈
                </span>
              </div>
            </div>
          )}

          <div className="lesson-list">
            {data?.todayLessons.length === 0 ? (
              <div className="empty-lessons-wrapper">
                <p className="empty-text font-bold">Nenhuma aula agendada para hoje!!</p>
                {data?.nextUpcomingLesson && (
                  <p className="next-lesson-text">
                    Sua próxima aula será em:{' '}
                    <span className="next-lesson-highlight">
                      {format(new Date(data.nextUpcomingLesson.scheduledAt), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              data?.todayLessons.map(lesson => {
                const startTime = new Date(lesson.scheduledAt);
                const endTime = new Date(startTime.getTime() + (lesson.durationMinutes || 60) * 60000);
                const timeRangeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;

                return (
                  <div
                    key={lesson.id}
                    className={`lesson-item animate-fadeIn status-${lesson.status}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px var(--space-md)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/students/${lesson.studentId}`);
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Ver perfil do aluno"
                      >
                        <Avatar name={lesson.studentName || ''} size="md" shape="square" />
                      </div>

                      <div className="lesson-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/students/${lesson.studentId}`);
                            }}
                            style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px', textDecoration: 'none', cursor: 'pointer' }}
                            title="Ver perfil do aluno"
                          >
                            {lesson.studentName}
                          </span>
                          {lesson.subjectName && <Badge variant="primary">{lesson.subjectName}</Badge>}
                          {lesson.levelName && <Badge variant="secondary">{lesson.levelName}</Badge>}
                        </div>

                        {lesson.title && <p className="lesson-title" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{lesson.title}</p>}
                      </div>
                    </div>

                    <div className="lesson-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <Badge variant={lesson.status === 'completed' ? 'success' : lesson.status === 'cancelled' ? 'danger' : lesson.status === 'holiday' ? 'warning' : 'info'}>
                        {timeRangeStr}
                      </Badge>
                      <button
                        className="icon-btn"
                        onClick={(e) => handleOpenEditLesson(lesson as any, e)}
                        title="Editar status/observações da aula"
                        style={{ padding: '6px', fontSize: '18px', color: 'var(--accent-primary)', cursor: 'pointer', background: 'transparent', border: 'none' }}
                      >
                        <MdEdit />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* 2. Seção de Alunos */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">👥 Gestão de Alunos</h3>
          <button
            className="toggle-visibility-btn"
            onClick={() => setShowStudentsSection(!showStudentsSection)}
            title={showStudentsSection ? "Ocultar seção de alunos" : "Mostrar seção de alunos"}
          >
            {showStudentsSection ? <MdVisibility /> : <MdVisibilityOff />}
          </button>
        </div>

        {showStudentsSection && (
          <>
            <div className="stats-grid">
              {studentStats.map((stat, i) => (
                <Card key={stat.label + '-' + i} variant="elevated" accentColor={stat.color} className={`stat-card animate-slideUp stagger-${i + 1}`}>
                  <div className="stat-icon-wrap" data-color={stat.color}>{stat.icon}</div>
                  <div className="stat-info">
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value">{stat.value}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="dashboard-grid" style={{ marginTop: 'var(--space-md)' }}>
              {/* Subjects stats Card with PieChart */}
              <Card variant="elevated" className="animate-slideUp stagger-2">
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

              {/* Birthdays Card */}
              <Card variant="elevated" className="animate-slideUp stagger-3">
                <div className="card-section-header">
                  <MdCake className="birthday-header-icon" /> <h3>Aniversariantes do Mês</h3>
                </div>
                <div className="birthday-list">
                  {data?.birthdayStudents.length === 0 ? (
                    <p className="empty-text">Nenhum aniversariante este mês</p>
                  ) : (
                    data?.birthdayStudents.map(b => (
                      <div key={b.studentId} className="birthday-item animate-fadeIn">
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
          </>
        )}
      </div>

      {/* 3. Seção do Professor */}
      <div className="dashboard-section" style={{ marginTop: 'var(--space-xl)' }}>
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">⏱️ Ensino & Carga Horária do Professor</h3>
          <button
            className="toggle-visibility-btn"
            onClick={() => setShowTeacherSection(!showTeacherSection)}
            title={showTeacherSection ? "Ocultar seção do professor" : "Mostrar seção do professor"}
          >
            {showTeacherSection ? <MdVisibility /> : <MdVisibilityOff />}
          </button>
        </div>

        {showTeacherSection && (
          <>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {teacherStats.map((stat, i) => (
                <Card key={stat.label + '-' + i} variant="elevated" accentColor={stat.color} className={`stat-card animate-slideUp stagger-${i + 1}`}>
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
              {/* Card do Gráfico de Rosca de Distribuição de Status */}
              <Card variant="elevated" className="animate-slideUp stagger-4">
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

              {/* Card de Gráfico Único de Efetividade de Aulas Dadas */}
              <Card variant="elevated" className="animate-slideUp stagger-5">
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
          </>
        )}
      </div>

      {/* Edit Lesson Modal */}
      {selectedLesson && (
        <Modal
          isOpen={lessonModalOpen}
          onClose={() => setLessonModalOpen(false)}
          title="Editar Detalhes da Aula"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setLessonModalOpen(false)}>Cancelar</Button>
              <Button isLoading={savingLesson} onClick={handleSaveLesson}>Salvar Alterações</Button>
            </>
          }
        >
          <div className="lesson-details-form">
            <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="detail-label" style={{ color: 'var(--text-muted)' }}>Aluno:</span>
              <strong className="detail-value" style={{ color: 'var(--text-primary)' }}>{selectedLesson.studentName}</strong>
            </div>
            <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="detail-label" style={{ color: 'var(--text-muted)' }}>Data/Hora:</span>
              <span className="detail-value" style={{ color: 'var(--text-primary)' }}>
                {format(new Date(selectedLesson.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label className="input-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Status da Aula</label>
              <div className="status-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                <button
                  type="button"
                  className={`status-opt opt-scheduled ${lessonStatus === 'scheduled' ? 'active' : ''}`}
                  onClick={() => setLessonStatus('scheduled')}
                >
                  <MdSchedule /> Agendada
                </button>
                <button
                  type="button"
                  className={`status-opt opt-completed ${lessonStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => setLessonStatus('completed')}
                >
                  <MdCheckCircle /> Concluída
                </button>
                <button
                  type="button"
                  className={`status-opt opt-cancelled ${lessonStatus === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setLessonStatus('cancelled')}
                >
                  <MdCancel /> Cancelada
                </button>
                <button
                  type="button"
                  className={`status-opt opt-holiday ${lessonStatus === 'holiday' ? 'active' : ''}`}
                  onClick={() => setLessonStatus('holiday')}
                >
                  <MdSchool /> Feriado
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Anotações / Resumo da Aula</label>
              <textarea
                className="input-field textarea-field"
                placeholder="Ex: Aluno com bom desempenho, observações importantes..."
                value={lessonNotes}
                onChange={e => setLessonNotes(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
