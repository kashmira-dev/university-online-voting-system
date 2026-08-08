import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Vote, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const isStudent = user?.role === 'student_voter' || user?.user_type === 'Student';
  const displayName = user?.full_name || user?.username || user?.student_reg_no || user?.email || 'User';
  const displayRole = isStudent ? 'Student Voter' : (user?.role || 'Administrator');

  return (
    <header className="bg-[#070b19] text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* w-full සහ px-4 මඟින් මුළු තිරයේම වම් කෙළවරටම Logo එක යොමු කෙරේ */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo - Moved strictly to the left corner */}
          <div 
            className="flex items-center gap-3 cursor-pointer pl-0 ml-0" 
            onClick={() => setActiveTab(isStudent ? 'dashboard' : 'admin_dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none">UNI-VOTE</span>
              <span className="text-[10px] text-indigo-300 tracking-wider font-semibold uppercase">Secure Governance Portal</span>
            </div>
          </div>

          {/* User Profile & Logout Section */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">{displayName}</p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {displayRole}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}