import { useEffect, useState } from 'react';
import { startOfWeek, addDays, format, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MdChevronLeft, MdChevronRight, MdSchedule, MdCheckCircle, MdCancel, MdSchool } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { lessonService } from '../../services/dataServices';
import type { Lesson } from '../../types';
import toast from 'react-hot-toast';
import './Schedule.css';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lessonStatus, setLessonStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'holiday'>('scheduled');
  const [lessonNotes, setLessonNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const startOfSelectedWeek = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday

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
  }, [currentWeek]);

  const handlePrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonStatus(lesson.status);
    setLessonNotes(lesson.notes || '');
    setModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;
    setSaving(true);
    try {
      await lessonService.update(selectedLesson.id, {
        status: lessonStatus,
        notes: lessonNotes
      });
      toast.success('Aula atualizada!');
      setModalOpen(false);
      loadLessons();
    } catch {
      toast.error('Erro ao atualizar a aula.');
    }
    setSaving(false);
  };

  return (
    <div className="schedule-page animate-fadeIn">
      <div className="page-toolbar">
        <div className="week-navigation">
          <Button variant="outline" size="sm" onClick={handlePrevWeek} icon={<MdChevronLeft />} />
          <Button variant="outline" size="sm" onClick={handleToday}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek} icon={<MdChevronRight />} />
          <span className="week-range-text">
            {format(startOfSelectedWeek, "dd 'de' MMM", { locale: ptBR })} - {format(addDays(startOfSelectedWeek, 6), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div className="calendar-container">
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
                    // Find lessons starting in this specific hour on this day
                    const dayLessons = lessons.filter(l => {
                      const lDate = new Date(l.scheduledAt);
                      return isSameDay(lDate, dayDate) && lDate.getHours() === hour;
                    });

                    return (
                      <div key={dayIdx} className="grid-cell">
                        {dayLessons.map(lesson => {
                          const timeStr = format(new Date(lesson.scheduledAt), 'HH:mm');
                          return (
                            <div
                              key={lesson.id}
                              className={`lesson-card-item status-${lesson.status}`}
                              onClick={() => handleLessonClick(lesson)}
                              title={`${lesson.studentName} - ${timeStr}`}
                            >
                              <div className="lesson-time">{timeStr} ({lesson.durationMinutes}m)</div>
                              <div className="lesson-student">{lesson.studentName}</div>
                              {lesson.notes && <div className="lesson-has-notes">📝 Observação</div>}
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
            <div className="detail-row">
              <span className="detail-label">Data/Hora:</span>
              <span className="detail-value">
                {format(new Date(selectedLesson.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
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
