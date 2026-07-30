import { useEffect, useState } from 'react';
import { startOfWeek, addDays, format, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MdChevronLeft, MdChevronRight, MdSchedule, MdCheckCircle, MdCancel, MdSchool } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { lessonService } from '../../services/dataServices';
import type { Lesson } from '../../types';
import toast from 'react-hot-toast';
import './Schedule.css';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [densityMode, setDensityMode] = useState<'normal' | 'compact'>('compact');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lessonStatus, setLessonStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'holiday'>('scheduled');
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonStartTime, setLessonStartTime] = useState('');
  const [lessonEndTime, setLessonEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  const startOfSelectedWeek = startOfWeek(viewMode === 'week' ? currentWeek : selectedDay, { weekStartsOn: 1 }); // Monday

  const loadLessons = async () => {
    setLoading(true);
    try {
      const dateStr = format(startOfSelectedWeek, 'yyyy-MM-dd');
      const res = await lessonService.getByWeek(dateStr);
      setLessons(res.data);
    } catch {
      toast.error('Erro ao carregar as aulas.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLessons();
  }, [currentWeek, selectedDay, viewMode]);

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setSelectedDay(addDays(selectedDay, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentWeek(addWeeks(currentWeek, 1));
    } else {
      setSelectedDay(addDays(selectedDay, 1));
    }
  };

  const handleToday = () => {
    if (viewMode === 'week') {
      setCurrentWeek(new Date());
    } else {
      setSelectedDay(new Date());
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonStatus(lesson.status);
    setLessonNotes(lesson.notes || '');

    const sTime = new Date(lesson.scheduledAt);
    const eTime = new Date(sTime.getTime() + (lesson.durationMinutes || 60) * 60000);

    setLessonDate(format(sTime, 'yyyy-MM-dd'));
    setLessonStartTime(format(sTime, 'HH:mm'));
    setLessonEndTime(format(eTime, 'HH:mm'));

    setModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;
    setSaving(true);

    const [startH, startM] = lessonStartTime.split(':').map(Number);
    const [endH, endM] = lessonEndTime.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;
    let diffMinutes = endTotalMinutes - startTotalMinutes;
    if (diffMinutes <= 0) diffMinutes = 60;

    const newScheduledAt = `${lessonDate}T${lessonStartTime}:00`;

    try {
      await lessonService.update(selectedLesson.id, {
        status: lessonStatus,
        notes: lessonNotes,
        scheduledAt: newScheduledAt,
        durationMinutes: diffMinutes
      });
      toast.success('Aula atualizada!');
      setModalOpen(false);
      loadLessons();
    } catch {
      toast.error('Erro ao atualizar a aula.');
    }
    setSaving(false);
  };

  // Lessons for selected day in Day View
  const dayLessonsList = lessons.filter(l => isSameDay(new Date(l.scheduledAt), selectedDay));

  return (
    <div className="schedule-page animate-fadeIn">
      <div className="page-toolbar flex-header">
        {/* Navigation Controls */}
        <div className="week-navigation">
          <Button variant="outline" size="sm" onClick={handlePrev} icon={<MdChevronLeft />} />
          <Button variant="outline" size="sm" onClick={handleToday}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={handleNext} icon={<MdChevronRight />} />
          
          <span className="week-range-text">
            {viewMode === 'week' ? (
              `${format(startOfSelectedWeek, "dd 'de' MMM", { locale: ptBR })} - ${format(addDays(startOfSelectedWeek, 6), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`
            ) : (
              format(selectedDay, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            )}
          </span>
        </div>

        {/* View Mode Switcher Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Dia
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Semana
            </button>
          </div>

          {viewMode === 'week' && (
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${densityMode === 'normal' ? 'active' : ''}`}
                onClick={() => setDensityMode('normal')}
              >
                Normal
              </button>
              <button
                className={`view-mode-btn ${densityMode === 'compact' ? 'active' : ''}`}
                onClick={() => setDensityMode('compact')}
              >
                Compacto
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'week' ? (
        <div className={`calendar-container ${densityMode === 'compact' ? 'compact-mode' : ''}`}>
          {/* Days Header */}
          <div className="calendar-header-grid">
            <div className="time-col-header">Horário</div>
            {Array.from({ length: 7 }).map((_, idx) => {
              const dayDate = addDays(startOfSelectedWeek, idx);
              const isToday = isSameDay(dayDate, new Date());
              return (
                <div key={idx} className={`day-header ${isToday ? 'today-highlight' : ''}`}>
                  <span className="day-name">{format(dayDate, 'ccc', { locale: ptBR })}</span>
                  <span className="day-number">{format(dayDate, 'dd')}</span>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="calendar-grid">
            {loading ? (
              <div className="grid-loading"><span className="loading-spinner" /></div>
            ) : (
              <>
                {/* Time Rows */}
                {HOURS.map(hour => (
                  <div key={hour} className="grid-row">
                    <div className="time-label">{String(hour).padStart(2, '0')}:00</div>
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const dayDate = addDays(startOfSelectedWeek, dayIdx);
                      const dayLessons = lessons.filter(l => {
                        const lDate = new Date(l.scheduledAt);
                        return isSameDay(lDate, dayDate) && lDate.getHours() === hour;
                      });

                      return (
                        <div key={dayIdx} className="grid-cell">
                          {dayLessons.map(lesson => {
                            const startTime = new Date(lesson.scheduledAt);
                            const endTime = new Date(startTime.getTime() + (lesson.durationMinutes || 60) * 60000);
                            const rangeStr = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
                            
                            const tooltipText = [
                              `Aluno: ${lesson.studentName || ''}`,
                              lesson.subjectName ? `Matéria: ${lesson.subjectName} ${lesson.levelName ? `(${lesson.levelName})` : ''}` : '',
                              `Horário: ${rangeStr}`,
                              `Status: ${lesson.status === 'completed' ? 'Concluída' : lesson.status === 'cancelled' ? 'Cancelada' : lesson.status === 'holiday' ? 'Feriado' : 'Agendada'}`,
                              lesson.notes ? `Observações: ${lesson.notes}` : ''
                            ].filter(Boolean).join('\n');

                            return (
                              <div
                                key={lesson.id}
                                className={`lesson-card-item status-${lesson.status}`}
                                onClick={() => handleLessonClick(lesson)}
                                title={tooltipText}
                              >
                                <div className="lesson-time">{rangeStr}</div>
                                <div className="lesson-student-name desktop-only">{lesson.studentName}</div>
                                <div className="lesson-student-initials mobile-only">{getInitials(lesson.studentName)}</div>
                                <div className="compact-student-initials">{getInitials(lesson.studentName)}</div>
                                {lesson.notes && <div className="lesson-has-notes">📝</div>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Day View Container */
        <div className="day-view-container">
          {loading ? (
            <div className="grid-loading"><span className="loading-spinner" /></div>
          ) : dayLessonsList.length === 0 ? (
            <div className="empty-day-message">
              <MdSchool style={{ fontSize: '32px', color: 'var(--text-muted)' }} />
              <p>Nenhuma aula agendada para {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}.</p>
            </div>
          ) : (
            <div className="day-lessons-list">
              {dayLessonsList
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map(lesson => {
                  const startTime = new Date(lesson.scheduledAt);
                  const endTime = new Date(startTime.getTime() + lesson.durationMinutes * 60000);
                  return (
                    <div
                      key={lesson.id}
                      className={`day-lesson-card status-${lesson.status}`}
                      onClick={() => handleLessonClick(lesson)}
                    >
                      <div className="day-lesson-time">
                        <strong>{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</strong>
                      </div>
                      <div className="day-lesson-info">
                        <div className="day-lesson-avatar">{getInitials(lesson.studentName)}</div>
                        <div>
                          <h4 className="day-lesson-student">{lesson.studentName}</h4>
                          {lesson.notes && <p className="day-lesson-notes">📝 {lesson.notes}</p>}
                        </div>
                      </div>
                      <div className="day-lesson-badge-wrap">
                        <span className={`status-pill pill-${lesson.status}`}>
                          {lesson.status === 'completed' ? 'Concluída' : lesson.status === 'cancelled' ? 'Cancelada' : lesson.status === 'holiday' ? 'Feriado' : 'Agendada'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Edit Lesson Modal */}
      {selectedLesson && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Editar Detalhes da Aula"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button isLoading={saving} onClick={handleSaveLesson}>Salvar Alterações</Button>
            </>
          }
        >
          <div className="lesson-details-form">
            <div className="detail-row">
              <span className="detail-label">Aluno:</span>
              <strong className="detail-value">{selectedLesson.studentName}</strong>
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <Input
                label="Data *"
                type="date"
                value={lessonDate}
                onChange={e => setLessonDate(e.target.value)}
                required
              />
              <Input
                label="Início *"
                type="time"
                value={lessonStartTime}
                onChange={e => setLessonStartTime(e.target.value)}
                required
              />
              <Input
                label="Fim *"
                type="time"
                value={lessonEndTime}
                onChange={e => setLessonEndTime(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Status da Aula</label>
              <div className="status-selector">
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
              <label className="input-label">Anotações da Aula</label>
              <textarea
                className="input-field textarea-field"
                placeholder="Ex: Aluno com dificuldades em frações, deixar exercícios para casa..."
                value={lessonNotes}
                onChange={e => setLessonNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
