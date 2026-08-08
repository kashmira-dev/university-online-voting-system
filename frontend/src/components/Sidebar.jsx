import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, FileText, LayoutDashboard, UserCheck } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  // 🟢 නිවැරදි කළ Role Validation (Admin roles පරීක්ෂා කිරීම)
  const role = user?.role || user?.user_type || user?.role_name || '';
  
  const isAdmin = 
    role === 'SuperAdmin' || 
    role === 'Chief Election Officer' || 
    role === 'Voter Manager' ||
    role === 'Admin' ||
    role.toLowerCase().includes('admin') ||
    user?.user_type === 'Admin';

  const isStudent = !isAdmin;

  return (
    <aside className="w-64 bg-[#070b19] border-r border-slate-800 hidden lg:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)] text-white shadow-xl">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">
            Navigation Menu
          </p>
          
          <div className="space-y-2">
            {isStudent ? (
              /* Student Voter Status Indicator Card */
              <div className="p-4 rounded-xl bg-indigo-900/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Student Voter Portal
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  You are currently viewing active university elections.
                </p>
              </div>
            ) : (
              /* Admin Navigation Options */
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('admin_dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    activeTab === 'admin_dashboard'
                      ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                  Election Governance
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('audit_logs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    activeTab === 'audit_logs'
                      ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Security Audit Trail
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PostgreSQL Security Badge */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-inner">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          PostgreSQL Protected
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          All votes encrypted & transactionalized using PL/pgSQL routines with audit logging.
        </p>
      </div>
    </aside>
  );
}