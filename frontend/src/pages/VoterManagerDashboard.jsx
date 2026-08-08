import React, { useState, useEffect } from 'react';
import { UserCheck, Search, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, PlusCircle, X, BarChart2, Users, Award } from 'lucide-react';

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
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{percentage}%</p>
                    </div>
                  </div>

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

export default function VoterManagerDashboard() {
  const [voters, setVoters] = useState([]);
  const [elections, setElections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const [showModal, setShowModal] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const [viewAnalyticsElectionId, setViewAnalyticsElectionId] = useState(null);

  useEffect(() => {
    fetchVoters();
    fetchElections();
    fetchDepartments();
  }, []);

  const fetchVoters = async () => {
    setLoading(true);
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch('/api/admin/voters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVoters(data.voters || []);
      }
    } catch (err) {
      console.error('Error fetching voters:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchElections = async () => {
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch('/api/admin/elections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setElections(data.elections || []);
      }
    } catch (err) {
      console.error('Error fetching elections:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/auth/departments');
      const data = await res.json();
      if (data.success && data.departments) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleAddVoter = async (e) => {
    e.preventDefault();
    setMessage('');
    const token = localStorage.getItem('vote_token');

    try {
      const res = await fetch('/api/admin/voters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_reg_no: regNo,
          name: name,
          email: email,
          password: password,
          department_id: parseInt(departmentId, 10)
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Student profile '${name}' registered successfully!`);
        setMessageType('success');
        setShowModal(false);
        setRegNo('');
        setName('');
        setEmail('');
        setPassword('');
        setDepartmentId('');
        fetchVoters();
      } else {
        setMessage(data.message || 'Failed to register student profile.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Network error during student registration.');
      setMessageType('error');
    }
  };

  const filteredVoters = voters.filter(v => 
    v.student_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Voter Manager Portal
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Student Voter Directory & Live Elections</h1>
            <p className="text-xs text-slate-300 mt-1">Validate student registrations, review verification states, and view election tallies.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2 text-xs font-bold shadow-lg cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Register Voter
            </button>

            <button
              onClick={fetchVoters}
              className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast Message */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
          messageType === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {messageType === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      {/* Active Elections Tally Section */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-black text-white mb-4">Elections Results & Tally Monitor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {elections.map((el) => (
            <div key={el.election_id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{el.title}</h4>
                <p className="text-xs text-slate-400">ID: #{el.election_id} • Status: <span className="text-indigo-400 font-bold">{el.status}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setViewAnalyticsElectionId(el.election_id)}
                className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5" /> View Tally
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl text-white space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" /> Verified Student Voters Directory
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search reg no or student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">#ID</th>
                <th className="p-4">Registration No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Department ID</th>
                <th className="p-4">Verification State</th>
                <th className="p-4">Eligibility Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400">Loading student registry...</td>
                </tr>
              ) : filteredVoters.map((v, idx) => (
                <tr key={v.student_id || idx} className="hover:bg-slate-900/80">
                  <td className="p-4 font-mono text-slate-500">#{idx + 1}</td>
                  <td className="p-4 font-bold font-mono text-indigo-400">{v.student_reg_no}</td>
                  <td className="p-4 font-semibold text-white">{v.name || 'Student Name'}</td>
                  <td className="p-4 text-slate-400 font-mono">Dept #{v.department_id || 1}</td>
                  <td className="p-4"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">VERIFIED</span></td>
                  <td className="p-4"><span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Eligible</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🎯 REGISTER VOTER MODAL (මෙය එක් කරන ලදී) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-white mb-4">Register Student Voter</h2>

            <form onSubmit={handleAddVoter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UGC0423001"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Kalhara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kasun@university.ac.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Department</label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewAnalyticsElectionId && (
        <ElectionAnalyticsModal 
          electionId={viewAnalyticsElectionId} 
          onClose={() => setViewAnalyticsElectionId(null)} 
        />
      )}

    </div>
  );
}