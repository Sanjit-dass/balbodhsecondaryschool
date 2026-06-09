import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';

// Admin Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Uploads from './pages/Uploads';
import Attendance from './pages/Attendance';
import AttendanceHistory from './pages/AttendanceHistory';
import Exams from './pages/Exams';
import Fees from './pages/Fees';
import FeeDashboard from './pages/FeeDashboard';
import FeeCategories from './pages/fee-management/FeeCategories';
import FeeCollect from './pages/fee-management/FeeCollect';
import FeePayment from './pages/fee-management/FeePayment';
import FeeReceipt from './pages/fee-management/FeeReceipt';
import ReceiptPage from './pages/fee-management/ReceiptPage';
import FeeHistory from './pages/fee-management/FeeHistory';
import FeeReports from './pages/fee-management/FeeReports';
import ClassDetail from './pages/fee-management/ClassDetail';
import FeeManagementLayout from './pages/fee-management/FeeManagementLayout';
import ClassStudents from './pages/ClassStudents';
import StudentProfile from './pages/StudentProfile';
import StudentFees from './pages/StudentFees';
import CollectFee from './pages/CollectFee';
import { useParams } from 'react-router-dom';
import Notices from './pages/Notices';
import Assignments from './pages/Assignments';
import Library from './pages/Library';
import Vehicles from './pages/Vehicles';
import Notifications from './pages/Notifications';
import CreateNotification from './pages/notifications/CreateNotification';
import NotificationCenter from './pages/notifications/NotificationCenter';
import Results from './pages/Results';
import StudentResults from './pages/StudentResults';
import StudentAdmitCard from './pages/StudentAdmitCard';
import StudentPortal from './pages/StudentPortal';
import TeacherPortal from './pages/TeacherPortal';
import ParentPortal from './pages/ParentPortal';
import AdmitCard from './pages/AdmitCard';
import AdminAdmitCardNew from './pages/AdminAdmitCardNew';
import AdmitCardView from './pages/AdmitCardView';
import Timetable from './pages/Timetable';
import AuditLog from './pages/AuditLog';
import AccountSettings from './pages/AccountSettings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Public Website Pages
import PublicHome from './pages/public/Home';
import PublicAbout from './pages/public/About';
import PublicAcademics from './pages/public/Academics';
import PublicAdmissions from './pages/public/Admissions';
import PublicFacilities from './pages/public/Facilities';
import PublicFacilityDetails from './pages/public/FacilityDetails';
import PublicStudentLife from './pages/public/StudentLife';
import PublicGallery from './pages/public/Gallery';
import PublicNoticeBoard from './pages/public/NoticeBoard';
import PublicEvents from './pages/public/Events';
import PublicStaff from './pages/public/Staff';
import PublicContact from './pages/public/Contact';
import PrincipalMessage from './pages/public/PrincipalMessage';
import StudentAchievements from './pages/public/StudentAchievements';
import AcademicExcellence from './pages/public/AcademicExcellence';
import LanguageToggleTest from './pages/public/LanguageToggleTest';
import PublicLayout from './components/public/PublicLayout';
import Register from './pages/Register';
import StudentResultsPublic from './pages/public/StudentResultsPublic';

export default function App(){
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
        {/* Public Website Routes */}
        <Route path="/" element={<PublicLayout><PublicHome /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><PublicAbout /></PublicLayout>} />
        <Route path="/academics" element={<PublicLayout><PublicAcademics /></PublicLayout>} />
        <Route path="/academic-excellence" element={<PublicLayout><AcademicExcellence /></PublicLayout>} />
        <Route path="/admissions" element={<PublicLayout><PublicAdmissions /></PublicLayout>} />
        <Route path="/facilities" element={<PublicLayout><PublicFacilities /></PublicLayout>} />
        <Route path="/facilities/:id" element={<PublicLayout><PublicFacilityDetails /></PublicLayout>} />
        <Route path="/principal-message" element={<PublicLayout><PrincipalMessage /></PublicLayout>} />
        <Route path="/student-achievements" element={<PublicLayout><StudentAchievements /></PublicLayout>} />
        <Route path="/student-life" element={<PublicLayout><PublicStudentLife /></PublicLayout>} />
        <Route path="/gallery" element={<PublicLayout><PublicGallery /></PublicLayout>} />
        <Route path="/notice-board" element={<PublicLayout><PublicNoticeBoard /></PublicLayout>} />
        <Route path="/events" element={<PublicLayout><PublicEvents /></PublicLayout>} />
        <Route path="/staff" element={<PublicLayout><PublicStaff /></PublicLayout>} />
        <Route path="/test-language" element={<PublicLayout><LanguageToggleTest /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><PublicContact /></PublicLayout>} />
        <Route path="/student-results" element={<PublicLayout><StudentResultsPublic /></PublicLayout>} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/login/:role" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route
          path="/register"
          element={
            <PrivateRoute roles={['superadmin','admin','principal']}>
              <Register />
            </PrivateRoute>
          }
        />

        <Route path="/admin/notices" element={
          <PrivateRoute roles={['superadmin','admin','principal']}>
            <Layout>
              <Notices />
            </Layout>
          </PrivateRoute>
        } />

        <Route
          path="/admin"
          element={
            <PrivateRoute roles={['superadmin','admin','principal']}>
              <Layout>
                <Outlet />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="classes" element={<Classes />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/:className" element={<Subjects />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="exams" element={<Exams />} />
          <Route path="fees" element={<Fees />} />
          <Route path="fees/dashboard" element={<FeeDashboard />} />
          <Route path="fees/class/:classId/students" element={(() => {
            const Wrapper = () => { const { classId } = useParams(); return <ClassStudents classId={classId} />; };
            return <Wrapper />;
          })()} />
          <Route path="fees/student/:studentId" element={(() => {
            const Wrapper = () => { const { studentId } = useParams(); return <StudentProfile studentId={studentId} />; };
            return <Wrapper />;
          })()} />
          <Route path="fees/collect" element={(() => {
            const Wrapper = () => { const { search } = window.location; const params = new URLSearchParams(search); const student = params.get('student'); return <CollectFee studentId={student} />; };
            return <Wrapper />;
          })()} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="library" element={<Library />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="notifications/create" element={<CreateNotification />} />
          <Route path="results" element={<Results />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="admit-cards" element={<AdminAdmitCardNew />} />
          <Route path="admit-cards/view/:studentId" element={<AdmitCardView />} />
          <Route path="student-portal" element={<StudentPortal />} />
          <Route path="teacher-portal" element={<TeacherPortal />} />
          <Route path="parent-portal" element={<ParentPortal />} />
          <Route path="uploads" element={<Uploads />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route
          path="/notifications/center"
          element={
            <PrivateRoute>
              <Layout>
                <NotificationCenter />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/fee-management"
          element={
            <PrivateRoute roles={['superadmin','admin','principal','accountant']}>
              <Layout>
                <FeeManagementLayout />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="categories" replace />} />
          <Route path="categories" element={<FeeCategories />} />
          <Route path="structure" element={<Navigate to="categories" replace />} />
          <Route path="collect" element={<FeeCollect />} />
          <Route path="class/:classId" element={<ClassDetail />} />
          <Route path="student/:studentId" element={(() => {
            const Wrapper = () => { const { studentId } = useParams(); return <StudentProfile studentId={studentId} />; };
            return <Wrapper />;
          })()} />
          <Route path="collect/payment" element={<FeePayment />} />
          <Route path="receipt" element={<FeeReceipt />} />
          <Route path="receipt/:receiptId" element={<ReceiptPage />} />
          <Route path="history" element={<FeeHistory />} />
          <Route path="reports" element={<FeeReports />} />
        </Route>

        <Route
          path="/student"
          element={
            <PrivateRoute roles={['student']}>
              <Layout>
                <Outlet />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route index element={<StudentPortal />} />
          <Route path="dashboard" element={<StudentPortal />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="receipt/:receiptId" element={<ReceiptPage />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="admit-card" element={<StudentAdmitCard />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <PrivateRoute roles={['teacher']}>
              <Layout>
                <Outlet />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route index element={<TeacherPortal />} />
          <Route path="dashboard" element={<TeacherPortal />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="results" element={<Results />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route
          path="/account"
          element={
            <PrivateRoute roles={['accountant']}>
              <Layout>
                <Outlet />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route index element={<Fees />} />
          <Route path="dashboard" element={<Fees />} />
          <Route path="fees" element={<Fees />} />
          <Route path="admit-cards" element={<AdminAdmitCardNew />} />
          <Route path="admit-cards/view/:studentId" element={<AdmitCardView />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route
          path="/exam"
          element={
            <PrivateRoute roles={['examcontroller']}>
              <Layout>
                <Outlet />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route index element={<Exams />} />
          <Route path="dashboard" element={<Exams />} />
          <Route path="exams" element={<Exams />} />
          <Route path="admit-card" element={<AdminAdmitCardNew />} />
          <Route path="admit-card/view/:studentId" element={<AdmitCardView />} />
          <Route path="admit-cards" element={<AdminAdmitCardNew />} />
          <Route path="admit-cards/view/:studentId" element={<AdmitCardView />} />
          <Route path="results" element={<Results />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route
          path="/parent"
          element={
            <PrivateRoute roles={['parent']}>
              <Layout>
                <Outlet />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route index element={<ParentPortal />} />
          <Route path="dashboard" element={<ParentPortal />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="receipt/:receiptId" element={<ReceiptPage />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  );
}
