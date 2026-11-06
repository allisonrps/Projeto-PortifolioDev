import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdAccessTime, MdEdit, MdSchedule, MdCancel, MdCheckCircle, MdSchool,
  MdCake, MdTaskAlt, MdAttachMoney, MdAssignmentTurnedIn, MdOpenInNew, MdNotificationsActive,
  MdHistory
} from 'react-icons/md';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { dashboardService, lessonService } from '../../services/dataServices';
import type { DashboardData, Lesson } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Lesson Modal state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonStatus, setLessonStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'holiday'>('scheduled');
  const [lessonNotes, setLessonNotes] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [correctionsModalOpen, setCorrectionsModalOpen] = useState(false);
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [completedActivitiesModalOpen, setCompletedActivitiesModalOpen] = useState(false);
  const [pendingPaymentsModalOpen, setPendingPaymentsModalOpen] = useState(false);

  // Local storage state for tracking viewed completed activities
  const [viewedActivityIds, setViewedActivityIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('aura_viewed_activity_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Check for unviewed completed activities
  const unviewedCompletedActivities = data?.completedActivities?.filter(
    act => !viewedActivityIds.includes(act.studentActivityId)
  ) || [];
  const hasUnviewedActivities = unviewedCompletedActivities.length > 0;

  const handleOpenCompletedActivities = () => {
    setCompletedActivitiesModalOpen(true);
    if (data?.completedActivities && data.completedActivities.length > 0) {
      const allIds = data.completedActivities.map(a => a.studentActivityId);
      const updated = Array.from(new Set([...viewedActivityIds, ...allIds]));
      setViewedActivityIds(updated);
      try {
        localStorage.setItem('aura_viewed_activity_ids', JSON.stringify(updated));
      } catch {}
    }
  };

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
      dashboardService.get().then(r => setData(r.data));
    } catch {
      toast.error('Erro ao atualizar a aula.');
    }
    setSavingLesson(false);
  };

  useEffect(() => {
    setLoading(true);
    dashboardService.get()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="page-loading"><span className="loading-spinner" /></div>;

  const today = new Date();
  const todayDay = today.getDate();
  const todaysBirthdays = data?.birthdayStudents?.filter(
    b => b.birthDay === todayDay
  ) || [];

  const todayFormatted = format(today, "EEEE, dd/MM", { locale: ptBR });
  const todayTitle = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <div className="dashboard animate-fadeIn">
      {/* 5 Quadradinhos de Lembretes */}
      <div className="dashboard-reminders-grid animate-slideDown">
        {/* 1. Aniversariantes do Dia */}
        <div 
          className={`reminder-square-card ${todaysBirthdays.length > 0 ? 'has-items' : ''}`}
          onClick={() => setBirthdayModalOpen(true)}
          title="Ver aniversariantes do dia"
        >
          <div className="reminder-header-row">
            <div className="reminder-icon-badge reminder-icon-birthday">
              <MdCake />
            </div>
            <span className={`reminder-count ${todaysBirthdays.length > 0 ? 'active-birthday' : ''}`}>
              {todaysBirthdays.length}
            </span>
          </div>
          <span className="reminder-title">Aniversariantes</span>
          <span className="reminder-subtitle">Hoje</span>
        </div>

        {/* 2. Tarefas Feitas (Entregues) */}
        <div 
          className={`reminder-square-card ${(data?.completedActivities?.length || 0) > 0 ? 'has-items' : ''}`}
          onClick={handleOpenCompletedActivities}
          title="Ver tarefas entregues neste mês"
        >
          {hasUnviewedActivities && (
            <div className="reminder-notification-pill" title="Nova atividade entregue!">
              <MdNotificationsActive /> Nova
            </div>
          )}
          <div className="reminder-header-row">
            <div className="reminder-icon-badge reminder-icon-completed">
              <MdTaskAlt />
            </div>
            <span className={`reminder-count ${(data?.completedActivities?.length || 0) > 0 ? 'active-completed' : ''}`}>
              {data?.completedActivities?.length || 0}
            </span>
          </div>
          <span className="reminder-title">Tarefas Feitas</span>
          <span className="reminder-subtitle">Neste mês</span>
        </div>

        {/* 3. Pagamentos Pendentes do Mês */}
        <div 
          className={`reminder-square-card ${(data?.pendingPayments?.length || 0) > 0 ? 'has-items' : ''}`}
          onClick={() => setPendingPaymentsModalOpen(true)}
          title="Ver mensalidades pendentes deste mês"
        >
          <div className="reminder-header-row">
            <div className="reminder-icon-badge reminder-icon-payments">
              <MdAttachMoney />
            </div>
            <span className={`reminder-count ${(data?.pendingPayments?.length || 0) > 0 ? 'active-payments' : ''}`}>
              {data?.pendingPayments?.length || 0}
            </span>
          </div>
          <span className="reminder-title">Pagamentos</span>
          <span className="reminder-subtitle">Pendentes</span>
        </div>

        {/* 4. Tarefas para Corrigir */}
        <div 
          className={`reminder-square-card ${(data?.pendingCorrections?.length || 0) > 0 ? 'has-items' : ''}`}
          onClick={() => setCorrectionsModalOpen(true)}
          title="Ver tarefas aguardando correção"
        >
          <div className="reminder-header-row">
            <div className="reminder-icon-badge reminder-icon-corrections">
              <MdAssignmentTurnedIn />
            </div>
            <span className={`reminder-count ${(data?.pendingCorrections?.length || 0) > 0 ? 'active-corrections' : ''}`}>
              {data?.pendingCorrections?.length || 0}
            </span>
          </div>
          <span className="reminder-title">Para Corrigir</span>
          <span className="reminder-subtitle">Aguardando nota</span>
        </div>

        {/* 5. Aulas por Completar */}
        <div 
          className={`reminder-square-card ${(data?.pendingPreviousLessons?.length || 0) > 0 ? 'has-items' : ''}`}
          onClick={() => setPendingModalOpen(true)}
          title="Ver aulas de dias anteriores a completar"
        >
          <div className="reminder-header-row">
            <div className="reminder-icon-badge reminder-icon-lessons">
              <MdSchedule />
            </div>
            <span className={`reminder-count ${(data?.pendingPreviousLessons?.length || 0) > 0 ? 'active-lessons' : ''}`}>
              {data?.pendingPreviousLessons?.length || 0}
            </span>
          </div>
          <span className="reminder-title">Aulas a Completar</span>
          <span className="reminder-subtitle">Pendentes</span>
        </div>
      </div>

      {/* 1. Seção: Aulas de Hoje / Próxima Aula (Cards Individuais) */}
      <div className="dashboard-lessons-section animate-slideUp stagger-1" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-section-header" style={{ marginBottom: '12px' }}>
          <MdAccessTime /> <h3>{todayTitle}</h3>
        </div>

        <div className="lesson-list">
          {data?.todayLessons.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Nenhuma aula agendada para hoje!!
              </p>
              {data?.nextUpcomingLesson && (
                <div style={{ width: '100%', textAlign: 'left', marginTop: '4px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdSchedule style={{ color: 'var(--warning)' }} /> Próxima aula agendada:
                  </div>
                  {(() => {
                    const lesson = data.nextUpcomingLesson;
                    const startTime = new Date(lesson.scheduledAt);
                    const timeRangeStr = format(startTime, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
                    const timeRangeSimplified = format(startTime, "dd/MM 'às' HH:mm", { locale: ptBR });

                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-item animate-fadeIn status-${lesson.status}`}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => handleOpenEditLesson(lesson as any, e)}
                      >
                        {/* LAYOUT DESKTOP */}
                        <div className="lesson-item-desktop-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
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
                                  style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px', textDecoration: 'none', cursor: 'pointer' }}
                                  title="Ver perfil do aluno"
                                >
                                  {lesson.studentName}
                                </span>
                                {lesson.subjectName && <Badge variant="primary">{lesson.subjectName}</Badge>}
                                {lesson.levelName && <Badge variant="secondary">{lesson.levelName}</Badge>}
                              </div>
                              {lesson.title && <p className="lesson-title" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{lesson.title}</p>}

                              {/* Rodapé discreto da última aula */}
                              <div className="lesson-last-class-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', opacity: 0.85 }}>
                                <MdHistory style={{ fontSize: '13px', opacity: 0.75, flexShrink: 0 }} />
                                <span>
                                  Última aula:{' '}
                                  {lesson.lastLessonDate ? (
                                    <>
                                      <strong style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        {format(new Date(lesson.lastLessonDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                      </strong>
                                      {[lesson.lastLessonTitle, lesson.lastLessonNotes ? `Obs: ${lesson.lastLessonNotes}` : null].filter(Boolean).join(' • ') ? ` • ${[lesson.lastLessonTitle, lesson.lastLessonNotes ? `Obs: ${lesson.lastLessonNotes}` : null].filter(Boolean).join(' • ')}` : ''}
                                    </>
                                  ) : (
                                    <span style={{ fontStyle: 'italic' }}>Nenhuma aula anterior</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="lesson-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <Badge variant="warning">
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

                        {/* LAYOUT MOBILE */}
                        <div className="lesson-item-mobile-layout" style={{ width: '100%', gap: '8px' }}>
                          <div className="lesson-item-mobile-line-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/students/${lesson.studentId}`);
                              }}
                              style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px', textDecoration: 'none', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                              title="Ver perfil do aluno"
                            >
                              {lesson.studentName}
                            </span>
                            <Badge variant="warning">
                              {timeRangeSimplified}
                            </Badge>
                          </div>

                          <div className="lesson-item-mobile-line-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {lesson.subjectName && <Badge variant="primary">{lesson.subjectName}</Badge>}
                              {lesson.levelName && <Badge variant="secondary">{lesson.levelName}</Badge>}
                            </div>
                            <button
                              className="icon-btn"
                              onClick={(e) => handleOpenEditLesson(lesson as any, e)}
                              title="Editar status/observações da aula"
                              style={{ padding: '6px', fontSize: '18px', color: 'var(--accent-primary)', cursor: 'pointer', background: 'transparent', border: 'none' }}
                            >
                              <MdEdit />
                            </button>
                          </div>

                          {/* Rodapé discreto da última aula (Mobile) */}
                          <div className="lesson-last-class-footer-mobile" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', opacity: 0.85 }}>
                            <MdHistory style={{ fontSize: '12px', opacity: 0.75, flexShrink: 0 }} />
                            <span>
                              Última aula:{' '}
                              {lesson.lastLessonDate ? (
                                <>
                                  <strong style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    {format(new Date(lesson.lastLessonDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                  </strong>
                                  {[lesson.lastLessonTitle, lesson.lastLessonNotes ? `Obs: ${lesson.lastLessonNotes}` : null].filter(Boolean).join(' • ') ? ` • ${[lesson.lastLessonTitle, lesson.lastLessonNotes ? `Obs: ${lesson.lastLessonNotes}` : null].filter(Boolean).join(' • ')}` : ''}
                                </>
                              ) : (
                                <span style={{ fontStyle: 'italic' }}>Nenhuma aula anterior</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            data?.todayLessons.map(lesson => {
              const startTime = new Date(lesson.scheduledAt);
              const endTime = new Date(startTime.getTime() + (lesson.durationMinutes || 60) * 60000);
              const timeRangeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
              
              const startHour = startTime.getHours();
              const startMin = startTime.getMinutes();
              const endHour = endTime.getHours();
              const endMin = endTime.getMinutes();
              const startStr = startMin === 0 ? `${startHour}` : format(startTime, 'HH:mm');
              const endStr = endMin === 0 ? `${endHour}` : format(endTime, 'HH:mm');
              const timeRangeSimplified = `${startStr}-${endStr}h`;

              const lastDetails = [lesson.lastLessonTitle, lesson.lastLessonNotes ? `Obs: ${lesson.lastLessonNotes}` : null].filter(Boolean).join(' • ');

              return (
                <div
                  key={lesson.id}
                  className={`lesson-item animate-fadeIn status-${lesson.status}`}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleOpenEditLesson(lesson as any, e)}
                >
                  {/* LAYOUT DESKTOP */}
                  <div className="lesson-item-desktop-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
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
                            style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px', textDecoration: 'none', cursor: 'pointer' }}
                            title="Ver perfil do aluno"
                          >
                            {lesson.studentName}
                          </span>
                          {lesson.subjectName && <Badge variant="primary">{lesson.subjectName}</Badge>}
                          {lesson.levelName && <Badge variant="secondary">{lesson.levelName}</Badge>}
                        </div>
                        {lesson.title && <p className="lesson-title" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{lesson.title}</p>}

                        {/* Rodapé discreto da última aula */}
                        <div className="lesson-last-class-footer" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', opacity: 0.85 }}>
                          <MdHistory style={{ fontSize: '13px', opacity: 0.75, flexShrink: 0 }} />
                          <span>
                            Última aula:{' '}
                            {lesson.lastLessonDate ? (
                              <>
                                <strong style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  {format(new Date(lesson.lastLessonDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </strong>
                                {lastDetails ? ` • ${lastDetails}` : ''}
                              </>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Nenhuma aula anterior</span>
                            )}
                          </span>
                        </div>
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

                  {/* LAYOUT MOBILE */}
                  <div className="lesson-item-mobile-layout" style={{ width: '100%', gap: '8px' }}>
                    {/* Linha 1: Nome e Horário simplificado */}
                    <div className="lesson-item-mobile-line-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/students/${lesson.studentId}`);
                        }}
                        style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px', textDecoration: 'none', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                        title="Ver perfil do aluno"
                      >
                        {lesson.studentName}
                      </span>
                      <Badge variant={lesson.status === 'completed' ? 'success' : lesson.status === 'cancelled' ? 'danger' : lesson.status === 'holiday' ? 'warning' : 'info'}>
                        {timeRangeSimplified}
                      </Badge>
                    </div>

                    {/* Linha 2: Matéria, Nível e botão de ação */}
                    <div className="lesson-item-mobile-line-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {lesson.subjectName && <Badge variant="primary">{lesson.subjectName}</Badge>}
                        {lesson.levelName && <Badge variant="secondary">{lesson.levelName}</Badge>}
                      </div>
                      <button
                        className="icon-btn"
                        onClick={(e) => handleOpenEditLesson(lesson as any, e)}
                        title="Editar status/observações da aula"
                        style={{ padding: '6px', fontSize: '18px', color: 'var(--accent-primary)', cursor: 'pointer', background: 'transparent', border: 'none' }}
                      >
                        <MdEdit />
                      </button>
                    </div>

                    {/* Rodapé discreto da última aula (Mobile) */}
                    <div className="lesson-last-class-footer-mobile" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', opacity: 0.85 }}>
                      <MdHistory style={{ fontSize: '12px', opacity: 0.75, flexShrink: 0 }} />
                      <span>
                        Última aula:{' '}
                        {lesson.lastLessonDate ? (
                          <>
                            <strong style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {format(new Date(lesson.lastLessonDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </strong>
                            {lastDetails ? ` • ${lastDetails}` : ''}
                          </>
                        ) : (
                          <span style={{ fontStyle: 'italic' }}>Nenhuma aula anterior</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

      {/* Modal de Aulas Passadas Pendentes */}
      <Modal
        isOpen={pendingModalOpen}
        onClose={() => setPendingModalOpen(false)}
        title="Aulas Pendentes de Finalização"
        size="md"
        footer={<Button onClick={() => setPendingModalOpen(false)}>Fechar</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            As seguintes aulas de dias anteriores ainda estão com o status "Agendada". Você pode finalizar ou ajustar o status de cada uma delas abaixo para manter o seu histórico atualizado.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.pendingPreviousLessons.map(lesson => {
              const startTime = new Date(lesson.scheduledAt);
              return (
                <div
                  key={lesson.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{lesson.studentName}</strong>
                      {lesson.subjectName && <Badge variant="primary">{lesson.subjectName}</Badge>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Agendada para: {format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<MdEdit />}
                    onClick={() => handleOpenEditLesson(lesson as any)}
                  >
                    Finalizar
                  </Button>
                </div>
              );
            })}

            {data?.pendingPreviousLessons.length === 0 && (
              <p className="empty-text" style={{ textAlign: 'center', padding: '20px' }}>
                🎉 Ótimo trabalho! Nenhuma aula de dias anteriores pendente de finalização.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Atividades Pendentes de Correção */}
      <Modal
        isOpen={correctionsModalOpen}
        onClose={() => setCorrectionsModalOpen(false)}
        title="Atividades Aguardando Correção"
        size="md"
        footer={<Button onClick={() => setCorrectionsModalOpen(false)}>Fechar</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            As seguintes atividades foram enviadas pelos alunos e estão aguardando a sua correção. Clique em "Corrigir" para abrir a ficha do aluno correspondente.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.pendingCorrections && data.pendingCorrections.map(c => (
              <div
                key={c.studentActivityId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)' }}>{c.activityTitle}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Aluno: <strong>{c.studentName}</strong> {c.submittedAt && `— Enviado em ${format(new Date(c.submittedAt), 'dd/MM/yyyy HH:mm')}`}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setCorrectionsModalOpen(false);
                    navigate(`/students/${c.studentId}`);
                  }}
                >
                  Corrigir
                </Button>
              </div>
            ))}

            {(!data?.pendingCorrections || data.pendingCorrections.length === 0) && (
              <p className="empty-text" style={{ textAlign: 'center', padding: '20px' }}>
                🎉 Nenhuma atividade pendente de correção no momento!
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Aniversariantes do Dia */}
      <Modal
        isOpen={birthdayModalOpen}
        onClose={() => setBirthdayModalOpen(false)}
        title="Aniversariantes do Dia"
        size="md"
        footer={<Button onClick={() => setBirthdayModalOpen(false)}>Fechar</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          {todaysBirthdays.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Hoje é dia de festa! Não se esqueça de parabenizar seus alunos aniversariantes de hoje:
              </p>
              {todaysBirthdays.map(b => (
                <div
                  key={b.studentId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🎂</div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>{b.studentName}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        Completando {b.age} {b.age === 1 ? 'ano' : 'anos'} hoje! 🎉
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBirthdayModalOpen(false);
                      navigate(`/students/${b.studentId}`);
                    }}
                  >
                    Ver Aluno
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text" style={{ textAlign: 'center', padding: '20px' }}>
              Nenhum aluno fazendo aniversário no dia de hoje.
            </p>
          )}
        </div>
      </Modal>

      {/* Modal de Tarefas Feitas / Entregues */}
      <Modal
        isOpen={completedActivitiesModalOpen}
        onClose={() => setCompletedActivitiesModalOpen(false)}
        title="Tarefas Feitas e Entregues"
        size="md"
        footer={<Button onClick={() => setCompletedActivitiesModalOpen(false)}>Fechar</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Atividades concluídas e entregues pelos alunos neste mês:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.completedActivities && data.completedActivities.length > 0 ? (
              data.completedActivities.map(act => (
                <div
                  key={act.studentActivityId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{act.activityTitle}</strong>
                      <Badge variant="success">
                        {act.grade !== null && act.grade !== undefined
                          ? `${act.grade % 1 === 0 ? act.grade.toFixed(0) : act.grade.toFixed(1)}/${act.maxGrade}`
                          : 'Entregue'}
                      </Badge>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                      Aluno: <strong style={{ color: 'var(--text-primary)' }}>{act.studentName}</strong>
                      {act.completedAt && ` • Entregue em: ${format(new Date(act.completedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Abrir atividade em nova aba"
                      onClick={() => window.open(`${window.location.origin}/quiz/${act.studentActivityId}`, '_blank')}
                    >
                      <MdOpenInNew />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setCompletedActivitiesModalOpen(false);
                        navigate(`/students/${act.studentId}`);
                      }}
                    >
                      Ver Aluno
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text" style={{ textAlign: 'center', padding: '20px' }}>
                Nenhuma tarefa entregue pelos alunos neste mês até o momento.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Pagamentos Pendentes do Mês */}
      <Modal
        isOpen={pendingPaymentsModalOpen}
        onClose={() => setPendingPaymentsModalOpen(false)}
        title="Mensalidades Pendentes do Mês"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--warning)' }}>
              Total: R$ {data?.pendingPayments?.reduce((acc, p) => acc + p.monthlyPrice, 0).toFixed(2) || '0.00'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setPendingPaymentsModalOpen(false);
                  navigate('/finance');
                }}
              >
                Ir para Financeiro
              </Button>
              <Button onClick={() => setPendingPaymentsModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Alunos ativos com mensalidade em aberto para o mês atual:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.pendingPayments && data.pendingPayments.length > 0 ? (
              data.pendingPayments.map(pay => (
                <div
                  key={pay.studentId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>{pay.studentName}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: 700 }}>
                      Mensalidade: R$ {pay.monthlyPrice.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPendingPaymentsModalOpen(false);
                      navigate(`/students/${pay.studentId}`);
                    }}
                  >
                    Ver Aluno
                  </Button>
                </div>
              ))
            ) : (
              <p className="empty-text" style={{ textAlign: 'center', padding: '20px' }}>
                🎉 Parabéns! Todas as mensalidades deste mês estão em dia.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
