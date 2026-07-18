import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MdArrowBack, MdSchool, MdPayment, MdAssignment, MdCalendarToday,
  MdSchedule, MdDelete, MdAdd, MdEdit, MdCheckCircle, MdCancel, MdPercent, MdAttachMoney
} from 'react-icons/md';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { studentService } from '../../services/studentService';
import { scheduleService, lessonService, paymentService, examService, exerciseService } from '../../services/dataServices';
import type { StudentDetail, ScheduleEntry, Lesson, Exam, Exercise } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './StudentDetail.css';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const initialTab = (location.state as any)?.activeTab || 'lessons';
  const [tab, setTab] = useState<'lessons' | 'schedules' | 'payments' | 'exams' | 'exercises'>(initialTab);

  // Year filter for payments
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());

  // Edit Monthly Price state
  const [editingPrice, setEditingPrice] = useState(false);
  const [monthlyPriceInput, setMonthlyPriceInput] = useState('0');
  const [savingPrice, setSavingPrice] = useState(false);

  // Lesson Modal state
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonStatus, setLessonStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'holiday'>('scheduled');
  const [lessonNotes, setLessonNotes] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);

  // Schedule Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Exam Modal state
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [examGrade, setExamGrade] = useState('');
  const [examMaxGrade, setExamMaxGrade] = useState('10');
  const [savingExam, setSavingExam] = useState(false);

  // Exercise Modal state
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseTitle, setExerciseTitle] = useState('');
  const [exerciseDate, setExerciseDate] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [exerciseGrade, setExerciseGrade] = useState('');
  const [exerciseMaxGrade, setExerciseMaxGrade] = useState('10');
  const [savingExercise, setSavingExercise] = useState(false);

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      studentService.getById(id),
      scheduleService.getByStudent(id)
    ]).then(([studentRes, scheduleRes]) => {
      setStudent(studentRes.data);
      setMonthlyPriceInput(String(studentRes.data.monthlyPrice || 0));
      setSchedules(scheduleRes.data);
    }).catch(() => navigate('/students'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <div className="page-loading"><span className="loading-spinner" /></div>;
  if (!student) return null;

  // Calculate Attendance Rate
  const completedCount = student.lessons.filter(l => l.status === 'completed').length;
  const cancelledCount = student.lessons.filter(l => l.status === 'cancelled').length;
  const totalAtts = completedCount + cancelledCount;
  const attendanceRate = totalAtts > 0 ? Math.round((completedCount / totalAtts) * 100) : 100;

  // Monthly Price update handler
  const handleSaveMonthlyPrice = async () => {
    setSavingPrice(true);
    try {
      const price = parseFloat(monthlyPriceInput);
      await studentService.update(student.id, { monthlyPrice: price });
      toast.success('Mensalidade atualizada!');
      setEditingPrice(false);
      loadData();
    } catch {
      toast.error('Erro ao atualizar mensalidade.');
    }
    setSavingPrice(false);
  };

  // Lesson handlers
  const handleLessonClick = (lesson: Lesson) => {
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
      loadData();
    } catch {
      toast.error('Erro ao atualizar a aula.');
    }
    setSavingLesson(false);
  };

  // Schedule handlers
  const openScheduleModal = (schedule?: ScheduleEntry) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setDayOfWeek(schedule.dayOfWeek);
      setStartTime(schedule.startTime.substring(0, 5));
      setEndTime(schedule.endTime.substring(0, 5));
      setValidFrom(schedule.validFrom ? schedule.validFrom.split('T')[0] : '');
      setValidUntil(schedule.validUntil ? schedule.validUntil.split('T')[0] : '');
    } else {
      setSelectedSchedule(null);
      setDayOfWeek(1);
      setStartTime('07:00');
      setEndTime('08:00');
      setValidFrom(new Date().toISOString().split('T')[0]);
      setValidUntil('');
    }
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    const body = {
      studentId: student.id,
      dayOfWeek,
      startTime: startTime + ':00',
      endTime: endTime + ':00',
      isRecurring: true,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: validUntil ? new Date(validUntil).toISOString() : null
    };
    try {
      if (selectedSchedule) {
        await scheduleService.update(selectedSchedule.id, body);
        toast.success('Horário atualizado e aulas futuras regeradas!');
      } else {
        await scheduleService.create(body);
        toast.success('Horário criado e aulas recorrentes geradas!');
      }
      setScheduleModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar horário.');
    }
    setSavingSchedule(false);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Excluir este horário semanal?')) return;
    try {
      await scheduleService.delete(scheduleId);
      toast.success('Horário excluído!');
      loadData();
    } catch {
      toast.error('Erro ao excluir horário.');
    }
  };

  // Payments handlers
  const handleTogglePayment = async (month: number) => {
    const payment = student.payments.find(p => p.month === month && p.year === paymentYear);
    if (payment) {
      // If paid, click deletes payment instantly
      try {
        await paymentService.delete(payment.id);
        toast.success('Pagamento removido!');
        loadData();
      } catch {
        toast.error('Erro ao remover pagamento.');
      }
    } else {
      // If unpaid, click creates payment
      try {
        await paymentService.create({
          studentId: student.id,
          month,
          year: paymentYear,
          amount: student.monthlyPrice,
          isPaid: true,
          paidAt: new Date().toISOString()
        });
        toast.success('Pagamento registrado com sucesso!');
        loadData();
      } catch {
        toast.error('Erro ao registrar pagamento.');
      }
    }
  };

  // Exam handlers
  const openExamModal = (exam?: Exam) => {
    if (exam) {
      setSelectedExam(exam);
      setExamTitle(exam.title);
      setExamDate(exam.scheduledAt.substring(0, 10));
      setExamNotes(exam.notes || '');
      setExamGrade(exam.grade != null ? String(exam.grade) : '');
      setExamMaxGrade(String(exam.maxGrade));
    } else {
      setSelectedExam(null);
      setExamTitle('');
      setExamDate(new Date().toISOString().substring(0, 10));
      setExamNotes('');
      setExamGrade('');
      setExamMaxGrade('10');
    }
    setExamModalOpen(true);
  };

  const handleSaveExam = async (e: FormEvent) => {
    e.preventDefault();
    setSavingExam(true);
    const body = {
      studentId: student.id,
      title: examTitle,
      scheduledAt: new Date(examDate).toISOString(),
      notes: examNotes,
      grade: examGrade ? parseFloat(examGrade) : undefined,
      maxGrade: parseFloat(examMaxGrade)
    };
    try {
      if (selectedExam) {
        await examService.update(selectedExam.id, body);
        toast.success('Prova atualizada!');
      } else {
        await examService.create(body);
        toast.success('Prova adicionada!');
      }
      setExamModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao salvar prova.');
    }
    setSavingExam(false);
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Deseja excluir esta prova?')) return;
    try {
      await examService.delete(examId);
      toast.success('Prova excluída!');
      loadData();
    } catch {
      toast.error('Erro ao excluir prova.');
    }
  };

  // Exercise handlers
  const openExerciseModal = (exercise?: Exercise) => {
    if (exercise) {
      setSelectedExercise(exercise);
      setExerciseTitle(exercise.title);
      setExerciseDate(exercise.scheduledAt.substring(0, 10));
      setExerciseNotes(exercise.notes || '');
      setExerciseGrade(exercise.grade != null ? String(exercise.grade) : '');
      setExerciseMaxGrade(String(exercise.maxGrade));
    } else {
      setSelectedExercise(null);
      setExerciseTitle('');
      setExerciseDate(new Date().toISOString().substring(0, 10));
      setExerciseNotes('');
      setExerciseGrade('');
      setExerciseMaxGrade('10');
    }
    setExerciseModalOpen(true);
  };

  const handleSaveExercise = async (e: FormEvent) => {
    e.preventDefault();
    setSavingExercise(true);
    const body = {
      studentId: student.id,
      title: exerciseTitle,
      scheduledAt: new Date(exerciseDate).toISOString(),
      notes: exerciseNotes,
      grade: exerciseGrade ? parseFloat(exerciseGrade) : undefined,
      maxGrade: parseFloat(exerciseMaxGrade)
    };
    try {
      if (selectedExercise) {
        await exerciseService.update(selectedExercise.id, body);
        toast.success('Exercício atualizado!');
      } else {
        await exerciseService.create(body);
        toast.success('Exercício adicionado!');
      }
      setExerciseModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao salvar exercício.');
    }
    setSavingExercise(false);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Deseja excluir este exercício?')) return;
    try {
      await exerciseService.delete(exerciseId);
      toast.success('Exercício excluído!');
      loadData();
    } catch {
      toast.error('Erro ao excluir exercício.');
    }
  };

  const tabs = [
    { key: 'lessons' as const, icon: <MdCalendarToday />, label: 'Aulas', count: student.lessons.length },
    { key: 'schedules' as const, icon: <MdSchedule />, label: 'Horários', count: schedules.length },
    { key: 'payments' as const, icon: <MdPayment />, label: 'Mensalidades', count: student.payments.length },
    { key: 'exams' as const, icon: <MdSchool />, label: 'Provas', count: student.exams.length },
    { key: 'exercises' as const, icon: <MdAssignment />, label: 'Exercícios', count: student.exercises.length },
  ];

  return (
    <div className="student-detail">
      <div className="back-bar">
        <Button variant="ghost" icon={<MdArrowBack />} onClick={() => navigate('/students')}>Voltar</Button>
      </div>

      <div className="profile-grid">
        <Card variant="elevated" className="student-profile animate-slideUp">
          <Avatar src={student.photoUrl} name={student.name} size="xl" />
          <div className="profile-info">
            <h2>{student.name}</h2>
            <div className="profile-tags">
              {student.subjectName && <Badge variant="primary">{student.subjectName}</Badge>}
              {student.levelName && <Badge variant="secondary">{student.levelName}</Badge>}
            </div>
            {student.phone && <p className="profile-phone">{student.phone}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <p className="profile-created-at" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Cadastrado em: {student.createdAt ? format(new Date(student.createdAt), 'dd/MM/yyyy') : '-'}
              </p>
              {!student.isActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="danger">Arquivado</Badge>
                  <span className="profile-archived-at" style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 500 }}>
                    Última Aula: {student.lastClassDate ? format(new Date(student.lastClassDate), 'dd/MM/yyyy') : '-'}
                  </span>
                </div>
              )}
            </div>
            {student.observation && <p className="profile-obs" style={{ marginTop: '8px' }}>{student.observation}</p>}
          </div>
        </Card>

        {/* Attendance Rate Display */}
        <Card variant="elevated" className="attendance-rate-card animate-slideUp stagger-1">
          <div className="rate-icon"><MdPercent /></div>
          <div className="rate-content">
            <h3>Presença</h3>
            <div className="rate-number">{attendanceRate}%</div>
            <p className="rate-meta">
              {completedCount} presenças, {cancelledCount} faltas
            </p>
          </div>
        </Card>
      </div>

      <div className="detail-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'tab-active' : ''}`} onClick={() => setTab(t.key)}>
            {t.icon} <span>{t.label}</span> <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="tab-content animate-fadeIn">
        {tab === 'lessons' && (
          <div className="detail-list">
            {student.lessons.map(l => {
              const lessonDate = new Date(l.scheduledAt);
              const formattedTitle = format(lessonDate, "eeee, dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
              // Capitalize first letter
              const capitalizedTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1);

              return (
                <Card
                  key={l.id}
                  className={`detail-item clickable status-${l.status}`}
                  onClick={() => handleLessonClick(l)}
                >
                  <div className="lesson-item-body">
                    <strong className="lesson-title">{capitalizedTitle}</strong>
                    <span className="detail-meta">Duração: {l.durationMinutes} minutos</span>
                    {l.notes && <p className="lesson-notes-preview">📝 {l.notes}</p>}
                  </div>
                  <Badge variant={l.status === 'completed' ? 'success' : l.status === 'cancelled' ? 'danger' : l.status === 'holiday' ? 'warning' : 'info'}>
                    {l.status === 'completed' ? 'Concluída' : l.status === 'cancelled' ? 'Cancelada' : l.status === 'holiday' ? 'Feriado' : 'Agendada'}
                  </Badge>
                </Card>
              );
            })}
            {student.lessons.length === 0 && <p className="empty-text">Nenhuma aula registrada</p>}
          </div>
        )}

        {tab === 'schedules' && (
          <div className="schedules-tab">
            <div className="tab-toolbar">
              <h3>Horários Semanais</h3>
              <Button icon={<MdAdd />} onClick={() => openScheduleModal()}>Adicionar Horário</Button>
            </div>
            <div className="detail-list">
              {schedules.map(s => {
                const dayLabel = DAYS_OF_WEEK.find(d => d.value === s.dayOfWeek)?.label || 'Semana';
                const validFromDate = s.validFrom ? new Date(s.validFrom) : null;
                const validUntilDate = s.validUntil ? new Date(s.validUntil) : null;
                
                return (
                  <Card key={s.id} className="detail-item">
                    <div className="schedule-info">
                      <MdSchedule className="schedule-icon" />
                      <div>
                        <strong>{dayLabel}</strong>
                        <span className="detail-meta">{s.startTime.substring(0, 5)} até {s.endTime.substring(0, 5)}</span>
                        <span className="detail-meta" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Vigência: {validFromDate ? format(validFromDate, 'dd/MM/yyyy') : '-'} 
                          {validUntilDate ? ` até ${format(validUntilDate, 'dd/MM/yyyy')}` : ' (Indeterminado)'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn icon-btn-primary" onClick={() => openScheduleModal(s)}>
                        <MdEdit />
                      </button>
                      <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteSchedule(s.id)}>
                        <MdDelete />
                      </button>
                    </div>
                  </Card>
                );
              })}
              {schedules.length === 0 && <p className="empty-text">Nenhum horário semanal agendado.</p>}
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="payments-tab">
            <div className="payments-config-row">
              <Card variant="default" className="price-config-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MdAttachMoney style={{ fontSize: '20px', color: 'var(--accent-primary)' }} />
                    <strong>Valor da Mensalidade:</strong>
                    {editingPrice ? (
                      <input
                        type="number"
                        className="input-field price-inline-input"
                        value={monthlyPriceInput}
                        onChange={e => setMonthlyPriceInput(e.target.value)}
                      />
                    ) : (
                      <span className="price-display">R$ {student.monthlyPrice.toFixed(2)}</span>
                    )}
                  </div>
                  {editingPrice ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button size="sm" variant="ghost" onClick={() => setEditingPrice(false)}>Cancelar</Button>
                      <Button size="sm" isLoading={savingPrice} onClick={handleSaveMonthlyPrice}>Salvar</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" icon={<MdEdit />} onClick={() => setEditingPrice(true)}>Editar</Button>
                  )}
                </div>
              </Card>

              {/* Year Selector */}
              <div className="year-selector">
                <button className="year-btn" onClick={() => setPaymentYear(paymentYear - 1)}>-</button>
                <span className="year-text">{paymentYear}</span>
                <button className="year-btn" onClick={() => setPaymentYear(paymentYear + 1)}>+</button>
              </div>
            </div>

            {/* Fila Horizontal de Meses Circular */}
            <div className="months-grid-row">
              {MONTHS.map(m => {
                const payment = student.payments.find(p => p.month === m.value && p.year === paymentYear);
                const isPaid = !!payment;
                return (
                  <div
                    key={m.value}
                    className={`month-circle-card ${isPaid ? 'is-paid' : 'is-unpaid'}`}
                    onClick={() => handleTogglePayment(m.value)}
                  >
                    <div className="month-circle">
                      <span className="month-label">{m.label}</span>
                      {isPaid && <MdCheckCircle className="check-icon" />}
                    </div>
                    <span className="month-value">
                      {isPaid ? `R$ ${payment.amount.toFixed(0)}` : 'Pendente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'exams' && (
          <div className="exams-tab">
            <div className="tab-toolbar">
              <h3>Provas Cadastradas</h3>
              <Button icon={<MdAdd />} onClick={() => openExamModal()}>Adicionar Prova</Button>
            </div>
            <div className="detail-list">
              {student.exams.map(e => (
                <Card key={e.id} className="detail-item">
                  <div className="exam-item-body">
                    <strong>{e.title}</strong>
                    <span className="detail-meta">
                      Agendada: {format(new Date(e.scheduledAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    {e.notes && <p className="lesson-notes-preview">📝 {e.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {e.grade != null ? (
                      <Badge variant="success">Nota: {e.grade}/{e.maxGrade}</Badge>
                    ) : (
                      <Badge variant="warning">Sem nota</Badge>
                    )}
                    <button className="icon-btn" onClick={() => openExamModal(e)}><MdEdit /></button>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteExam(e.id)}><MdDelete /></button>
                  </div>
                </Card>
              ))}
              {student.exams.length === 0 && <p className="empty-text">Nenhuma prova registrada.</p>}
            </div>
          </div>
        )}

        {tab === 'exercises' && (
          <div className="exercises-tab">
            <div className="tab-toolbar">
              <h3>Exercícios Cadastrados</h3>
              <Button icon={<MdAdd />} onClick={() => openExerciseModal()}>Adicionar Exercício</Button>
            </div>
            <div className="detail-list">
              {student.exercises.map(e => (
                <Card key={e.id} className="detail-item">
                  <div className="exam-item-body">
                    <strong>{e.title}</strong>
                    <span className="detail-meta">
                      Agendado: {format(new Date(e.scheduledAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    {e.notes && <p className="lesson-notes-preview">📝 {e.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {e.grade != null ? (
                      <Badge variant="success">Nota: {e.grade}/{e.maxGrade}</Badge>
                    ) : (
                      <Badge variant="warning">Sem nota</Badge>
                    )}
                    <button className="icon-btn" onClick={() => openExerciseModal(e)}><MdEdit /></button>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteExercise(e.id)}><MdDelete /></button>
                  </div>
                </Card>
              ))}
              {student.exercises.length === 0 && <p className="empty-text">Nenhum exercício registrado.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={selectedSchedule ? "Editar Horário Semanal" : "Adicionar Horário Semanal"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setScheduleModalOpen(false)}>Cancelar</Button>
            <Button isLoading={savingSchedule} onClick={handleSaveSchedule}>Salvar</Button>
          </>
        }
      >
        <form onSubmit={handleSaveSchedule} className="modal-form">
          <div className="input-group">
            <label className="input-label">Dia da Semana</label>
            <select
              className="input-field"
              value={dayOfWeek}
              onChange={e => setDayOfWeek(Number(e.target.value))}
              required
            >
              {DAYS_OF_WEEK.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              type="time"
              label="Início"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
            <Input
              type="time"
              label="Término"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <Input
              type="date"
              label="Primeira Aula"
              value={validFrom}
              onChange={e => setValidFrom(e.target.value)}
              required
            />
            <Input
              type="date"
              label="Última Aula (Opcional)"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
            />
          </div>
        </form>
      </Modal>

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
            <div className="detail-row">
              <span className="detail-label">Aluno:</span>
              <strong className="detail-value">{student.name}</strong>
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
              <label className="input-label">Observações da Aula</label>
              <textarea
                className="input-field textarea-field"
                placeholder="Ex: Teve bom desempenho, dúvida sanada sobre matrizes..."
                value={lessonNotes}
                onChange={e => setLessonNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Exam CRUD Modal */}
      <Modal
        isOpen={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        title={selectedExam ? 'Editar Prova' : 'Adicionar Prova'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExamModalOpen(false)}>Cancelar</Button>
            <Button isLoading={savingExam} onClick={handleSaveExam}>Salvar</Button>
          </>
        }
      >
        <form onSubmit={handleSaveExam} className="modal-form">
          <Input
            label="Título da Prova"
            placeholder="Ex: Prova de Álgebra"
            value={examTitle}
            onChange={e => setExamTitle(e.target.value)}
            required
          />
          <Input
            type="date"
            label="Data"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              type="number"
              label="Nota Obtida"
              placeholder="Ex: 8.5 (Vazio se pendente)"
              value={examGrade}
              onChange={e => setExamGrade(e.target.value)}
            />
            <Input
              type="number"
              label="Nota Máxima"
              value={examMaxGrade}
              onChange={e => setExamMaxGrade(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Observações</label>
            <textarea
              className="input-field textarea-field"
              placeholder="Conteúdo cobrado, pendências..."
              value={examNotes}
              onChange={e => setExamNotes(e.target.value)}
              rows={3}
            />
          </div>
        </form>
      </Modal>

      {/* Exercise CRUD Modal */}
      <Modal
        isOpen={exerciseModalOpen}
        onClose={() => setExerciseModalOpen(false)}
        title={selectedExercise ? 'Editar Exercício' : 'Adicionar Exercício'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExerciseModalOpen(false)}>Cancelar</Button>
            <Button isLoading={savingExercise} onClick={handleSaveExercise}>Salvar</Button>
          </>
        }
      >
        <form onSubmit={handleSaveExercise} className="modal-form">
          <Input
            label="Título do Exercício"
            placeholder="Ex: Lista de Equações de 2º Grau"
            value={exerciseTitle}
            onChange={e => setExerciseTitle(e.target.value)}
            required
          />
          <Input
            type="date"
            label="Data Limite"
            value={exerciseDate}
            onChange={e => setExerciseDate(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              type="number"
              label="Nota Obtida"
              placeholder="Ex: 10"
              value={exerciseGrade}
              onChange={e => setExerciseGrade(e.target.value)}
            />
            <Input
              type="number"
              label="Nota Máxima"
              value={exerciseMaxGrade}
              onChange={e => setExerciseMaxGrade(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Observações</label>
            <textarea
              className="input-field textarea-field"
              placeholder="Exercícios específicos, dificuldades..."
              value={exerciseNotes}
              onChange={e => setExerciseNotes(e.target.value)}
              rows={3}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
