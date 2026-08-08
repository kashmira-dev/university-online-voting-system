import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Lock, RefreshCw, Award, BarChart2, UserPlus, CheckCircle2, AlertCircle, X } from 'lucide-react';

/* Admin Analytics Modal Component */
function ElectionAnalyticsModal({ electionId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [electionId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch(`/api/admin/elections/${electionId}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Total Votes Calculation directly from Leaderboard items if backend total_votes is missing
  const computedTotalVotes = data?.leaderboard 
    ? data.leaderboard.reduce((sum, item) => sum + Number(item.vote_count || 0), 0)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-slate-800 pb-4 mb-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 uppercase flex items-center gap-1.5 w-fit">
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Live Election Tally & Analytics
          </span>
          <h2 className="text-2xl font-black text-white mt-2">{data?.election_title || `Election ID #${electionId}`}</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-4">
            {/* 🎯 Real-time computed Total Votes */}
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-indigo-400" /> Total Cast Votes: <strong className="text-white font-mono">{computedTotalVotes}</strong>
            </span>
            <span>•</span>
            <span>Status: <strong className="text-emerald-400 font-mono">{data?.election_status || 'Completed'}</strong></span>
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Calculating Votes...
          </div>
        ) : !data || data.leaderboard?.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
            No registered candidates found for this election.
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {data.leaderboard.map((cand, idx) => {
              // 🎯 Compute candidate percentage dynamically on frontend
              const voteCount = Number(cand.vote_count || 0);
              const percentage = computedTotalVotes > 0 
                ? ((voteCount / computedTotalVotes) * 100).toFixed(1) 
                : '0.0';

              return (
                <div key={cand.candidate_id || idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase">
                          {cand.post_name}
                        </span>
                        {idx === 0 && voteCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                            <Award className="w-3 h-3" /> Leading Candidate
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                        {cand.candidate_name}
                        <span className="text-xs font-mono text-slate-400">({cand.student_reg_no})</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Party: <strong className="text-slate-200">{cand.party_name}</strong></p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-indigo-400 font-mono">
                        {voteCount} <span className="text-xs text-slate-400 font-normal">Votes</span>
                      </span>
                      {/* 🎯 Explicitly Rendering Percentage */}
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{percentage}%</p>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Tally
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Close Tally
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ totalElections: 0, totalVoters: 0 });
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Chief Election Officer');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [submitting, setSubmitting] = useState(false);

  const [viewAnalyticsElectionId, setViewAnalyticsElectionId] = useState(null);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    const token = localStorage.getItem('vote_token');
    try {
      const [eRes, vRes] = await Promise.all([
        fetch('/api/admin/elections', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/voters', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const eData = await eRes.json();
      const vData = await vRes.json();
      setElections(eData.elections || []);
      setStats({
        totalElections: eData.elections?.length || 0,
        totalVoters: vData.voters?.length || 0
      });
    } catch (err) {
      console.error('Error loading superadmin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    const token = localStorage.getItem('vote_token');

    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message || `Admin '${username}' successfully provisioned!`);
        setMessageType('success');
        setUsername('');
        setEmail('');
        setPassword('');
      } else {
        setMessage(data.message || 'Failed to create admin profile.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Network error during admin provisioning.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> SuperAdmin Root Console
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">System Administration & Analytics</h1>
            <p className="text-xs text-slate-300 mt-1">Full database ownership, admin provisioning, and live election results oversight.</p>
          </div>
          <button
            onClick={fetchSystemStats}
            className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2 text-xs font-bold shadow-lg cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Security Kernel</p>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-400">SECURE</h3>
            <p className="text-[11px] text-slate-400 mt-1">PostgreSQL Triggers & WAL active</p>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Elections</p>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white">{stats.totalElections}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Managed via Stored Procedures</p>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Voters</p>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-indigo-400">{stats.totalVoters}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Protected by eligibility triggers</p>
          </div>
        </div>
      </div>

      {/* Elections Overview with Tally Action */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-black text-white mb-4">Elections & Real-time Results Audit</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {elections.map((el) => (
            <div key={el.election_id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ID: #{el.election_id}
                </span>
                <h4 className="text-base font-bold text-white mt-1">{el.title}</h4>
                <p className="text-xs text-slate-400">Candidates: <strong className="text-white">{el.total_candidates || 0}</strong></p>
              </div>

              <button
                type="button"
                onClick={() => setViewAnalyticsElectionId(el.election_id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <BarChart2 className="w-3.5 h-3.5" /> View Analytics
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Provisioning Section */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-black text-white">Provision New Administrator Account</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">Create new administrative accounts with specific role privileges (RBAC enforcement).</p>

        {message && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold mb-6 ${
            messageType === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
          }`}>
            <span className="flex items-center gap-2">
              {messageType === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              {message}
            </span>
            <button onClick={() => setMessage('')} className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        )}

        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. jayantha.s"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Institutional Email</label>
            <input
              type="email"
              required
              placeholder="e.g. jayantha@lnbti.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Secure Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Assigned Administrative Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Chief Election Officer">Chief Election Officer</option>
              <option value="Voter Manager">Voter Manager</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Provision Administrator Account
            </button>
          </div>
        </form>
      </div>

      {viewAnalyticsElectionId && (
        <ElectionAnalyticsModal 
          electionId={viewAnalyticsElectionId} 
          onClose={() => setViewAnalyticsElectionId(null)} 
        />
      )}

    </div>
  );
}