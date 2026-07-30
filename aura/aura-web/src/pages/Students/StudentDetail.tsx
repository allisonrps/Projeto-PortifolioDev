import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MdArrowBack, MdSchool, MdPayment, MdAssignment, MdCalendarToday,
  MdSchedule, MdDelete, MdAdd, MdEdit, MdCheckCircle, MdCancel, MdPercent, MdAttachMoney,
  MdExpandMore, MdExpandLess, MdTimer, MdPhone, MdCake, MdEventAvailable, MdEventBusy, MdPerson, MdSwapVert,
  MdAssignmentTurnedIn, MdContentCopy
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { studentService } from '../../services/studentService';
import { activityService } from '../../services/activityService';
import { scheduleService, lessonService, paymentService, examService, exerciseService, subjectService, levelService } from '../../services/dataServices';
import type { StudentDetail, ScheduleEntry, Lesson, Exam, Exercise, Subject, Level, StudentActivity, TemplateActivity } from '../../types';
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

const getWhatsappUrl = (phoneStr?: string) => {
  if (!phoneStr) return '#';
  const cleanNumber = phoneStr.replace(/\D/g, '');
  if (!cleanNumber) return '#';
  const formattedNumber = cleanNumber.length <= 11 && !cleanNumber.startsWith('55') ? `55${cleanNumber}` : cleanNumber;
  return `https://wa.me/${formattedNumber}`;
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const initialTab = (location.state as any)?.activeTab || 'lessons';
  const [tab, setTab] = useState<'lessons' | 'schedules' | 'payments' | 'exams' | 'exercises' | 'activities'>(initialTab);

  // Online Activities states
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateActivity[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewActivity, setReviewActivity] = useState<StudentActivity | null>(null);

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
  const [lessonDate, setLessonDate] = useState('');
  const [lessonStartTime, setLessonStartTime] = useState('');
  const [lessonEndTime, setLessonEndTime] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonSortOrder, setLessonSortOrder] = useState<'asc' | 'desc'>('desc');

  // Schedule Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Expandable Info Card state
  const [showFullDetails, setShowFullDetails] = useState(false);

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

  // Lessons Month & Year Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MM'));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), 'yyyy'));

  // Extra Lesson Modal state
  const [extraLessonModalOpen, setExtraLessonModalOpen] = useState(false);
  const [extraLessonForm, setExtraLessonForm] = useState({
    title: 'Aula Extra',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '15:00',
    notes: ''
  });
  const [savingExtraLesson, setSavingExtraLesson] = useState(false);

  const openExtraLessonModal = () => {
    setExtraLessonForm({
      title: 'Aula Extra',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '14:00',
      endTime: '15:00',
      notes: ''
    });
    setExtraLessonModalOpen(true);
  };

  const handleSaveExtraLesson = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingExtraLesson(true);

    const [startH, startM] = extraLessonForm.startTime.split(':').map(Number);
    const [endH, endM] = extraLessonForm.endTime.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;
    let diffMinutes = endTotalMinutes - startTotalMinutes;
    if (diffMinutes <= 0) diffMinutes = 60;

    const scheduledDateStr = `${extraLessonForm.date}T${extraLessonForm.startTime}:00`;

    try {
      await lessonService.create({
        studentId: id,
        title: extraLessonForm.title || 'Aula Extra',
        scheduledAt: scheduledDateStr,
        durationMinutes: diffMinutes,
        notes: extraLessonForm.notes || undefined,
        status: 'scheduled'
      });
      toast.success('Aula extra agendada com sucesso!');
      setExtraLessonModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao agendar aula extra.');
    } finally {
      setSavingExtraLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Deseja excluir esta aula? Ela deixará de aparecer na agenda.')) return;
    try {
      await lessonService.delete(lessonId);
      toast.success('Aula excluída!');
      loadData();
    } catch {
      toast.error('Erro ao excluir aula.');
    }
  };

  // Edit Student Modal state
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [formLevelsList, setFormLevelsList] = useState<Level[]>([]);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '', birthDate: '', phone: '', guardianName: '', guardianPhone: '', subjectId: '', levelId: '',
    observation: '', monthlyPrice: '', isActive: 'true', firstClassDate: '', lastClassDate: ''
  });

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      studentService.getById(id),
      scheduleService.getByStudent(id),
      subjectService.getAll(),
      activityService.getStudentActivities(id)
    ]).then(([studentRes, scheduleRes, subjectRes, activityRes]) => {
      setStudent(studentRes.data);
      setMonthlyPriceInput(String(studentRes.data.monthlyPrice || 0));
      setSchedules(scheduleRes.data);
      setSubjectsList(subjectRes.data);
      setStudentActivities(activityRes.data);
    }).catch(() => navigate('/students'))
      .finally(() => setLoading(false));
  };

  const handleEditStudentSubjectChange = async (subjectId: string) => {
    setEditStudentForm(prev => ({ ...prev, subjectId, levelId: '' }));
    if (subjectId) {
      const res = await levelService.getBySubject(subjectId);
      setFormLevelsList(res.data);
    } else setFormLevelsList([]);
  };

  const openEditStudentModal = async () => {
    if (!student) return;
    setEditStudentForm({
      name: student.name,
      birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
      phone: student.phone || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      subjectId: student.subjectId || '',
      levelId: student.levelId || '',
      observation: student.observation || '',
      monthlyPrice: String(student.monthlyPrice || 0),
      isActive: String(student.isActive),
      firstClassDate: student.firstClassDate ? student.firstClassDate.split('T')[0] : '',
      lastClassDate: student.lastClassDate ? student.lastClassDate.split('T')[0] : ''
    });

    if (student.subjectId) {
      const res = await levelService.getBySubject(student.subjectId);
      setFormLevelsList(res.data);
    } else {
      setFormLevelsList([]);
    }
    setEditStudentModalOpen(true);
  };

  const handleSaveEditStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSavingStudent(true);
    const body = {
      name: editStudentForm.name,
      birthDate: editStudentForm.birthDate || null,
      phone: editStudentForm.phone || null,
      guardianName: editStudentForm.guardianName || null,
      guardianPhone: editStudentForm.guardianPhone || null,
      subjectId: editStudentForm.subjectId,
      levelId: editStudentForm.levelId,
      observation: editStudentForm.observation || null,
      monthlyPrice: parseFloat(editStudentForm.monthlyPrice || '0'),
      isActive: editStudentForm.isActive === 'true',
      firstClassDate: editStudentForm.firstClassDate ? editStudentForm.firstClassDate : null,
      lastClassDate: editStudentForm.isActive === 'false' && editStudentForm.lastClassDate ? editStudentForm.lastClassDate : null
    };
    try {
      await studentService.update(student.id, body as any);
      toast.success('Dados do aluno atualizados!');
      setEditStudentModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao atualizar aluno.');
    }
    setSavingStudent(false);
  };

  const handleDeleteStudent = async () => {
    if (!student) return;
    if (!confirm(`Deseja excluir o aluno "${student.name}"?`)) return;
    try {
      await studentService.delete(student.id);
      toast.success('Aluno excluído com sucesso!');
      navigate('/students');
    } catch {
      toast.error('Erro ao excluir aluno.');
    }
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

  // Calculate Past Class Hours Rate (Only for classes that have already occurred)
  const now = new Date();
  const pastLessons = student.lessons.filter(l => 
    (l.status === 'completed' || l.status === 'cancelled') && new Date(l.scheduledAt) <= now
  );
  const completedPastLessons = pastLessons.filter(l => l.status === 'completed');
  
  const totalPastMinutes = pastLessons.reduce((acc, l) => acc + l.durationMinutes, 0);
  const completedMinutes = completedPastLessons.reduce((acc, l) => acc + l.durationMinutes, 0);
  
  const totalPastHours = (totalPastMinutes / 60).toFixed(1).replace('.0', '');
  const completedHours = (completedMinutes / 60).toFixed(1).replace('.0', '');
  const hoursAttendanceRate = totalPastMinutes > 0 ? Math.round((completedMinutes / totalPastMinutes) * 100) : 100;

  // First and Last Class dates
  const sortedLessons = [...student.lessons].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const firstClassDate = sortedLessons.length > 0 ? sortedLessons[0].scheduledAt : null;
  const lastClassDate = student.lastClassDate || (sortedLessons.length > 0 ? sortedLessons[sortedLessons.length - 1].scheduledAt : null);

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

    const sTime = new Date(lesson.scheduledAt);
    const eTime = new Date(sTime.getTime() + (lesson.durationMinutes || 60) * 60000);

    setLessonDate(format(sTime, 'yyyy-MM-dd'));
    setLessonStartTime(format(sTime, 'HH:mm'));
    setLessonEndTime(format(eTime, 'HH:mm'));

    setLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson) return;
    setSavingLesson(true);

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
    const previousPayments = [...student.payments];

    if (payment) {
      // Optimistic update: remove local payment instantly
      setStudent({
        ...student,
        payments: student.payments.filter(p => p.id !== payment.id)
      });

      try {
        await paymentService.delete(payment.id);
        // Silently reload in background to make sure totals sync up perfectly
        const res = await studentService.getById(student.id);
        setStudent(res.data);
      } catch {
        // Rollback
        setStudent({
          ...student,
          payments: previousPayments
        });
        toast.error('Erro ao remover pagamento.');
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const newPayment = {
        id: tempId,
        studentId: student.id,
        month,
        year: paymentYear,
        amount: student.monthlyPrice,
        isPaid: true
      };

      // Optimistic update: add local payment instantly
      setStudent({
        ...student,
        payments: [...student.payments, newPayment]
      });

      try {
        const res = await paymentService.create({
          studentId: student.id,
          month,
          year: paymentYear,
          amount: student.monthlyPrice,
          isPaid: true,
          paidAt: new Date().toISOString()
        });
        setStudent(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            payments: prev.payments.map(p => p.id === tempId ? res.data : p)
          };
        });
        // Silently reload to ensure totals sync
        const fresh = await studentService.getById(student.id);
        setStudent(fresh.data);
      } catch {
        // Rollback
        setStudent({
          ...student,
          payments: previousPayments
        });
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
      setExamDate(format(new Date(), 'yyyy-MM-dd'));
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
      scheduledAt: `${examDate}T00:00:00`,
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
      setExerciseDate(format(new Date(), 'yyyy-MM-dd'));
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
      scheduledAt: `${exerciseDate}T00:00:00`,
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

  // Online Activities handlers
  const openAssignModal = async () => {
    try {
      const res = await activityService.getTemplates();
      // Filter templates matching the student's level or subject (optional, let's keep all templates of this teacher)
      setTemplates(res.data);
      setSelectedTemplateId('');
      setAssignModalOpen(true);
    } catch {
      toast.error('Erro ao buscar modelos de atividades.');
    }
  };

  const handleAssignActivity = async () => {
    if (!selectedTemplateId || !id) {
      toast.error('Selecione um modelo de atividade.');
      return;
    }
    setAssigning(true);
    try {
      await activityService.assignActivity({
        studentId: id,
        templateActivityId: selectedTemplateId
      });
      toast.success('Atividade atribuída com sucesso!');
      setAssignModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao atribuir atividade.');
    }
    setAssigning(false);
  };

  const handleCopyActivityLink = (activityId: string) => {
    const link = `${window.location.origin}/quiz/${activityId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de resolução copiado!');
  };

  const handleOpenReview = async (activityId: string) => {
    try {
      const res = await activityService.getActivityReview(activityId);
      setReviewActivity(res.data);
      setReviewModalOpen(true);
    } catch {
      toast.error('Erro ao abrir revisão da atividade.');
    }
  };

  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const tabs = [
    { key: 'lessons' as const, icon: <MdCalendarToday />, label: 'Aulas', count: student.lessons.length },
    { key: 'schedules' as const, icon: <MdSchedule />, label: 'Horários', count: schedules.length },
    { key: 'payments' as const, icon: <MdPayment />, label: 'Mensalidades', count: student.payments.length },
    { key: 'exams' as const, icon: <MdSchool />, label: 'Provas', count: student.exams.length },
    { key: 'exercises' as const, icon: <MdAssignment />, label: 'Exercícios', count: student.exercises.length },
    { key: 'activities' as const, icon: <MdAssignmentTurnedIn />, label: 'Provas & Exercícios Online', count: studentActivities.length },
  ];

  return (
    <div className="student-detail animate-fadeIn">
      <div className="back-bar">
        <Button variant="ghost" icon={<MdArrowBack />} onClick={() => navigate('/students')}>Voltar</Button>
      </div>

      <div className="profile-grid">
        <Card variant="elevated" className="student-profile animate-slideUp">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
            <div className="profile-header-wrap">
              {/* Square rounded avatar occupying 3 rows height */}
              <div className="profile-avatar-wrap">
                <Avatar src={student.photoUrl} name={student.name} size="xl" shape="square" />
              </div>
              
              {/* Right side content divided into 3 rows */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0, gap: '6px' }}>
                {/* Row 1: Larger Student Name + Enquadrados Edit and Delete Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, wordBreak: 'break-word' }}>
                    {student.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button className="icon-btn" onClick={openEditStudentModal} title="Editar Aluno"><MdEdit /></button>
                    <button className="icon-btn icon-btn-danger" onClick={handleDeleteStudent} title="Excluir Aluno"><MdDelete /></button>
                  </div>
                </div>

                {/* Row 2: Subject - Level - Status */}
                <div className="profile-tags" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {student.subjectName && <Badge variant="primary">{student.subjectName}</Badge>}
                  {student.levelName && <Badge variant="secondary">{student.levelName}</Badge>}
                  <Badge variant={student.isActive ? 'success' : 'danger'}>
                    {student.isActive ? 'Ativo' : 'Arquivado'}
                  </Badge>
                </div>

                {/* Row 3: + Detalhes Button */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={showFullDetails ? <MdExpandLess /> : <MdExpandMore />}
                    onClick={() => setShowFullDetails(!showFullDetails)}
                    style={{ padding: '2px 8px', fontSize: '12px', height: 'auto' }}
                  >
                    {showFullDetails ? 'Ocultar Detalhes' : '+ Detalhes'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Expandable Details Panel */}
            {showFullDetails && (
              <div className="expandable-details-panel animate-fadeIn" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
                marginTop: '4px'
              }}>
                {/* Stats Cards incorporados em linha/grid */}
                <div className="embedded-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div className="embedded-stat-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div className="rate-icon" style={{ width: '40px', height: '40px', fontSize: '20px', borderRadius: '50%', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MdPercent />
                    </div>
                    <div className="rate-content">
                      <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, fontWeight: 700 }}>Presença</h3>
                      <div className="rate-number" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{attendanceRate}%</div>
                      <p className="rate-meta" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        {completedCount} ok, {cancelledCount} faltas
                      </p>
                    </div>
                  </div>

                  <div className="embedded-stat-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div className="rate-icon" style={{ width: '40px', height: '40px', fontSize: '20px', borderRadius: '50%', background: 'var(--accent-secondary-light)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MdTimer />
                    </div>
                    <div className="rate-content">
                      <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, fontWeight: 700 }}>Horas Aulas</h3>
                      <div className="rate-number" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {completedHours}h <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalPastHours}h</span>
                      </div>
                      <p className="rate-meta" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        {hoursAttendanceRate}% cumpridas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campos de detalhes em Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div className="detail-field">
                    <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <MdCake style={{ color: 'var(--accent-primary)' }} /> Aniversário
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {student.birthDate ? (
                        <>
                          {format(new Date(student.birthDate), 'dd/MM/yyyy')}
                          {calculateAge(student.birthDate) !== null && ` (${calculateAge(student.birthDate)} anos)`}
                        </>
                      ) : 'Não informado'}
                    </strong>
                  </div>

                  {(student.guardianName || (calculateAge(student.birthDate) !== null && calculateAge(student.birthDate)! < 18)) && (
                    <div className="detail-field">
                      <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <MdPerson style={{ color: 'var(--accent-primary)' }} /> Responsável
                      </span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {student.guardianName || 'Não informado'}
                        {student.guardianPhone && (
                          <a
                            href={getWhatsappUrl(student.guardianPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir WhatsApp do responsável"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#25D366', fontWeight: 700, textDecoration: 'none', fontSize: '13px' }}
                          >
                            <FaWhatsapp style={{ fontSize: '15px' }} /> ({student.guardianPhone})
                          </a>
                        )}
                      </strong>
                    </div>
                  )}

                  <div className="detail-field">
                    <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <MdPhone style={{ color: 'var(--accent-primary)' }} /> Celular
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {student.phone ? (
                        <a
                          href={getWhatsappUrl(student.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir WhatsApp do aluno"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#25D366', fontWeight: 700, textDecoration: 'none' }}
                        >
                          <FaWhatsapp style={{ fontSize: '16px' }} /> {student.phone}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Não informado</span>
                      )}
                    </strong>
                  </div>

                  <div className="detail-field">
                    <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <MdCalendarToday style={{ color: 'var(--accent-primary)' }} /> Data de Cadastro
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {student.createdAt ? format(new Date(student.createdAt), 'dd/MM/yyyy') : '-'}
                    </strong>
                  </div>

                  <div className="detail-field">
                    <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <MdEventAvailable style={{ color: 'var(--success)' }} /> Primeira Aula
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {student.firstClassDate ? format(new Date(student.firstClassDate), 'dd/MM/yyyy') : (firstClassDate ? format(new Date(firstClassDate), 'dd/MM/yyyy') : 'Nenhuma aula')}
                    </strong>
                  </div>

                  <div className="detail-field">
                    <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <MdEventBusy style={{ color: 'var(--danger)' }} /> Última Aula
                    </span>
                    <strong style={{ fontSize: '14px', color: !student.isActive ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {!student.isActive && lastClassDate ? format(new Date(lastClassDate), 'dd/MM/yyyy') : '--/--/----'}
                    </strong>
                  </div>
                </div>
              </div>
            )}
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
        {tab === 'lessons' && (() => {
          const availableYears = Array.from(new Set(
            student.lessons.map(l => format(new Date(l.scheduledAt), 'yyyy'))
          )).sort().reverse();

          const monthsList = [
            { value: '01', label: 'Jan' },
            { value: '02', label: 'Fev' },
            { value: '03', label: 'Mar' },
            { value: '04', label: 'Abr' },
            { value: '05', label: 'Mai' },
            { value: '06', label: 'Jun' },
            { value: '07', label: 'Jul' },
            { value: '08', label: 'Ago' },
            { value: '09', label: 'Set' },
            { value: '10', label: 'Out' },
            { value: '11', label: 'Nov' },
            { value: '12', label: 'Dez' },
          ];

          const filteredLessons = student.lessons.filter(l => {
            const lessonDate = new Date(l.scheduledAt);
            const m = format(lessonDate, 'MM');
            const y = format(lessonDate, 'yyyy');

            const monthMatch = selectedMonth === 'all' || m === selectedMonth;
            const yearMatch = selectedYear === 'all' || y === selectedYear;

            return monthMatch && yearMatch;
          }).sort((a, b) => {
            const timeA = new Date(a.scheduledAt).getTime();
            const timeB = new Date(b.scheduledAt).getTime();
            return lessonSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
          });

          return (
            <div className="detail-list">
              <div className="tab-toolbar">
                <div className="tab-toolbar-actions">
                  <Button
                    icon={<MdAdd />}
                    size="sm"
                    onClick={openExtraLessonModal}
                    style={{ height: '36px', padding: '0 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
                  >
                    Aula Extra
                  </Button>

                  <select
                    className="input-field"
                    style={{ height: '36px', padding: '0 8px', fontSize: '13px', width: 'auto', minWidth: '82px', boxSizing: 'border-box' }}
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  >
                    <option value="all">Mês</option>
                    {monthsList.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>

                  <select
                    className="input-field"
                    style={{ height: '36px', padding: '0 8px', fontSize: '13px', width: 'auto', minWidth: '75px', boxSizing: 'border-box' }}
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                  >
                    <option value="all">Ano</option>
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLessonSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    style={{ height: '36px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    title={lessonSortOrder === 'desc' ? "Exibindo decrescente. Clique para crescente." : "Exibindo crescente. Clique para decrescente."}
                  >
                    <MdSwapVert style={{ fontSize: '18px' }} />
                    <span>{lessonSortOrder === 'desc' ? 'Decrescente' : 'Crescente'}</span>
                  </Button>
                </div>

                <span className="tab-toolbar-info">
                  Exibindo {filteredLessons.length} de {student.lessons.length} aula(s)
                </span>
              </div>

              {filteredLessons.length === 0 ? (
                <Card variant="outlined" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                  <p>Nenhuma aula encontrada para os filtros selecionados.</p>
                </Card>
              ) : (
                filteredLessons.map(l => {
                  const lessonDate = new Date(l.scheduledAt);
                  const endDate = new Date(lessonDate.getTime() + (l.durationMinutes || 60) * 60000);
                  const formattedTitle = `${format(lessonDate, "eeee, dd/MM/yyyy", { locale: ptBR })} das ${format(lessonDate, "HH:mm")} às ${format(endDate, "HH:mm")}`;
                  const capitalizedTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1);

                  return (
                    <Card
                      key={l.id}
                      className={`detail-item clickable status-${l.status}`}
                      onClick={() => handleLessonClick(l)}
                    >
                      <div className="lesson-item-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong className="lesson-title" style={{ color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 700 }}>
                            {capitalizedTitle}
                          </strong>
                          {l.title && <Badge variant="secondary">{l.title}</Badge>}
                        </div>

                        {/* Resumo/Observações em destaque principal com letra aumentada */}
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {l.notes ? `📝 ${l.notes}` : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400, fontSize: '13px' }}>Sem resumo gravado para esta aula</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge variant={l.status === 'completed' ? 'success' : l.status === 'cancelled' ? 'danger' : l.status === 'holiday' ? 'warning' : 'info'}>
                          {l.status === 'completed' ? 'Concluída' : l.status === 'cancelled' ? 'Cancelada' : l.status === 'holiday' ? 'Feriado' : 'Agendada'}
                        </Badge>
                        <button
                          className="icon-btn icon-btn-danger"
                          title="Excluir Aula"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLesson(l.id);
                          }}
                          style={{ width: '30px', height: '30px', fontSize: '14px', flexShrink: 0 }}
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          );
        })()}

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
              {(() => {
                const startDate = student.firstClassDate ? new Date(student.firstClassDate) : new Date(student.createdAt);
                const endDate = (!student.isActive && student.lastClassDate) ? new Date(student.lastClassDate) : null;

                return MONTHS.map(m => {
                  const isBeforeStart = paymentYear < startDate.getFullYear() || (paymentYear === startDate.getFullYear() && m.value < (startDate.getMonth() + 1));
                  const isAfterEnd = !!(endDate && (paymentYear > endDate.getFullYear() || (paymentYear === endDate.getFullYear() && m.value > (endDate.getMonth() + 1))));
                  const isDisabled = isBeforeStart || isAfterEnd;

                  const payment = student.payments.find(p => p.month === m.value && p.year === paymentYear);
                  const isPaid = !isDisabled && !!payment;

                  return (
                    <div
                      key={m.value}
                      className={`month-circle-card ${isDisabled ? 'is-disabled' : (isPaid ? 'is-paid' : 'is-unpaid')}`}
                      onClick={() => {
                        if (isDisabled) return;
                        handleTogglePayment(m.value);
                      }}
                      title={isDisabled ? 'Mês fora do período de atividade do aluno' : (isPaid ? 'Marcar como pendente' : 'Marcar como pago')}
                    >
                      <div className="month-circle">
                        <span className="month-label">{m.label}</span>
                        {isPaid && <MdCheckCircle className="check-icon" />}
                      </div>
                      <span className="month-value">
                        {isDisabled ? 'Inativo' : (isPaid ? `R$ ${payment.amount.toFixed(0)}` : 'Pendente')}
                      </span>
                    </div>
                  );
                });
              })()}
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

        {tab === 'activities' && (
          <div className="activities-tab">
            <div className="tab-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3>Provas & Exercícios Online</h3>
              <Button icon={<MdAdd />} onClick={openAssignModal}>Atribuir Atividade</Button>
            </div>

            <div className="detail-list">
              {studentActivities.map(act => (
                <Card key={act.id} className="detail-item">
                  <div className="exam-item-body">
                    <strong>{act.title}</strong>
                    <span className="detail-meta">
                      Matéria: {act.type === 'exam' ? 'Prova' : 'Exercício'} • Agendado: {format(new Date(act.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      {act.completedAt && ` • Concluído em: ${format(new Date(act.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {act.status === 'completed' ? (
                      <>
                        <Badge variant="success">Nota: {act.grade?.toFixed(1) ?? '10.0'}/{act.maxGrade.toFixed(1)}</Badge>
                        <Button variant="outline" size="sm" onClick={() => handleOpenReview(act.id)}>
                          Revisar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="warning">Pendente</Badge>
                        <Button variant="outline" size="sm" icon={<MdContentCopy />} onClick={() => handleCopyActivityLink(act.id)}>
                          Copiar Link
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}

              {studentActivities.length === 0 && <p className="empty-text">Nenhuma atividade atribuída.</p>}
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

      {/* Extra Lesson Modal */}
      <Modal
        isOpen={extraLessonModalOpen}
        onClose={() => setExtraLessonModalOpen(false)}
        title="Adicionar Aula Extra"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExtraLessonModalOpen(false)}>Cancelar</Button>
            <Button isLoading={savingExtraLesson} onClick={handleSaveExtraLesson}>Agendar Aula Extra</Button>
          </>
        }
      >
        <form onSubmit={handleSaveExtraLesson} className="modal-form">
          <Input
            label="Título / Assunto da Aula Extra"
            placeholder="Ex: Aula de Reforço / Tira-dúvidas"
            value={extraLessonForm.title}
            onChange={e => setExtraLessonForm({ ...extraLessonForm, title: e.target.value })}
          />

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
            <Input
              label="Data *"
              type="date"
              value={extraLessonForm.date}
              onChange={e => setExtraLessonForm({ ...extraLessonForm, date: e.target.value })}
              required
            />
            <Input
              label="Horário Início *"
              type="time"
              value={extraLessonForm.startTime}
              onChange={e => setExtraLessonForm({ ...extraLessonForm, startTime: e.target.value })}
              required
            />
            <Input
              label="Horário Fim *"
              type="time"
              value={extraLessonForm.endTime}
              onChange={e => setExtraLessonForm({ ...extraLessonForm, endTime: e.target.value })}
              required
            />
          </div>

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="input-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Observações / Anotações</label>
            <textarea
              className="input-field textarea-field"
              placeholder="Conteúdo planejado para esta aula extra..."
              value={extraLessonForm.notes}
              onChange={e => setExtraLessonForm({ ...extraLessonForm, notes: e.target.value })}
              rows={3}
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

      {/* Edit Student Modal */}
      <Modal
        isOpen={editStudentModalOpen}
        onClose={() => setEditStudentModalOpen(false)}
        title="Editar Aluno"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditStudentModalOpen(false)}>Cancelar</Button>
            <Button isLoading={savingStudent} onClick={handleSaveEditStudent}>Salvar</Button>
          </>
        }
      >
        <form onSubmit={handleSaveEditStudent} className="modal-form">
          <Input
            label="Nome *"
            placeholder="Nome completo"
            value={editStudentForm.name}
            onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
            required
          />

          <div className="form-row">
            <Input
              label="Data da Primeira Aula"
              type="date"
              value={editStudentForm.firstClassDate}
              onChange={e => setEditStudentForm({ ...editStudentForm, firstClassDate: e.target.value })}
            />
            <Input
              label="Data de Nascimento"
              type="date"
              value={editStudentForm.birthDate}
              onChange={e => setEditStudentForm({ ...editStudentForm, birthDate: e.target.value })}
            />
          </div>

          {calculateAge(editStudentForm.birthDate) !== null && calculateAge(editStudentForm.birthDate)! < 18 && (
            <div className="guardian-fields-wrap animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', margin: '8px 0' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                👨‍👩‍👧 Aluno menor de 18 anos ({calculateAge(editStudentForm.birthDate)} anos) - Dados do Responsável
              </span>
              <div className="form-row">
                <Input
                  label="Nome do Responsável *"
                  placeholder="Nome do pai, mãe ou tutor"
                  value={editStudentForm.guardianName}
                  onChange={e => setEditStudentForm({ ...editStudentForm, guardianName: e.target.value })}
                  required
                />
                <Input
                  label="Telefone do Responsável *"
                  placeholder="(11) 99999-9999"
                  value={editStudentForm.guardianPhone}
                  onChange={e => setEditStudentForm({ ...editStudentForm, guardianPhone: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <Input
              label="Telefone do Aluno"
              placeholder="(11) 99999-9999"
              value={editStudentForm.phone}
              onChange={e => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
            />
            <Input
              label="Valor da Mensalidade (R$)"
              type="number"
              placeholder="Ex: 350.00"
              value={editStudentForm.monthlyPrice}
              onChange={e => setEditStudentForm({ ...editStudentForm, monthlyPrice: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Matéria *</label>
              <select
                className="input-field"
                value={editStudentForm.subjectId}
                onChange={e => handleEditStudentSubjectChange(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Nível *</label>
              <select
                className="input-field"
                value={editStudentForm.levelId}
                onChange={e => setEditStudentForm({ ...editStudentForm, levelId: e.target.value })}
                required
              >
                <option value="">Selecione...</option>
                {formLevelsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Status *</label>
            <select
              className="input-field"
              value={editStudentForm.isActive}
              onChange={e => setEditStudentForm({ ...editStudentForm, isActive: e.target.value })}
              required
            >
              <option value="true">Ativo</option>
              <option value="false">Arquivado</option>
            </select>
          </div>

          {/* Conditional field for archived student last class date */}
          {editStudentForm.isActive === 'false' && (
            <div className="animate-fadeIn">
              <Input
                label="Data da Última Aula *"
                type="date"
                value={editStudentForm.lastClassDate}
                onChange={e => setEditStudentForm({ ...editStudentForm, lastClassDate: e.target.value })}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Observação</label>
            <textarea
              className="input-field textarea-field"
              placeholder="Notas sobre o aluno..."
              value={editStudentForm.observation}
              onChange={e => setEditStudentForm({ ...editStudentForm, observation: e.target.value })}
              rows={3}
            />
          </div>
        </form>
      </Modal>

      {/* Modal de Atribuição de Atividade */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Atribuir Atividade Online"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>Cancelar</Button>
            <Button isLoading={assigning} onClick={handleAssignActivity}>Atribuir</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Selecione uma das provas ou exercícios criados no seu banco de modelos para atribuir a este aluno. O sistema irá gerar um link público único para ele responder.
          </p>
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="input-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Modelo de Atividade</label>
            <select
              className="select-field"
              style={{
                height: '40px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0 12px',
                outline: 'none'
              }}
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Selecione um modelo...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.type === 'exam' ? 'Prova' : 'Exercício'})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal de Revisão da Atividade */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewActivity ? `Revisão: ${reviewActivity.title}` : 'Revisão da Atividade'}
        size="md"
        footer={<Button onClick={() => setReviewModalOpen(false)}>Fechar Revisão</Button>}
      >
        {reviewActivity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)' }}>Aluno: {reviewActivity.studentName}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status: Concluída em {reviewActivity.completedAt && format(new Date(reviewActivity.completedAt), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <Badge variant="success">
                Nota: {reviewActivity.grade?.toFixed(1)} / {reviewActivity.maxGrade.toFixed(1)}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviewActivity.answers.map((q, idx) => (
                <div key={q.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', background: 'var(--bg-secondary)' }}>
                  <h5 style={{ color: 'var(--accent-secondary)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Questão {idx + 1}</h5>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px' }}>{q.questionText}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'A', text: q.optionA },
                      { key: 'B', text: q.optionB },
                      { key: 'C', text: q.optionC },
                      { key: 'D', text: q.optionD }
                    ].map(opt => {
                      const isCorrect = q.correctOption === opt.key;
                      const isSelected = q.selectedOption === opt.key;

                      let itemStyle: React.CSSProperties = {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        fontSize: '13px',
                        color: 'var(--text-primary)'
                      };

                      if (isSelected) {
                        if (isCorrect) {
                          itemStyle.border = '1px solid var(--success)';
                          itemStyle.background = 'var(--success-light)';
                          itemStyle.color = 'var(--success)';
                        } else {
                          itemStyle.border = '1px solid var(--danger)';
                          itemStyle.background = 'var(--danger-light)';
                          itemStyle.color = 'var(--danger)';
                        }
                      } else if (isCorrect) {
                        itemStyle.border = '1px dashed var(--success)';
                        itemStyle.background = 'rgba(16, 185, 129, 0.05)';
                      }

                      return (
                        <div key={opt.key} style={itemStyle}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '11px',
                            background: isSelected ? (isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--bg-primary)',
                            color: isSelected ? 'white' : 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                          }}>
                            {opt.key}
                          </span>
                          <span style={{ flex: 1 }}>{opt.text}</span>
                          {isSelected && (
                            <span style={{ fontWeight: 700, fontSize: '11px' }}>
                              {isCorrect ? '✓ Correta' : '✗ Marcada'}
                            </span>
                          )}
                          {!isSelected && isCorrect && (
                            <span style={{ fontWeight: 600, fontSize: '11px', color: 'var(--success)' }}>
                              Gabarito
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
