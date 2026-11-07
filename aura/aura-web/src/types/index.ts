export interface Professor {
  id: string;
  email: string;
  name: string;
  phone?: string;
  cpfCnpj?: string;
  photoUrl?: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  planType: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'overdue' | 'canceled' | 'blocked';
  trialEndsAt?: string | null;
  subscriptionExpiresAt?: string | null;
  daysRemaining?: number;
  isWriteAllowed?: boolean;
  isAdmin?: boolean;
  visualTheme?: 'classic' | 'retro-comic' | 'cyber-grid';
}

export interface AdminProfessorItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpfCnpj?: string | null;
  isAdmin: boolean;
  planType: 'trial' | 'monthly' | 'annual' | 'lifetime' | string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'blocked' | string;
  trialEndsAt?: string | null;
  subscriptionExpiresAt?: string | null;
  daysRemaining: number;
  isWriteAllowed: boolean;
  studentsCount: number;
  activeStudentsCount: number;
  lessonsCount: number;
  activitiesCount: number;
  totalPaidAmount: number;
  createdAt: string;
}

export interface AdminSubscriptionItem {
  id: string;
  professorId: string;
  professorName: string;
  professorEmail: string;
  planType: string;
  price: number;
  status: string;
  billingType: string;
  startDate: string;
  endDate?: string | null;
  paymentGatewayId?: string | null;
  invoiceUrl?: string | null;
  createdAt: string;
}

export interface AdminDashboardData {
  totalProfessors: number;
  activeSubscribersCount: number;
  monthlySubscribersCount: number;
  annualSubscribersCount: number;
  lifetimeSubscribersCount: number;
  trialProfessorsCount: number;
  expiredOrBlockedCount: number;
  mrr: number;
  arr: number;
  totalPlatformRevenue: number;
  totalPlatformStudents: number;
  totalPlatformLessons: number;
  totalPlatformActivities: number;
  gatewayConfigured?: boolean;
  gatewayEnvironment?: 'production' | 'sandbox' | 'none' | string;
  maskedGatewayKey?: string | null;
  professors: AdminProfessorItem[];
  recentSubscriptions: AdminSubscriptionItem[];
}

export interface SubscriptionHistoryItem {
  id: string;
  planType: 'monthly' | 'annual' | string;
  price: number;
  status: 'pending' | 'active' | 'overdue' | 'canceled' | string;
  billingType: string;
  startDate: string;
  endDate?: string | null;
  invoiceUrl?: string | null;
  pixQrCodeImage?: string | null;
  pixCopyPaste?: string | null;
  createdAt: string;
}

export interface SubscriptionSummary {
  planType: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'overdue' | 'canceled';
  trialEndsAt?: string | null;
  subscriptionExpiresAt?: string | null;
  daysRemaining: number;
  isWriteAllowed: boolean;
  cpfCnpj?: string | null;
  gatewayConfigured: boolean;
  history: SubscriptionHistoryItem[];
}

export interface SubscriptionCheckoutResponse {
  subscriptionId: string;
  planType: 'monthly' | 'annual';
  price: number;
  status: string;
  billingType: string;
  paymentGatewayId?: string | null;
  invoiceUrl?: string | null;
  pixQrCodeImage?: string | null;
  pixCopyPaste?: string | null;
  isSandboxOrDemo: boolean;
  gatewayMessage?: string | null;
}

export interface Student {
  id: string;
  professorId: string;
  subjectId: string;
  levelId: string;
  name: string;
  birthDate?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  observation?: string;
  monthlyPrice: number;
  isActive: boolean;
  firstClassDate?: string | null;
  lastClassDate?: string | null;
  attendanceRate: number;
  photoUrl?: string;
  subjectName?: string;
  levelName?: string;
  createdAt: string;
}

export interface StudentDetail extends Student {
  lessons: Lesson[];
  payments: MonthlyPayment[];
  exams: Exam[];
  exercises: Exercise[];
}

export interface Subject {
  id: string;
  name: string;
  studentCount: number;
  levels: Level[];
}

export interface Level {
  id: string;
  subjectId: string;
  name: string;
  studentCount: number;
  classSheets?: ClassSheet[];
}

export interface ClassSheet {
  id: string;
  levelId: string;
  levelName?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  professorId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'holiday';
  notes?: string;
  studentName?: string;
  subjectName?: string;
  levelName?: string;
  lastLessonDate?: string;
  lastLessonTitle?: string;
  lastLessonNotes?: string;
  createdAt: string;
}

export interface MonthlyPayment {
  id: string;
  studentId: string;
  month: number;
  year: number;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  studentName?: string;
}

export interface Exam {
  id: string;
  studentId: string;
  title: string;
  scheduledAt: string;
  notes?: string;
  grade?: number | null;
  maxGrade: number;
  studentName?: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  studentId: string;
  title: string;
  scheduledAt: string;
  notes?: string;
  grade?: number | null;
  maxGrade: number;
  studentName?: string;
  createdAt: string;
}

export interface ScheduleEntry {
  id: string;
  professorId: string;
  studentId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | string;
  isRecurring: boolean;
  validFrom: string;
  validUntil?: string | null;
  studentName?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date?: string;
  isVacationPeriod: boolean;
  vacationStart?: string;
  vacationEnd?: string;
}

export interface LessonStatusStat {
  status: string;
  label: string;
  count: number;
  hours: number;
  percentage: number;
}

export interface DashboardData {
  totalStudents: number;
  activeStudentsCount: number;
  archivedStudentsCount: number;
  monthlyLessonsCount: number;
  yearlyLessonsCount: number;
  monthlyWorkloadHours: number;
  yearlyWorkloadHours: number;
  todayLessons: Lesson[];
  nextUpcomingLesson: Lesson | null;
  birthdayStudents: BirthdayStudent[];
  averageAttendanceRate: number;
  subjectStats: SubjectStat[];
  monthlyLessonStatusStats: LessonStatusStat[];
  yearlyLessonStatusStats: LessonStatusStat[];
  monthlyEffectivenessRate: number;
  yearlyEffectivenessRate: number;
  pendingPreviousLessons: Lesson[];
  pendingCorrections: PendingCorrection[];
  completedActivities: CompletedActivity[];
  pendingPayments: PendingPayment[];
}

export interface CompletedActivity {
  studentActivityId: string;
  studentId: string;
  studentName: string;
  activityTitle: string;
  completedAt?: string;
  grade?: number | null;
  maxGrade: number;
}

export interface PendingPayment {
  studentId: string;
  studentName: string;
  monthlyPrice: number;
}

export interface PendingCorrection {
  studentActivityId: string;
  studentId: string;
  studentName: string;
  activityTitle: string;
  submittedAt?: string;
}

export interface BirthdayStudent {
  studentId: string;
  studentName: string;
  birthDay: number;
  age: number;
}

export interface FinanceData {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueProgression: {
    monthName: string;
    month: number;
    year: number;
    amount: number;
  }[];
  revenueBySubject: {
    subjectName: string;
    amount: number;
  }[];
  studentPaymentStatuses: {
    paymentId?: string | null;
    studentId: string;
    studentName: string;
    subjectName?: string;
    levelName?: string;
    monthlyPrice: number;
    isPaid: boolean;
    amountPaid: number;
  }[];
  manualEntries?: {
    id: string;
    amount: number;
    date: string;
    month: number;
    year: number;
    description: string;
  }[];
}

export interface SubjectStat {
  subjectId: string;
  subjectName: string;
  studentCount: number;
}

export interface AuthResponse {
  token: string;
  professor: Professor;
}

export interface TemplateQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'writing' | 'text_block';
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctOption?: string | null;
  weight: number;
  createdAt?: string;
}

export interface TemplateActivity {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  levelId: string;
  levelName: string;
  type: 'exam' | 'exercise';
  createdAt: string;
  maxGrade: number;
  questions: TemplateQuestion[];
}

export interface StudentAnswer {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'writing' | 'text_block';
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctOption?: string | null;
  selectedOption?: string | null;
  writtenAnswer?: string | null;
  evaluationMention?: string | null;
  evaluationScore?: number | null;
  weight: number;
  evaluationNotes?: string | null;
  createdAt?: string;
}

export interface StudentActivity {
  id: string;
  studentId: string;
  studentName: string;
  templateActivityId: string;
  title: string;
  type: 'exam' | 'exercise';
  scheduledAt: string;
  completedAt?: string | null;
  grade?: number | null;
  maxGrade: number;
  status: 'pending' | 'completed' | 'corrigir';
  answers: StudentAnswer[];
}
