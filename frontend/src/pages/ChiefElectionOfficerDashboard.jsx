import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Play, Clock, RefreshCw, CheckCircle2, AlertCircle, X, UserPlus, PlusCircle, BarChart2, Users, Award } from 'lucide-react';

// Countdown Timer Component
const CountdownTimer = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60))),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { hours: 0, minutes: 0, seconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const isExpired = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
  const isExpiringSoon = !isExpired && timeLeft.hours === 0 && timeLeft.minutes < 60;

  if (isExpired) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-[11px] font-mono font-bold bg-slate-800 border-slate-700 text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span>Election Ended / Completed</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-[11px] font-mono font-bold ${
      isExpiringSoon 
        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse' 
        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>
        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
      </span>
      {isExpiringSoon && <span className="text-[9px] text-rose-400 font-sans font-normal">(Closing Soon)</span>}
    </div>
  );
};

/* -------------------------------------------------------------
   Admin Analytics & Tally Modal Component
------------------------------------------------------------- */
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

export default function ChiefElectionOfficerDashboard() {
  const [elections, setElections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Modal States
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [postName, setPostName] = useState('President');
  const [partyName, setPartyName] = useState('Independent Student Alliance');

  const [showElectionModal, setShowElectionModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState('Upcoming');

  // Analytics Tally Modal State
  const [viewAnalyticsElectionId, setViewAnalyticsElectionId] = useState(null);

  useEffect(() => {
    fetchElections();
    fetchFormData();
  }, []);

  const fetchElections = async () => {
    setLoading(true);
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
      setMessage('Failed to load elections.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch('/api/admin/form-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching student list:', err);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch('/api/admin/elections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          status: newStatus,
          start_date: new Date(),
          end_date: new Date(Date.now() + 3 * 60 * 1000)
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`New Election Cycle '${newTitle}' created successfully!`);
        setMessageType('success');
        setShowElectionModal(false);
        setNewTitle('');
        fetchElections();
      } else {
        setMessage(data.message || 'Failed to create election.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Error creating election cycle.');
      setMessageType('error');
    }
  };

  const handleStartElection = async (electionId) => {
    setMessage('');
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch(`/api/admin/elections/${electionId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Procedure initialize_election_cycle executed!');
        setMessageType('success');
        fetchElections();
      } else {
        setMessage(data.message || 'Failed to start election.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Network error during procedure execution.');
      setMessageType('error');
    }
  };

  const handleExtendTime = async (electionId) => {
    setMessage('');
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch(`/api/admin/elections/${electionId}/extend`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ extend_minutes: 3, minutes: 3 })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage(data.message || 'Voting time extended by +3 minutes via Procedure (bulk_extend_voting_time)!');
        setMessageType('success');
        fetchElections();
      } else {
        setMessage(data.message || 'Failed to extend time.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Network error during extension procedure.');
      setMessageType('error');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: selectedStudentId,
          election_id: selectedElectionId,
          post_name: postName,
          party_name: partyName
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Candidate registered successfully!');
        setMessageType('success');
        setShowCandidateModal(false);
        fetchElections();
      } else {
        setMessage(data.message || 'Candidate registration failed.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Error registering candidate.');
      setMessageType('error');
    }
  };

  return (
    <div className="space-y-6 pb-12 text-white">
      
      {/* Top Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Chief Election Officer Console
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Election Lifecycle Governance</h1>
            <p className="text-xs text-slate-300 mt-1">Execute PL/pgSQL Stored Procedures (`initialize_election_cycle`, `bulk_extend_voting_time`) and manage election tallies.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowElectionModal(true)}
              className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2 text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Create Election
            </button>

            <button
              onClick={fetchElections}
              className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-2 text-xs font-bold shadow-lg cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div className="p-4 rounded-2xl border flex items-center justify-between text-xs font-bold bg-emerald-500/20 border-emerald-500/40 text-slate-950">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-slate-950 font-black">{message}</span>
          </span>
          <button onClick={() => setMessage('')} className="p-1 hover:bg-black/10 rounded-lg cursor-pointer text-slate-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Elections List */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl text-white">
        <h2 className="text-xl font-black mb-6">Active & Upcoming Election Cycles</h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading election modules...</div>
        ) : elections.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">No elections found. Click "+ Create Election" to add one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {elections.map((el) => {
              const isOngoing = el.status?.toLowerCase() === 'ongoing';
              const isTimeExpired = el.end_time ? new Date(el.end_time) <= new Date() : false;
              const displayStatus = isTimeExpired ? 'Completed' : el.status;
              const isCompleted = displayStatus?.toLowerCase() === 'completed';

              return (
                <div key={el.election_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        !isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {displayStatus}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> ID: #{el.election_id}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{el.title}</h3>
                    
                    {/* Countdown Timer */}
                    {isOngoing && el.end_time && (
                      <div className="mb-3">
                        <CountdownTimer targetDate={el.end_time} />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap mt-4">
                    {/* View Analytics Button */}
                    <button
                      type="button"
                      onClick={() => setViewAnalyticsElectionId(el.election_id)}
                      className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Tally & Results
                    </button>

                    {!isOngoing && !isTimeExpired && (
                      <button
                        onClick={() => handleStartElection(el.election_id)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" /> Start (Proc 1)
                      </button>
                    )}

                    {isOngoing && !isTimeExpired && (
                      <button
                        onClick={() => handleExtendTime(el.election_id)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <Clock className="w-3 h-3" /> Extend (+3M Proc 2)
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedElectionId(el.election_id); setShowCandidateModal(true); }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" /> + Add Candidate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {viewAnalyticsElectionId && (
        <ElectionAnalyticsModal 
          electionId={viewAnalyticsElectionId} 
          onClose={() => setViewAnalyticsElectionId(null)} 
        />
      )}

      {/* Modal 1: Create New Election */}
      {showElectionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative">
            <button onClick={() => setShowElectionModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-400" /> Create New Election Cycle
            </h2>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Election Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computing Faculty Student Council 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Initial Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Create Election Cycle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Register Candidate */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative">
            <button onClick={() => setShowCandidateModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Register Candidate
            </h2>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Select Student Profile</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.name} ({s.student_reg_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Post / Position</label>
                <input
                  type="text"
                  required
                  value={postName}
                  onChange={(e) => setPostName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Party Name</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs shadow-lg cursor-pointer"
              >
                Register Candidate
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}