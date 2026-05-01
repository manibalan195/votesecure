import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Auth
import LoginPage      from './pages/auth/LoginPage.jsx';
import RegisterPage   from './pages/auth/RegisterPage.jsx';
import VerifyOTPPage  from './pages/auth/VerifyOTPPage.jsx';

// Voter
import DashboardPage  from './pages/voter/DashboardPage.jsx';
import VotingPage     from './pages/voter/VotingPage.jsx';
import ResultsPage    from './pages/voter/ResultsPage.jsx';
import ApplyCandidatePage from './pages/voter/ApplyCandidatePage.jsx';
import { ElectionDetailPage, CandidateProfilePage } from './pages/voter/ElectionPages.jsx';
import { MyApplicationsPage, ProfilePageSync, VerifyVotePage } from './pages/voter/VoterPages.jsx';

// Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import { AdminElectionsPage, CreateElectionPage } from './pages/admin/AdminElectionsPage.jsx';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage.jsx';
import {
  ManageCandidatesPage,
  ManageVotersPage,
  AdminResultsPage,
  AdminUsersPage,
  AuditLogPage,
} from './pages/admin/AdminPages.jsx';

// 404
function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh',background:'var(--bg-page)',display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:24 }}>
      <div style={{ fontSize:72,fontWeight:700,color:'var(--border-subtle)',marginBottom:8,lineHeight:1 }}>404</div>
      <h1 style={{ fontSize:22,fontWeight:700,marginBottom:8 }}>Page not found</h1>
      <p style={{ fontSize:14,color:'var(--text-secondary)',marginBottom:24 }}>
        This page doesn't exist or you don't have access.
      </p>
      <a href="/dashboard" style={{ background:'var(--primary)',color:'#fff',padding:'10px 24px',
        borderRadius:'var(--r-md)',fontWeight:600,textDecoration:'none',fontSize:14 }}>
        Go to dashboard
      </a>
    </div>
  );
}

const ADMIN = ['admin'];
const ALL   = ['admin','voter','candidate'];

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"              element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/verify-email"  element={<VerifyOTPPage />} />

        {/* Voter / Candidate */}
        <Route path="/dashboard"          element={<ProtectedRoute roles={ALL}><DashboardPage /></ProtectedRoute>} />
        <Route path="/elections"          element={<ProtectedRoute roles={ALL}><DashboardPage /></ProtectedRoute>} />
        <Route path="/elections/:id"      element={<ProtectedRoute roles={ALL}><ElectionDetailPage /></ProtectedRoute>} />
        <Route path="/elections/:id/vote" element={<ProtectedRoute roles={ALL}><VotingPage /></ProtectedRoute>} />
        <Route path="/elections/:id/results" element={<ProtectedRoute roles={ALL}><ResultsPage /></ProtectedRoute>} />
        <Route path="/elections/:id/apply"   element={<ProtectedRoute roles={ALL}><ApplyCandidatePage /></ProtectedRoute>} />
        <Route path="/apply-candidate"       element={<ProtectedRoute roles={ALL}><DashboardPage /></ProtectedRoute>} />
        <Route path="/candidates/:id"        element={<ProtectedRoute roles={ALL}><CandidateProfilePage /></ProtectedRoute>} />
        <Route path="/my-applications"       element={<ProtectedRoute roles={ALL}><MyApplicationsPage /></ProtectedRoute>} />
        <Route path="/profile"               element={<ProtectedRoute roles={ALL}><ProfilePageSync /></ProtectedRoute>} />
        <Route path="/verify-vote"           element={<ProtectedRoute roles={ALL}><VerifyVotePage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin"                              element={<ProtectedRoute roles={ADMIN}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/elections"                    element={<ProtectedRoute roles={ADMIN}><AdminElectionsPage /></ProtectedRoute>} />
        <Route path="/admin/elections/create"             element={<ProtectedRoute roles={ADMIN}><CreateElectionPage /></ProtectedRoute>} />
        <Route path="/admin/elections/:id/edit"           element={<ProtectedRoute roles={ADMIN}><CreateElectionPage /></ProtectedRoute>} />
        <Route path="/admin/elections/:id/candidates"     element={<ProtectedRoute roles={ADMIN}><ManageCandidatesPage /></ProtectedRoute>} />
        <Route path="/admin/elections/:id/voters"         element={<ProtectedRoute roles={ADMIN}><ManageVotersPage /></ProtectedRoute>} />
        <Route path="/admin/elections/:id/results"        element={<ProtectedRoute roles={ADMIN}><AdminResultsPage /></ProtectedRoute>} />
        <Route path="/admin/applications"                 element={<ProtectedRoute roles={ADMIN}><AdminApplicationsPage /></ProtectedRoute>} />
        <Route path="/admin/users"                        element={<ProtectedRoute roles={ADMIN}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/audit"                        element={<ProtectedRoute roles={ADMIN}><AuditLogPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
