import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MdSchool, MdPayment, MdCalendarToday,
  MdSchedule, MdDelete, MdAdd, MdEdit, MdCheckCircle, MdCancel, MdPercent, MdAttachMoney,
  MdExpandMore, MdExpandLess, MdTimer, MdPhone, MdCake, MdEventAvailable, MdEventBusy, MdPerson, MdSwapVert,
  MdAssignmentTurnedIn, MdOpenInNew, MdAccessTime, MdShare, MdMenuBook,
  MdEmojiEvents, MdVerified
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
import { scheduleService, lessonService, paymentService, examService, exerciseService, subjectService, levelService, classSheetService } from '../../services/dataServices';
import type { StudentDetail, ScheduleEntry, Lesson, Subject, Level, StudentActivity, TemplateActivity, ClassSheet } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
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
  const [tab, setTab] = useState<'lessons' | 'schedules' | 'payments' | 'activities' | 'sheets'>(initialTab);

  // Online Activities states
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateActivity[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [assigning, setAssigning] = useState(false);


  // Assignment filtering states
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignLevelId, setAssignLevelId] = useState('');
  const [assignSearchText, setAssignSearchText] = useState('');

  // Correction states
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [activityToCorrect, setActivityToCorrect] = useState<StudentActivity | null>(null);
  const [correctionScores, setCorrectionScores] = useState<{ [answerId: string]: string }>({});
  const [correctionNotes, setCorrectionNotes] = useState<{ [answerId: string]: string }>({});
  const [savingCorrection, setSavingCorrection] = useState(false);

  // Lançamento Manual (Prova/Exercício) Modal states
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedManualId, setSelectedManualId] = useState<string | null>(null);
  const [manualType, setManualType] = useState<'exam' | 'exercise'>('exam');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualGrade, setManualGrade] = useState('');
  const [manualMaxGrade, setManualMaxGrade] = useState('10');
  const [savingManual, setSavingManual] = useState(false);

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
  const [lessonSortOrder, setLessonSortOrder] = useState<'asc' | 'desc'>('asc');

  // Schedule Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);
  const [scheduleStep, setScheduleStep] = useState<1 | 2>(1);
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // End Schedule states
  const [endScheduleModalOpen, setEndScheduleModalOpen] = useState(false);
  const [scheduleToEndId, setScheduleToEndId] = useState<string | null>(null);
  const [endScheduleDate, setEndScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endingSchedule, setEndingSchedule] = useState(false);

  // Fichas (ClassSheets) states
  const [levelClassSheets, setLevelClassSheets] = useState<ClassSheet[]>([]);
  const [releasedSheetIds, setReleasedSheetIds] = useState<string[]>([]);
  const [releasedSheets, setReleasedSheets] = useState<ClassSheet[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [allSubjectSheets, setAllSubjectSheets] = useState<ClassSheet[]>([]);
  const [allLevels, setAllLevels] = useState<Level[]>([]);
  const [expandedLevelIds, setExpandedLevelIds] = useState<string[]>([]);
  const [teacherActivityFilter, setTeacherActivityFilter] = useState<'all' | 'exam' | 'exercise'>('all');

  // Expandable Info Card state
  const [showFullDetails, setShowFullDetails] = useState(false);



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
      
      // Carrega as fichas pedagógicas liberadas de forma paralela e resiliente
      classSheetService.getReleased(id)
        .then(releasedRes => {
          if (releasedRes && releasedRes.data) {
            setReleasedSheets(releasedRes.data);
            setReleasedSheetIds(releasedRes.data.map((cs: ClassSheet) => cs.id));
          }
        })
        .catch(err => {
          console.error('Erro ao carregar fichas liberadas do aluno:', err);
        });
    }).catch(() => navigate('/students'))
      .finally(() => setLoading(false));
  };

  const loadSheetsData = async () => {
    if (!student) return;
    setLoadingSheets(true);
    try {
      const releasedRes = await classSheetService.getReleased(student.id);
      setReleasedSheets(releasedRes.data || []);
      const releasedIds = (releasedRes.data || []).map((cs: ClassSheet) => cs.id);
      setReleasedSheetIds(releasedIds);

      const levelSheetsRes = await classSheetService.getByLevel(student.levelId);
      setLevelClassSheets(levelSheetsRes.data || []);

      const levelsRes = await levelService.getBySubject(student.subjectId);
      setAllLevels(levelsRes.data || []);

      const allSheetsList: ClassSheet[] = [];
      for (const lvl of (levelsRes.data || [])) {
        const res = await classSheetService.getByLevel(lvl.id);
        allSheetsList.push(...(res.data || []));
      }
      setAllSubjectSheets(allSheetsList);
    } catch {
      toast.error('Erro ao carregar fichas pedagógicas.');
    } finally {
      setLoadingSheets(false);
    }
  };

  const toggleLevelExpand = (levelId: string) => {
    if (expandedLevelIds.includes(levelId)) {
      setExpandedLevelIds(expandedLevelIds.filter(id => id !== levelId));
    } else {
      setExpandedLevelIds([...expandedLevelIds, levelId]);
    }
  };

  useEffect(() => {
    if (tab === 'sheets' && student) {
      loadSheetsData();
    }
  }, [tab, student]);

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
      try {
        const res = await levelService.getBySubject(student.subjectId);
        setFormLevelsList(res.data || []);
      } catch {
        setFormLevelsList([]);
      }
    } else {
      setFormLevelsList([]);
    }
    setEditStudentModalOpen(true);
  };

  const handleSaveEditStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSavingStudent(true);
    const effectiveLastClassDate = editStudentForm.isActive === 'false'
      ? (editStudentForm.lastClassDate || new Date().toISOString().split('T')[0])
      : editStudentForm.lastClassDate;
    const body = {
      name: editStudentForm.name,
      birthDate: editStudentForm.birthDate ? `${editStudentForm.birthDate}T00:00:00` : undefined,
      phone: editStudentForm.phone || undefined,
      guardianName: editStudentForm.guardianName || undefined,
      guardianPhone: editStudentForm.guardianPhone || undefined,
      subjectId: editStudentForm.subjectId || undefined,
      levelId: editStudentForm.levelId || undefined,
      observation: editStudentForm.observation || undefined,
      monthlyPrice: parseFloat(editStudentForm.monthlyPrice || '0'),
      isActive: editStudentForm.isActive === 'true',
      firstClassDate: editStudentForm.firstClassDate ? `${editStudentForm.firstClassDate}T00:00:00` : undefined,
      lastClassDate: editStudentForm.isActive === 'false' && effectiveLastClassDate ? `${effectiveLastClassDate}T00:00:00` : undefined
    };
    try {
      await studentService.update(student.id, body as any);
      toast.success('Dados do aluno atualizados!');
      setEditStudentModalOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao atualizar aluno.';
      toast.error(msg);
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

  useEffect(() => {
    if (correctionModalOpen && activityToCorrect) {
      setTimeout(() => {
        activityToCorrect.answers.forEach(q => {
          if (q.questionType === 'writing') {
            const editor = document.getElementById(`notes-editor-${q.id}`);
            if (editor) {
              editor.innerHTML = sanitizeHtml(q.evaluationNotes);
            }
          }
        });
      }, 80);
    }
  }, [correctionModalOpen, activityToCorrect]);

  if (loading) return <div className="page-loading"><span className="loading-spinner" /></div>;
  if (!student) return null;

  try {

  const lastClassCutoffStr = (!student.isActive && student.lastClassDate)
    ? student.lastClassDate.split('T')[0]
    : null;

  const visibleStudentLessons = lastClassCutoffStr
    ? student.lessons.filter(l => l.scheduledAt.split('T')[0] <= lastClassCutoffStr)
    : student.lessons;

  // Calculate Attendance Rate (Total & Current Month)
  const completedCount = visibleStudentLessons.filter(l => l.status === 'completed').length;
  const cancelledCount = visibleStudentLessons.filter(l => l.status === 'cancelled').length;
  const totalAtts = completedCount + cancelledCount;
  const attendanceRate = totalAtts > 0 ? Math.round((completedCount / totalAtts) * 100) : 100;

  const now = new Date();
  const currentMonthLessons = visibleStudentLessons.filter(l => {
    const d = new Date(l.scheduledAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyCompletedCount = currentMonthLessons.filter(l => l.status === 'completed').length;
  const monthlyCancelledCount = currentMonthLessons.filter(l => l.status === 'cancelled').length;
  const monthlyTotalAtts = monthlyCompletedCount + monthlyCancelledCount;
  const monthlyAttendanceRate = monthlyTotalAtts > 0
    ? Math.round((monthlyCompletedCount / monthlyTotalAtts) * 100)
    : attendanceRate;

  // Calculate Past Class Hours Rate (Only for classes that have already occurred)
  const pastLessons = visibleStudentLessons.filter(l => 
    (l.status === 'completed' || l.status === 'cancelled') && new Date(l.scheduledAt) <= now
  );
  const completedPastLessons = pastLessons.filter(l => l.status === 'completed');
  
  const totalPastMinutes = pastLessons.reduce((acc, l) => acc + l.durationMinutes, 0);
  const completedMinutes = completedPastLessons.reduce((acc, l) => acc + l.durationMinutes, 0);
  
  const totalPastHours = (totalPastMinutes / 60).toFixed(1).replace('.0', '');
  const completedHours = (completedMinutes / 60).toFixed(1).replace('.0', '');
  const hoursAttendanceRate = totalPastMinutes > 0 ? Math.round((completedMinutes / totalPastMinutes) * 100) : 100;

  // First and Last Class dates
  const sortedLessons = [...visibleStudentLessons].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const firstClassDate = sortedLessons.length > 0 ? sortedLessons[0].scheduledAt : null;
  const lastClassDate = student.lastClassDate || (sortedLessons.length > 0 ? sortedLessons[sortedLessons.length - 1].scheduledAt : null);

  // Active Student Tenure (Years / Months / Days counter)
  const activeStartDateRaw = student.firstClassDate || firstClassDate || student.createdAt;
  const activeStartDate = activeStartDateRaw ? new Date(activeStartDateRaw) : now;
  const activeEndDate = (!student.isActive && student.lastClassDate) ? new Date(student.lastClassDate) : now;
  const diffMs = Math.max(0, activeEndDate.getTime() - activeStartDate.getTime());
  const totalActiveDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const activeYears = Math.floor(totalActiveDays / 365);
  const activeMonths = Math.floor((totalActiveDays % 365) / 30);
  const activeRemDays = totalActiveDays % 30;

  const activeTenureShort = activeYears > 0
    ? (activeMonths > 0 ? `${activeYears}a ${activeMonths}m` : `${activeYears}a`)
    : activeMonths > 0
      ? `${activeMonths} ${activeMonths === 1 ? 'mês' : 'meses'}`
      : `${totalActiveDays}d`;

  const activeTenureFull = activeYears > 0
    ? `${activeYears} ${activeYears === 1 ? 'ano' : 'anos'}${activeMonths > 0 ? ` e ${activeMonths} ${activeMonths === 1 ? 'mês' : 'meses'}` : ''}`
    : activeMonths > 0
      ? `${activeMonths} ${activeMonths === 1 ? 'mês' : 'meses'}${activeRemDays > 0 ? ` e ${activeRemDays} ${activeRemDays === 1 ? 'dia' : 'dias'}` : ''}`
      : `${totalActiveDays} ${totalActiveDays === 1 ? 'dia' : 'dias'}`;

  // Average Grade across Online Activities, Exams, and Exercises (normalized 0-10)
  const gradedOnline = studentActivities
    .filter(a => a.status === 'completed' && a.grade !== null && a.grade !== undefined)
    .map(a => ((a.grade || 0) / (a.maxGrade || 10)) * 10);
  const gradedExams = (student.exams || [])
    .filter(e => e.grade !== null && e.grade !== undefined)
    .map(e => ((e.grade || 0) / (e.maxGrade || 10)) * 10);
  const gradedExercises = (student.exercises || [])
    .filter(e => e.grade !== null && e.grade !== undefined)
    .map(e => ((e.grade || 0) / (e.maxGrade || 10)) * 10);
  const allNormalizedGrades = [...gradedOnline, ...gradedExams, ...gradedExercises];
  const averageGradeDisplay = allNormalizedGrades.length > 0
    ? (allNormalizedGrades.reduce((sum, val) => sum + val, 0) / allNormalizedGrades.length).toFixed(1)
    : '--';
  const effectivePhone = student.phone || student.guardianPhone || '';

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
    setScheduleStep(1);
    if (schedule) {
      setSelectedSchedule(schedule);
      const freq = (schedule.frequency || 'weekly').toLowerCase();
      setScheduleFrequency(freq === 'biweekly' || freq === 'monthly' ? freq : 'weekly');
      setDayOfWeek(schedule.dayOfWeek);
      setStartTime(schedule.startTime.substring(0, 5));
      setEndTime(schedule.endTime.substring(0, 5));
      setValidFrom(schedule.validFrom ? schedule.validFrom.split('T')[0] : '');
      setValidUntil(schedule.validUntil ? schedule.validUntil.split('T')[0] : '');
    } else {
      setSelectedSchedule(null);
      setScheduleFrequency('weekly');
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
      frequency: scheduleFrequency,
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

  const handleEndSchedule = async () => {
    if (!scheduleToEndId) return;
    setEndingSchedule(true);
    try {
      await scheduleService.endSchedule(scheduleToEndId, endScheduleDate);
      toast.success('Horário encerrado com sucesso!');
      setEndScheduleModalOpen(false);
      setScheduleToEndId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao encerrar o horário.');
    } finally {
      setEndingSchedule(false);
    }
  };

  const handleCopyPortalLink = (studentId: string) => {
    const portalUrl = `${window.location.origin}/student-portal/${studentId}`;
    navigator.clipboard.writeText(portalUrl);
    toast.success('Link do portal do aluno copiado!');
  };

  const handleCopyActivityLink = (actId: string) => {
    const quizUrl = `${window.location.origin}/quiz/${actId}`;
    navigator.clipboard.writeText(quizUrl);
    toast.success('Link da atividade copiado!');
  };

  const handleShareActivityWhatsApp = (act: StudentActivity) => {
    const quizUrl = `${window.location.origin}/quiz/${act.id}`;
    const typeLabel = act.type === 'exam' ? 'prova' : 'atividade';
    const message = `Olá, ${student?.name || 'aluno(a)'}! Aqui está o link para a sua ${typeLabel} (${act.title}):\n${quizUrl}`;
    const rawPhone = student?.phone || student?.guardianPhone;
    const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '') : '';
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleToggleSheet = async (sheetId: string) => {
    if (!student) return;
    const isReleased = releasedSheetIds.includes(sheetId);
    
    try {
      if (isReleased) {
        await classSheetService.revokeFromStudent(student.id, sheetId);
        setReleasedSheetIds(releasedSheetIds.filter(id => id !== sheetId));
        setReleasedSheets(releasedSheets.filter(s => s.id !== sheetId));
        toast.success('Acesso à ficha revogado!');
      } else {
        await classSheetService.releaseToStudent(student.id, sheetId);
        setReleasedSheetIds([...releasedSheetIds, sheetId]);
        const sheetObj = allSubjectSheets.find(s => s.id === sheetId) || levelClassSheets.find(s => s.id === sheetId);
        if (sheetObj && !releasedSheets.some(s => s.id === sheetId)) {
          setReleasedSheets([...releasedSheets, sheetObj]);
        }
        toast.success('Ficha liberada para o aluno!');
      }
    } catch {
      toast.error('Erro ao atualizar liberação da ficha.');
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



  // Online Activities handlers
  const openAssignModal = async () => {
    try {
      const res = await activityService.getTemplates();
      setTemplates(res.data);
      setSelectedTemplateId('');
      setAssignSubjectId(student?.subjectId || '');
      setAssignLevelId(student?.levelId || '');
      setAssignSearchText('');
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



  const handleOpenCorrection = async (activityId: string) => {
    try {
      const res = await activityService.getActivityReview(activityId);
      setActivityToCorrect(res.data);
      
      const initialScores: { [answerId: string]: string } = {};
      const initialNotes: { [answerId: string]: string } = {};
      res.data.answers.forEach(ans => {
        if (ans.questionType === 'writing') {
          initialScores[ans.id] = ans.evaluationScore !== null && ans.evaluationScore !== undefined ? String(ans.evaluationScore) : '';
          initialNotes[ans.id] = ans.evaluationNotes || '';
        }
      });
      setCorrectionScores(initialScores);
      setCorrectionNotes(initialNotes);
      setCorrectionModalOpen(true);
    } catch {
      toast.error('Erro ao buscar respostas para correção.');
    }
  };

  const handleSaveCorrection = async () => {
    if (!activityToCorrect) return;
    setSavingCorrection(true);

    const totalWeight = activityToCorrect.answers.filter(a => a.questionType !== 'text_block').reduce((acc, a) => acc + (a.weight || 1), 0);

    for (const [ansId, scoreStr] of Object.entries(correctionScores)) {
      const dbAns = activityToCorrect.answers.find(a => a.id === ansId);
      if (dbAns) {
        const maxVal = totalWeight > 0 ? ((dbAns.weight || 1) / totalWeight) * activityToCorrect.maxGrade : 0;
        const score = parseFloat(String(scoreStr).replace(',', '.')) || 0;
        if (score > maxVal) {
          toast.error(`A nota atribuída para a questão (${score}) excede o limite máximo permitido (${maxVal.toFixed(2)}).`);
          setSavingCorrection(false);
          return;
        }
        if (score < 0) {
          toast.error('A nota não pode ser menor que zero.');
          setSavingCorrection(false);
          return;
        }
      }
    }

    try {
      const corrections = Object.entries(correctionScores).map(([ansId, scoreStr]) => {
        const score = parseFloat(String(scoreStr).replace(',', '.')) || 0;
        const editor = document.getElementById(`notes-editor-${ansId}`);
        const notesHtml = editor ? editor.innerHTML : (correctionNotes[ansId] || '');
        return {
          answerId: ansId,
          score,
          notes: notesHtml
        };
      });

      await activityService.correctActivity(activityToCorrect.id, corrections);
      toast.success('Atividade corrigida com sucesso!');
      setCorrectionModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao salvar correção.');
    }
    setSavingCorrection(false);
  };

  const handleDeleteStudentActivity = async (id: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir esta tentativa de atividade? Todos os dados de respostas e nota serão apagados permanentemente.');
    if (!confirmDelete) return;

    try {
      await activityService.deleteStudentActivity(id);
      toast.success('Tentativa de atividade excluída com sucesso!');
      loadData();
    } catch {
      toast.error('Erro ao excluir atividade.');
    }
  };

  // Manual assessment handlers (Prova / Exercício)
  const openManualModal = (type: 'exam' | 'exercise', item?: any) => {
    setManualType(type);
    if (item) {
      setSelectedManualId(item.id);
      setManualTitle(item.title);
      setManualDate(item.scheduledAt.substring(0, 10));
      setManualNotes(item.notes || '');
      setManualGrade(item.grade != null ? String(item.grade) : '');
      setManualMaxGrade(String(item.maxGrade));
    } else {
      setSelectedManualId(null);
      setManualTitle('');
      setManualDate(format(new Date(), 'yyyy-MM-dd'));
      setManualNotes('');
      setManualGrade('');
      setManualMaxGrade('10');
    }
    setManualModalOpen(true);
  };

  const handleSaveManual = async (e: FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSavingManual(true);
    const body = {
      studentId: student.id,
      title: manualTitle,
      scheduledAt: `${manualDate}T00:00:00`,
      notes: manualNotes,
      grade: manualGrade ? parseFloat(manualGrade) : null,
      maxGrade: parseFloat(manualMaxGrade)
    };
    try {
      if (manualType === 'exam') {
        if (selectedManualId) {
          await examService.update(selectedManualId, body);
          toast.success('Prova atualizada!');
        } else {
          await examService.create(body);
          toast.success('Prova adicionada!');
        }
      } else {
        if (selectedManualId) {
          await exerciseService.update(selectedManualId, body);
          toast.success('Exercício atualizado!');
        } else {
          await exerciseService.create(body);
          toast.success('Exercício adicionado!');
        }
      }
      setManualModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao salvar lançamento.');
    }
    setSavingManual(false);
  };

  const handleDeleteManual = async (type: 'exam' | 'exercise', id: string) => {
    const label = type === 'exam' ? 'prova' : 'exercício';
    if (!confirm(`Deseja excluir esta ${label}?`)) return;
    try {
      if (type === 'exam') {
        await examService.delete(id);
      } else {
        await exerciseService.delete(id);
      }
      toast.success(`${type === 'exam' ? 'Prova' : 'Exercício'} excluído!`);
      loadData();
    } catch {
      toast.error(`Erro ao excluir ${label}.`);
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
    { key: 'lessons' as const, icon: <MdCalendarToday />, label: 'Aulas', count: visibleStudentLessons.length },
    { key: 'schedules' as const, icon: <MdSchedule />, label: 'Horários', count: schedules.length },
    { key: 'payments' as const, icon: <MdPayment />, label: 'Mensalidades', count: student.payments.length },
    { key: 'activities' as const, icon: <MdAssignmentTurnedIn />, label: 'Provas & Exercícios', count: studentActivities.length + (student.exams?.length || 0) + (student.exercises?.length || 0) },
    { key: 'sheets' as const, icon: <MdSchool />, label: 'Fichas', count: releasedSheetIds.length },
  ];

  return (
    <div className="student-detail animate-fadeIn">
      <div className="profile-grid">
        <Card variant="elevated" className="student-profile animate-slideUp">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%' }}>
            <div className="profile-header-wrap">
              {/* Large circular avatar */}
              <div className="profile-avatar-wrap">
                <Avatar src={student.photoUrl} name={student.name} size="xl" shape="circle" />
              </div>
              
              <div className="profile-info-content">
                {/* Row 1: Larger Student Name + Actions */}
                <div className="profile-info-top">
                  <h2 className="student-name-title">
                    {student.name}
                  </h2>
                  <div className="student-actions">
                    <button
                      className="icon-btn"
                      onClick={() => setShowFullDetails(!showFullDetails)}
                      title={showFullDetails ? 'Ocultar Ficha Completa' : 'Ver Ficha Completa do Aluno'}
                    >
                      {showFullDetails ? <MdExpandLess /> : <MdExpandMore />}
                    </button>
                    <button className="icon-btn icon-btn-warning" onClick={() => handleCopyPortalLink(student.id)} title="Copiar Link do Portal do Aluno"><MdOpenInNew /></button>
                    <button className="icon-btn" onClick={openEditStudentModal} title="Editar Aluno"><MdEdit /></button>
                    <button className="icon-btn icon-btn-danger" onClick={handleDeleteStudent} title="Excluir Aluno"><MdDelete /></button>
                  </div>
                </div>

                {/* Row 2: Pills - Status, Subject, Level */}
                <div className="profile-tags-row">
                  <Badge variant={student.isActive ? 'success' : 'danger'}>
                    {student.isActive ? 'Ativo' : 'Arquivado'}
                  </Badge>
                  {student.subjectName && <Badge variant="primary"><MdMenuBook style={{marginRight: '4px', verticalAlign: 'text-bottom'}}/>{student.subjectName}</Badge>}
                  {student.levelName && <Badge variant="secondary"><MdSchool style={{marginRight: '4px', verticalAlign: 'text-bottom'}}/>{student.levelName}</Badge>}
                </div>

                {/* Row 3: Subtitle Metadata (Idade, Responsável, Início) */}
                <div className="profile-meta-subtitle-row">
                  {student.birthDate && (
                    <span className="meta-subtitle-item">
                      <MdCake /> {calculateAge(student.birthDate)} anos
                    </span>
                  )}
                  {student.guardianName && (
                    <span className="meta-subtitle-item">
                      <MdPerson /> Resp.: {student.guardianName}
                    </span>
                  )}
                  {activeStartDate && (
                    <span className="meta-subtitle-item">
                      <MdCalendarToday /> Desde {format(activeStartDate, 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>

                {/* Row 4: Sleek Circular Icon Dials + Mostradores + Hover Balloons */}
                <div className="profile-dials-row">
                  {/* 1. WhatsApp Dial */}
                  {effectivePhone ? (
                    <a
                      href={getWhatsappUrl(effectivePhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="metric-dial-item metric-dial-whatsapp"
                    >
                      <div className="metric-dial-circle">
                        <FaWhatsapp />
                      </div>
                      <span className="metric-dial-counter">Whats</span>
                      <div className="metric-dial-tooltip">
                        <strong>WhatsApp Direto</strong>
                        <span>{effectivePhone} • Clique para conversar</span>
                      </div>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={openEditStudentModal}
                      className="metric-dial-item metric-dial-whatsapp is-muted"
                    >
                      <div className="metric-dial-circle">
                        <FaWhatsapp />
                      </div>
                      <span className="metric-dial-counter">Sem nº</span>
                      <div className="metric-dial-tooltip">
                        <strong>WhatsApp não cadastrado</strong>
                        <span>Clique para adicionar o telefone do aluno</span>
                      </div>
                    </button>
                  )}

                  {/* 2. Monthly Attendance Rate Dial */}
                  <div className="metric-dial-item metric-dial-monthly">
                    <div className="metric-dial-circle">
                      <MdPercent />
                    </div>
                    <span className="metric-dial-counter">{monthlyAttendanceRate}%</span>
                    <div className="metric-dial-tooltip">
                      <strong>Porcentagem de Presença (Mês)</strong>
                      <span>
                        {monthlyTotalAtts > 0
                          ? `${monthlyCompletedCount} presenças e ${monthlyCancelledCount} faltas neste mês`
                          : `Sem aulas finalizadas no mês (Geral: ${attendanceRate}%)`}
                      </span>
                    </div>
                  </div>

                  {/* 3. Total Attendance Rate Dial */}
                  <div className="metric-dial-item metric-dial-total-att">
                    <div className="metric-dial-circle">
                      <MdVerified />
                    </div>
                    <span className="metric-dial-counter">{attendanceRate}%</span>
                    <div className="metric-dial-tooltip">
                      <strong>Total Porcentagem de Presença</strong>
                      <span>{completedCount} aulas concluídas • {cancelledCount} faltas no histórico</span>
                    </div>
                  </div>

                  {/* 4. Total Class Hours Dial */}
                  <div className="metric-dial-item metric-dial-hours">
                    <div className="metric-dial-circle">
                      <MdTimer />
                    </div>
                    <span className="metric-dial-counter">{completedHours}h</span>
                    <div className="metric-dial-tooltip">
                      <strong>Total de Horas-Aula</strong>
                      <span>{completedHours}h ministradas de {totalPastHours}h previstas ({hoursAttendanceRate}%)</span>
                    </div>
                  </div>

                  {/* 5. Active Student Tenure Counter Dial */}
                  <div className="metric-dial-item metric-dial-tenure">
                    <div className="metric-dial-circle">
                      <MdEventAvailable />
                    </div>
                    <span className="metric-dial-counter">{activeTenureShort}</span>
                    <div className="metric-dial-tooltip">
                      <strong>Tempo como Aluno {student.isActive ? 'Ativo' : ''}</strong>
                      <span>{activeTenureFull} (desde {format(activeStartDate, 'dd/MM/yyyy')})</span>
                    </div>
                  </div>

                  {/* 6. Average Grade in Activities Dial */}
                  <div className="metric-dial-item metric-dial-grade">
                    <div className="metric-dial-circle">
                      <MdEmojiEvents />
                    </div>
                    <span className="metric-dial-counter">{averageGradeDisplay}</span>
                    <div className="metric-dial-tooltip">
                      <strong>Média de Notas em Atividades</strong>
                      <span>
                        {allNormalizedGrades.length > 0
                          ? `Nota média ${averageGradeDisplay} / 10 em ${allNormalizedGrades.length} ${allNormalizedGrades.length === 1 ? 'atividade avaliada' : 'atividades avaliadas'}`
                          : 'Nenhuma prova ou exercício avaliado ainda'}
                      </span>
                    </div>
                  </div>
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
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'tab-active' : ''}`} onClick={() => setTab(t.key)} title={t.label}>
            {t.icon} <span className="tab-label">{t.label}</span> <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="tab-content animate-fadeIn">
        {tab === 'lessons' && (() => {
          const availableYears = Array.from(new Set(
            visibleStudentLessons.map(l => format(new Date(l.scheduledAt), 'yyyy'))
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

          const filteredLessons = visibleStudentLessons.filter(l => {
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
              <div className="tab-toolbar" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'flex-start', width: '100%', marginBottom: '8px' }}>
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
                  style={{ height: '36px', width: '36px', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  title={lessonSortOrder === 'desc' ? "Exibindo decrescente. Clique para crescente." : "Exibindo crescente. Clique para decrescente."}
                >
                  <MdSwapVert style={{ fontSize: '18px' }} />
                </Button>
              </div>

              <div style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: '12px' }}>
                <span className="tab-toolbar-info" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Exibindo {filteredLessons.length} de {visibleStudentLessons.length} aula(s)
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
              <h3>Horários Recorrentes</h3>
              <Button icon={<MdAdd />} onClick={() => openScheduleModal()}>Adicionar Horário</Button>
            </div>
            <div className="detail-list">
              {schedules.map(s => {
                const dayLabel = DAYS_OF_WEEK.find(d => d.value === s.dayOfWeek)?.label || 'Semana';
                const validFromDate = s.validFrom ? new Date(s.validFrom) : null;
                const validUntilDate = s.validUntil ? new Date(s.validUntil) : null;
                const freqNorm = (s.frequency || 'weekly').toLowerCase();
                const freqLabel = freqNorm === 'biweekly' ? 'Quinzenal' : freqNorm === 'monthly' ? 'Mensal' : 'Semanal';
                const freqVariant = freqNorm === 'biweekly' ? 'secondary' : freqNorm === 'monthly' ? 'primary' : 'info';
                
                return (
                  <Card key={s.id} className="schedule-row-card">
                    <div className="schedule-row-main">
                      <div className="schedule-row-header-part" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <MdSchedule className="schedule-icon" />
                        <strong className="schedule-time-title">
                          {dayLabel} — {s.startTime.substring(0, 5)} às {s.endTime.substring(0, 5)}
                        </strong>
                        <Badge variant={freqVariant as any}>{freqLabel}</Badge>
                      </div>
                      
                      <div className="schedule-row-details-part">
                        <span className="schedule-validity-text">
                          Vigência: {validFromDate ? format(validFromDate, 'dd/MM/yyyy') : '-'}
                          {validUntilDate ? ` até ${format(validUntilDate, 'dd/MM/yyyy')}` : ' (Indeterminado)'}
                        </span>
                        <div className="schedule-status-badge-wrap">
                          {validUntilDate ? (
                            <Badge variant="warning">Encerrado</Badge>
                          ) : (
                            <Badge variant="success">Ativo</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="schedule-row-actions">
                      {!s.validUntil && (
                        <button className="icon-btn icon-btn-warning" onClick={() => {
                          setScheduleToEndId(s.id);
                          setEndScheduleDate(format(new Date(), 'yyyy-MM-dd'));
                          setEndScheduleModalOpen(true);
                        }} title="Encerrar horário (concluir ciclo)">
                          <MdCancel />
                        </button>
                      )}
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

        {tab === 'activities' && (
          <div className="activities-tab">
            {/* Atividades Online */}
            <div className="tab-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Provas & Exercícios Online</h3>
              <Button icon={<MdAdd />} onClick={openAssignModal} title="Atribuir Atividade Online" style={{ padding: '8px', minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            </div>

            {/* Toggle Filtro para o Professor */}
            <div className="teacher-filter-toggle" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                type="button"
                onClick={() => setTeacherActivityFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: teacherActivityFilter === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Todas
              </button>
              <button 
                type="button"
                onClick={() => setTeacherActivityFilter('exam')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: teacherActivityFilter === 'exam' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Provas
              </button>
              <button 
                type="button"
                onClick={() => setTeacherActivityFilter('exercise')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: teacherActivityFilter === 'exercise' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Exercícios
              </button>
            </div>

            <div className="detail-list" style={{ marginBottom: 'var(--space-xl)' }}>
              {(() => {
                const filtered = studentActivities.filter(act => {
                  if (teacherActivityFilter === 'all') return true;
                  return act.type === teacherActivityFilter;
                });

                if (filtered.length === 0) {
                  return <p className="empty-text">Nenhuma atividade online atribuída para esta opção.</p>;
                }

                return filtered.map(act => (
                  <Card key={act.id} className="detail-item">
                    <div className="exam-item-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <Badge variant={act.type === 'exam' ? 'danger' : 'success'}>
                          {act.type === 'exam' ? 'Prova' : 'Exercício'}
                        </Badge>
                        <strong>{act.title}</strong>
                      </div>
                      <span className="detail-meta">
                        Agendado: {format(new Date(act.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        {act.completedAt && ` • Entregue em: ${format(new Date(act.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Status Icons */}
                      {act.status === 'completed' ? (
                        <div title="Atividade Entregue" style={{ display: 'flex', alignItems: 'center' }}>
                          <MdCheckCircle size={22} style={{ color: 'var(--success)' }} />
                        </div>
                      ) : act.status === 'corrigir' ? (
                        <div title="Entregue, aguardando correção" style={{ display: 'flex', alignItems: 'center' }}>
                          <MdAssignmentTurnedIn size={22} style={{ color: 'var(--warning)' }} />
                        </div>
                      ) : (
                        <div title="Pendente de resolução" style={{ display: 'flex', alignItems: 'center' }}>
                          <MdAccessTime size={22} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}

                      {/* Nota (Apenas se finalizada) */}
                      {act.status === 'completed' && (
                        <div title="Nota obtida / Nota máxima" style={{ display: 'inline-flex', marginLeft: '4px' }}>
                          <Badge variant="success">{(act.grade?.toFixed(1) ?? '10.0')}/{act.maxGrade.toFixed(1)}</Badge>
                        </div>
                      )}

                      {/* Ações do Status */}
                      {act.status === 'completed' && act.answers?.some(a => a.questionType === 'writing') && (
                        <button
                          type="button"
                          onClick={() => handleOpenCorrection(act.id)}
                          title="Corrigir questões discursivas"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--warning)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            borderRadius: '4px',
                            transition: 'background var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--warning-light)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <MdEdit size={18} />
                        </button>
                      )}

                      {act.status === 'corrigir' && (
                        <button
                          type="button"
                          onClick={() => handleOpenCorrection(act.id)}
                          title="Corrigir respostas do aluno"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--warning)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            borderRadius: '4px',
                            transition: 'background var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--warning-light)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <MdEdit size={18} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyActivityLink(act.id)}
                        title="Copiar link da atividade"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '4px',
                          transition: 'background var(--transition-fast), color var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                          e.currentTarget.style.color = 'var(--accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <MdShare size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareActivityWhatsApp(act)}
                        title="Compartilhar atividade via WhatsApp"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#25D366',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '4px',
                          transition: 'background var(--transition-fast), transform var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <FaWhatsapp size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => window.open(`${window.location.origin}/quiz/${act.id}`, '_blank')}
                        title="Abrir prova em nova aba"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '4px',
                          transition: 'background var(--transition-fast), color var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                          e.currentTarget.style.color = 'var(--accent-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <MdOpenInNew size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStudentActivity(act.id)}
                        title="Excluir tentativa de atividade"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '4px',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-light)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </Card>
                ));
              })()}
            </div>

            {/* Provas e Exercícios Presenciais (Lançados Manualmente) */}
            <div className="tab-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lançamentos</h3>
              <Button variant="outline" icon={<MdAdd />} onClick={() => openManualModal('exam')} title="Novo Lançamento" style={{ padding: '8px', minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            </div>

            <div className="detail-list">
              {(() => {
                const combined = [
                  ...(student.exams || []).map(ex => ({ ...ex, assessmentType: 'exam' as const })),
                  ...(student.exercises || []).map(exe => ({ ...exe, assessmentType: 'exercise' as const }))
                ].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

                return combined.map(item => (
                  <Card key={`${item.assessmentType}-${item.id}`} className="detail-item">
                    <div className="exam-item-body">
                      <strong>{item.title} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>({item.assessmentType === 'exam' ? 'Prova' : 'Exercício'})</span></strong>
                      <span className="detail-meta">
                        Data: {format(new Date(item.scheduledAt), 'dd/MM/yyyy')}
                        {item.notes && ` • Obs: ${item.notes}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.grade !== null && item.grade !== undefined ? (
                        <Badge variant="success">Nota: {item.grade.toFixed(1)} / {item.maxGrade.toFixed(1)}</Badge>
                      ) : (
                        <Badge variant="warning">Sem Nota</Badge>
                      )}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="icon-btn" onClick={() => openManualModal(item.assessmentType, item)} title="Editar"><MdEdit /></button>
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDeleteManual(item.assessmentType, item.id)} title="Excluir"><MdDelete /></button>
                      </div>
                    </div>
                  </Card>
                ));
              })()}

              {((student.exams?.length || 0) === 0 && (student.exercises?.length || 0) === 0) && (
                <p className="empty-text">Nenhuma nota ou lançamento registrado.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'sheets' && (
          <div className="sheets-tab animate-fadeIn">
            <div className="tab-toolbar">
              <h3>Fichas Pedagógicas do Aluno</h3>
              <p className="tab-toolbar-info">
                Fichas liberadas para visualização no portal público do aluno
              </p>
            </div>

            {loadingSheets ? (
              <div className="tab-loading-spinner" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Agrupamento de Fichas por Nível */}
                <div className="sheets-levels-grouped animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Fichas por Nível da Matéria:
                  </h4>
                  {allLevels.map((level: Level) => {
                    const isExpanded = expandedLevelIds.includes(level.id);
                    const levelSheets = allSubjectSheets.filter((s: ClassSheet) => s.levelId === level.id);
                    
                    return (
                      <Card key={level.id} style={{ padding: '0px', overflow: 'hidden' }}>
                        {/* Cabeçalho do Nível clicável para expandir/colapsar */}
                        <div 
                          onClick={() => toggleLevelExpand(level.id)} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '14px 16px', 
                            background: 'var(--bg-glass)', 
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{level.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({levelSheets.length} ficha(s))</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>
                            {isExpanded ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                          </div>
                        </div>

                        {/* Lista das fichas do nível (exibida apenas se expandido) */}
                        {isExpanded && (
                          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {levelSheets.map((sheet: ClassSheet) => {
                              const isReleased = releasedSheetIds.includes(sheet.id);
                              return (
                                <div key={sheet.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isReleased}
                                      onChange={() => handleToggleSheet(sheet.id)}
                                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{sheet.title}</span>
                                  </div>
                                  <Badge variant={isReleased ? 'success' : 'secondary'}>
                                    {isReleased ? 'Liberada' : 'Não Liberada'}
                                  </Badge>
                                </div>
                              );
                            })}
                            {levelSheets.length === 0 && (
                              <p className="empty-text" style={{ fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>Nenhuma ficha cadastrada neste nível.</p>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                  {allLevels.length === 0 && (
                    <p className="empty-text">Nenhum nível cadastrado nesta matéria.</p>
                  )}
                </div>

                {/* Lista Padrão de Fichas Liberadas do Aluno */}
                <div className="sheets-default-list animate-fadeIn" style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    Fichas Liberadas para o Aluno ({releasedSheets.length}):
                  </h4>
                  <div className="detail-list">
                    {releasedSheets.map((sheet: ClassSheet) => {
                      const levelName = allLevels.find((l: Level) => l.id === sheet.levelId)?.name || (sheet.levelId === student.levelId ? student.levelName : 'Outro Nível');
                      return (
                        <Card key={sheet.id} className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px var(--space-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleSheet(sheet.id)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <div>
                              <strong>{sheet.title}</strong>
                              <span className="detail-meta" style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                                Nível: {levelName}
                              </span>
                            </div>
                          </div>
                          <Badge variant="success">
                            Liberada
                          </Badge>
                        </Card>
                      );
                    })}
                    {releasedSheets.length === 0 && (
                      <p className="empty-text">Nenhuma ficha pedagógica liberada para este aluno ainda. Expanda os níveis acima para liberar fichas!</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal (2 Fases: 1. Frequência -> 2. Dia, Horário e Vigência) */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={
          scheduleStep === 1
            ? (selectedSchedule ? 'Editar Horário — Etapa 1 de 2' : 'Agendar Horário — Etapa 1 de 2')
            : (selectedSchedule ? 'Editar Horário — Etapa 2 de 2' : 'Agendar Horário — Etapa 2 de 2')
        }
        size="sm"
        footer={
          scheduleStep === 1 ? (
            <>
              <Button variant="ghost" onClick={() => setScheduleModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => setScheduleStep(2)}>
                Próxima Etapa →
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setScheduleStep(1)}>
                ← Voltar
              </Button>
              <Button variant="ghost" onClick={() => setScheduleModalOpen(false)}>Cancelar</Button>
              <Button isLoading={savingSchedule} onClick={handleSaveSchedule}>Salvar Horário</Button>
            </>
          )
        }
      >
        {scheduleStep === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: 1.45 }}>
              Escolha a frequência com que as aulas deste aluno acontecerão:
            </p>

            {[
              {
                key: 'weekly' as const,
                title: 'Semanal',
                subtitle: 'Toda semana no mesmo dia e horário (4 a 5 aulas por mês)',
              },
              {
                key: 'biweekly' as const,
                title: 'Quinzenal',
                subtitle: 'A cada 15 dias / semanas alternadas (2 aulas por mês)',
              },
              {
                key: 'monthly' as const,
                title: 'Mensal',
                subtitle: 'Uma vez por mês no dia da semana escolhido (1 aula por mês)',
              },
            ].map(opt => {
              const isSelected = scheduleFrequency === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setScheduleFrequency(opt.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <strong style={{ fontSize: '14px', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {opt.title}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {opt.subtitle}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? '6px solid var(--accent-primary)' : '2px solid var(--border-color)',
                      background: '#fff',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSaveSchedule} className="modal-form">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                marginBottom: '4px',
                fontSize: '12.5px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>
                Frequência selecionada:{' '}
                <strong style={{ color: 'var(--accent-primary)' }}>
                  {scheduleFrequency === 'biweekly' ? 'Quinzenal (a cada 15 dias)' : scheduleFrequency === 'monthly' ? 'Mensal (1x por mês)' : 'Semanal (toda semana)'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setScheduleStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Alterar
              </button>
            </div>

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
        )}
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
              >
                <option value="">Selecione...</option>
                {student?.subjectId && !subjectsList.some(s => s.id === student.subjectId) && (
                  <option value={student.subjectId}>{student.subjectName || 'Matéria Atual'}</option>
                )}
                {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Nível *</label>
              <select
                className="input-field"
                value={editStudentForm.levelId}
                onChange={e => setEditStudentForm({ ...editStudentForm, levelId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {student?.levelId && !formLevelsList.some(l => l.id === student.levelId) && (
                  <option value={student.levelId}>{student.levelName || 'Nível Atual'}</option>
                )}
                {formLevelsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Status *</label>
            <select
              className="input-field"
              value={editStudentForm.isActive}
              onChange={e => {
                const nextActive = e.target.value;
                setEditStudentForm({
                  ...editStudentForm,
                  isActive: nextActive,
                  lastClassDate: nextActive === 'false' && !editStudentForm.lastClassDate
                    ? new Date().toISOString().split('T')[0]
                    : editStudentForm.lastClassDate
                });
              }}
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
        {(() => {
          const assignLevels = subjectsList.find(s => s.id === assignSubjectId)?.levels || [];
          const filteredTemplates = templates.filter(t => {
            const matchesSubject = !assignSubjectId || t.subjectId === assignSubjectId;
            const matchesLevel = !assignLevelId || t.levelId === assignLevelId;
            const matchesSearch = !assignSearchText || t.title.toLowerCase().includes(assignSearchText.toLowerCase());
            return matchesSubject && matchesLevel && matchesSearch;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Selecione uma das provas ou exercícios criados no seu banco de modelos para atribuir a este aluno. O sistema irá gerar um link público único para ele responder.
              </p>
              
              {/* Filtros de Pesquisa por Matéria, Nível e Busca */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '11px', margin: 0 }}>Matéria</label>
                  <select
                    className="select-field"
                    style={{ height: '34px', fontSize: '12px', padding: '0 8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                    value={assignSubjectId}
                    onChange={e => {
                      setAssignSubjectId(e.target.value);
                      setAssignLevelId('');
                    }}
                  >
                    <option value="">Todas as Matérias</option>
                    {subjectsList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '11px', margin: 0 }}>Nível</label>
                  <select
                    className="select-field"
                    style={{ height: '34px', fontSize: '12px', padding: '0 8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                    value={assignLevelId}
                    onChange={e => setAssignLevelId(e.target.value)}
                    disabled={!assignSubjectId}
                  >
                    <option value="">Todos os Níveis</option>
                    {assignLevels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                  <label className="input-label" style={{ fontSize: '11px', margin: 0 }}>Buscar por Título</label>
                  <input
                    type="text"
                    placeholder="Pesquise pelo nome do modelo..."
                    value={assignSearchText}
                    onChange={e => setAssignSearchText(e.target.value)}
                    className="input-field"
                    style={{ height: '34px', fontSize: '12px', padding: '0 8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

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
                  {filteredTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.type === 'exam' ? 'Prova' : 'Exercício'})</option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Mostrando {filteredTemplates.length} de {templates.length} modelos de atividades.
                </span>
              </div>
            </div>
          );
        })()}
      </Modal>



      {/* Modal de Correção pelo Professor (para questões discursivas) */}
      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title={activityToCorrect ? `Corrigir: ${activityToCorrect.title}` : 'Corrigir Atividade'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCorrectionModalOpen(false)}>Cancelar</Button>
            <Button isLoading={savingCorrection} onClick={handleSaveCorrection}>Salvar Correção</Button>
          </>
        }
      >
        {activityToCorrect && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Corrigindo respostas de:</span>
              <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>{activityToCorrect.studentName}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(() => {
                let writingIdx = 0;
                const totalWeight = activityToCorrect.answers.filter(a => a.questionType !== 'text_block').reduce((acc, a) => acc + (a.weight || 1), 0);
                return activityToCorrect.answers.map((q) => {
                  if (q.questionType !== 'writing') return null;
                  writingIdx++;

                  const maxQuestionValue = totalWeight > 0 ? ((q.weight || 1) / totalWeight) * activityToCorrect.maxGrade : 0;
                  return (
                    <div key={q.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '16px', background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h5 style={{ color: 'var(--accent-primary)', fontSize: '12px', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Questão Aberta {writingIdx}</span>
                          <span style={{ display: 'inline-flex', fontSize: '10px' }}>
                            <Badge variant="primary">
                              Vale {maxQuestionValue.toFixed(1)} pts
                            </Badge>
                          </span>
                        </h5>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Peso: {q.weight}x
                        </span>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>{q.questionText}</p>

                      <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Resposta escrita pelo aluno:</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                          "{q.writtenAnswer || 'O estudante não respondeu.'}"
                        </p>
                      </div>

                      {(() => {
                        const scoreVal = parseFloat(String(correctionScores[q.id] || '').replace(',', '.')) || 0;
                        const isOverLimit = scoreVal > maxQuestionValue;

                        return (
                          <div className="input-group">
                            <label className="input-label" style={{ marginBottom: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Nota Atribuída (Máximo: <strong>{maxQuestionValue.toFixed(2)}</strong> pontos) *</span>
                            </label>
                            <input
                              type="text"
                              className="input-field"
                              placeholder={`Ex: 1.5, 2.0 (máx ${maxQuestionValue.toFixed(2)})`}
                              value={correctionScores[q.id] || ''}
                              onChange={e => {
                                setCorrectionScores({
                                  ...correctionScores,
                                  [q.id]: e.target.value
                                });
                              }}
                              style={{
                                height: '38px',
                                padding: '0 12px',
                                fontSize: '13px',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: isOverLimit ? '1px solid var(--danger)' : '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                outline: 'none'
                              }}
                            />
                            {isOverLimit && (
                              <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                                ⚠️ A nota digitada ({scoreVal}) excede o limite máximo permitido ({maxQuestionValue.toFixed(2)}).
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Observações com formatação rich text em tempo real */}
                      <div className="input-group" style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="input-label" style={{ margin: 0, fontSize: '12px' }}>Observações do Professor</label>
                          
                          {/* Formatting Toolbar */}
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              title="Negrito"
                              onClick={() => {
                                document.execCommand('bold', false);
                              }}
                              style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 800, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                            >
                              B
                            </button>
                            <button
                              type="button"
                              title="Sublinhado"
                              onClick={() => {
                                document.execCommand('underline', false);
                              }}
                              style={{ padding: '2px 8px', fontSize: '11px', textDecoration: 'underline', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                            >
                              U
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0 4px', height: '23px' }}>
                              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Cor:</span>
                              <input
                                type="color"
                                defaultValue="#EF4444"
                                onChange={(e) => {
                                  document.execCommand('foreColor', false, e.target.value);
                                }}
                                style={{ width: '18px', height: '18px', border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
                                title="Cor do texto"
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          id={`notes-editor-${q.id}`}
                          contentEditable
                          suppressContentEditableWarning
                          className="input-field textarea-field rich-editor"
                          data-placeholder="Adicione observações da resposta (use B, U ou Cor acima para formatar o texto em tempo real)..."
                          style={{
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            padding: '10px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            minHeight: '80px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            outline: 'none',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5'
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Lançamento Manual (Prova/Exercício) */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title={selectedManualId ? (manualType === 'exam' ? "Editar Prova" : "Editar Exercício") : "Novo Lançamento"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setManualModalOpen(false)}>Cancelar</Button>
            <Button isLoading={savingManual} onClick={handleSaveManual}>Salvar</Button>
          </>
        }
      >
        <form onSubmit={handleSaveManual} className="modal-form">
          {/* Toggle de Tipo (só ativo se for criação) */}
          {!selectedManualId && (
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label className="input-label" style={{ marginBottom: '6px', fontSize: '12px' }}>Tipo de Lançamento</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setManualType('exam')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: manualType === 'exam' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: manualType === 'exam' ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                    color: manualType === 'exam' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Prova
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('exercise')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: manualType === 'exercise' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: manualType === 'exercise' ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                    color: manualType === 'exercise' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Exercício
                </button>
              </div>
            </div>
          )}

          <Input
            label={manualType === 'exam' ? "Título da Prova" : "Título do Exercício"}
            placeholder={manualType === 'exam' ? "Ex: Prova 1º Bimestre" : "Ex: Exercício Frações"}
            value={manualTitle}
            onChange={e => setManualTitle(e.target.value)}
            required
          />
          <Input
            type="date"
            label="Data"
            value={manualDate}
            onChange={e => setManualDate(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              type="number"
              step="0.1"
              min="0"
              label="Nota Obtida"
              placeholder="Ex: 8.5 (vazio se pendente)"
              value={manualGrade}
              onChange={e => setManualGrade(e.target.value)}
            />
            <Input
              type="number"
              step="0.1"
              min="0.1"
              label="Nota Máxima"
              value={manualMaxGrade}
              onChange={e => setManualMaxGrade(e.target.value)}
              required
            />
          </div>
          <Input
            label="Observações"
            placeholder={manualType === 'exam' ? "Ex: Teve dificuldade com geometria" : "Ex: Fez tudo com atenção"}
            value={manualNotes}
            onChange={e => setManualNotes(e.target.value)}
          />
        </form>
      </Modal>

      {/* Modal de Encerramento de Ciclo de Horário */}
      <Modal
        isOpen={endScheduleModalOpen}
        onClose={() => {
          setEndScheduleModalOpen(false);
          setScheduleToEndId(null);
        }}
        title="Encerrar Ciclo de Horário"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setEndScheduleModalOpen(false);
              setScheduleToEndId(null);
            }}>Cancelar</Button>
            <Button variant="primary" isLoading={endingSchedule} onClick={handleEndSchedule}>
              Confirmar Encerramento
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Defina a data da <strong>última aula</strong> ou encerramento deste ciclo de horário.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ⚠️ Todas as aulas agendadas (no status "Agendada") para este horário a partir desta data serão <strong>excluídas permanentemente</strong>. As aulas anteriores serão mantidas como histórico.
          </p>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Data de Encerramento</label>
            <Input
              type="date"
              value={endScheduleDate}
              onChange={e => setEndScheduleDate(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
  } catch (renderError: any) {
    return (
      <div style={{ padding: '40px', color: 'var(--danger)', background: 'var(--bg-secondary)', borderRadius: '12px', margin: '20px' }}>
        <h2>Erro de Renderização (Painel do Professor)</h2>
        <p>Ocorreu um erro ao carregar os componentes visuais deste aluno:</p>
        <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', overflowX: 'auto', color: 'var(--danger)' }}>
          {renderError?.message || String(renderError)}
        </pre>
        <pre style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', overflowX: 'auto', fontSize: '11px', color: 'var(--text-secondary)' }}>
          {renderError?.stack}
        </pre>
        <Button onClick={() => window.location.reload()}>Recarregar Página</Button>
      </div>
    );
  }
}
