import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Login/Login';
import LandingPage from './pages/Landing/Landing';
import DashboardPage from './pages/Dashboard/Dashboard';
import StudentsPage from './pages/Students/Students';
import StudentDetailPage from './pages/Students/StudentDetail';
import SubjectsPage from './pages/Subjects/Subjects';
import SchedulePage from './pages/Schedule/Schedule';
import SettingsPage from './pages/Settings/Settings';
import FinancePage from './pages/Finance/Finance';
import ActivityTemplatesPage from './pages/ActivityTemplates/ActivityTemplates';
import PublicQuizPage from './pages/PublicQuiz/PublicQuiz';
import StatisticsPage from './pages/Statistics/Statistics';
import PublicSheetPage from './pages/PublicSheet/PublicSheet';
import StudentPortalPage from './pages/StudentPortal/StudentPortal';
import AdminPage from './pages/Admin/Admin';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Toaster position="top-right" toastOptions={{
            style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px' }
          }} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/activities" element={<ActivityTemplatesPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="/quiz/:activityId" element={<PublicQuizPage />} />
            <Route path="/sheet/:id" element={<PublicSheetPage />} />
            <Route path="/student-portal/:studentId" element={<StudentPortalPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
