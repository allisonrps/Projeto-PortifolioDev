export interface Professor {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  planType: string;
}

export interface Student {
  id: string;
  professorId: string;
  subjectId: string;
  levelId: string;
  name: string;
  birthDate?: string;
  phone?: string;
  observation?: string;
  monthlyPrice: number;
  isActive: boolean;
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
  grade?: number;
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
  grade?: number;
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

export interface DashboardData {
  totalStudents: number;
  activeStudentsCount: number;
  archivedStudentsCount: number;
  todayLessons: Lesson[];
  nextUpcomingLesson: Lesson | null;
  birthdayStudents: BirthdayStudent[];
  averageAttendanceRate: number;
  subjectStats: SubjectStat[];
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
    studentId: string;
    studentName: string;
    monthlyPrice: number;
    isPaid: boolean;
    amountPaid: number;
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
