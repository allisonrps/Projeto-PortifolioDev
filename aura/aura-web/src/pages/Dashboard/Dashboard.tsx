import { useEffect, useState } from 'react';
import { MdPeople, MdAccessTime, MdMenuBook, MdCake, MdPersonOff, MdSchool, MdPercent } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { dashboardService } from '../../services/dataServices';
import type { DashboardData } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './Dashboard.css';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.get()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="page-loading"><span className="loading-spinner" /></div>;

  const stats = [
    { icon: <MdPeople />, label: 'Total de Alunos', value: data?.totalStudents ?? 0, color: 'primary' as const },
    { icon: <MdPeople />, label: 'Alunos Ativos', value: data?.activeStudentsCount ?? 0, color: 'success' as const },
    { icon: <MdPersonOff />, label: 'Alunos Arquivados', value: data?.archivedStudentsCount ?? 0, color: 'danger' as const },
    { icon: <MdPercent />, label: 'Presença Total', value: `${data?.averageAttendanceRate ?? 100}%`, color: 'warning' as const },
    { icon: <MdSchool />, label: 'Matérias Ativas', value: data?.subjectStats.length ?? 0, color: 'secondary' as const },
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <Card key={stat.label + '-' + i} variant="elevated" accentColor={stat.color} className={`stat-card animate-slideUp stagger-${i + 1}`}>
            <div className="stat-icon-wrap" data-color={stat.color}>{stat.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Today's Lessons Card */}
        <Card variant="elevated" className="animate-slideUp stagger-5">
          <div className="card-section-header">
            <MdAccessTime /> <h3>Aulas de Hoje</h3>
          </div>
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
              data?.todayLessons.map(lesson => (
                <div key={lesson.id} className="lesson-item animate-fadeIn">
                  <div className="lesson-info">
                    <p className="lesson-student">{lesson.studentName}</p>
                    <p className="lesson-title">{lesson.title || 'Aula'}</p>
                  </div>
                  <div className="lesson-meta">
                    <Badge variant="info">{format(new Date(lesson.scheduledAt), "HH:mm", { locale: ptBR })}</Badge>
                    <span className="lesson-duration">{lesson.durationMinutes}min</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Birthdays and Subjects grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Birthdays Card */}
          <Card variant="elevated" className="animate-slideUp stagger-6">
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

          {/* Subjects stats Card */}
          <Card variant="elevated" className="animate-slideUp stagger-7">
            <div className="card-section-header">
              <MdMenuBook /> <h3>Distribuição de Alunos</h3>
            </div>
            <div className="subject-stats">
              {data?.subjectStats.length === 0 && <p className="empty-text">Nenhuma matéria cadastrada</p>}
              {data?.subjectStats.map(stat => (
                <div key={stat.subjectId} className="subject-stat-item">
                  <span className="subject-name">{stat.subjectName}</span>
                  <div className="subject-count-bar">
                    <div className="subject-count-fill" style={{ width: `${Math.min(100, (stat.studentCount / Math.max(data?.totalStudents ?? 1, 1)) * 100)}%` }} />
                  </div>
                  <span className="subject-count">{stat.studentCount}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
