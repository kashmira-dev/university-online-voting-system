import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import BallotPage from './pages/BallotPage';

/* Admin Dashboards */
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ChiefElectionOfficerDashboard from './pages/ChiefElectionOfficerDashboard';
import VoterManagerDashboard from './pages/VoterManagerDashboard';

import AuditLogs from './pages/AuditLogs';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function MainAppLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedElectionId, setSelectedElectionId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Loading Secure Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const isStudent = 
    user?.role === 'student_voter' || 
    user?.user_type === 'Student' || 
    user?.role_name === 'student_voter' ||
    user?.user_type === 'student';

  const role = user?.role;

  const renderAdminView = () => {
    if (activeTab === 'audit_logs') {
      return <AuditLogs />;
    }

    switch (role) {
      case 'SuperAdmin':
        return <SuperAdminDashboard />;
      case 'Chief Election Officer':
        return <ChiefElectionOfficerDashboard />;
      case 'Voter Manager':
        return <VoterManagerDashboard />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return (
    /* මෙතැන bg-slate-50 ලෙස White background එක යොදා ඇත */
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex w-full">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => { 
            setActiveTab(tab); 
            setSelectedElectionId(null); 
          }} 
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {isStudent ? (
            selectedElectionId ? (
              <BallotPage 
                electionId={selectedElectionId} 
                onBack={() => setSelectedElectionId(null)} 
              />
            ) : (
              <StudentDashboard 
                onSelectElection={(id) => setSelectedElectionId(id)} 
              />
            )
          ) : (
            renderAdminView()
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppLayout />
    </AuthProvider>
  );
}