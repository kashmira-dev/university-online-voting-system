import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle2, ArrowRight, RefreshCw, Vote, ShieldCheck, AlertOctagon, X, Lock, BarChart2, BarChart3, Users } from 'lucide-react';

/* -------------------------------------------------------------
   1. Inline Election Results Modal Component
------------------------------------------------------------- */
function ElectionResultsModal({ election, onClose }) {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [election.election_id]);

  const fetchResults = async () => {
    setLoading(true);
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch(`/api/student/elections/${election.election_id}/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setTotalVotes(data.total_votes || 0);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-800 pb-4 mb-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 uppercase flex items-center gap-1.5 w-fit">
            <BarChart3 className="w-3.5 h-3.5" /> Real-time Election Tally
          </span>
          <h2 className="text-2xl font-black text-white mt-2">{election.title}</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Total Votes Cast: <strong className="text-white font-mono">{totalVotes}</strong>
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Calculating Live Votes...
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
            No votes recorded yet for this election.
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {results.map((item, index) => (
              <div key={item.candidate_id || index} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {item.post_name}
                    </span>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {item.candidate_name}
                      {index === 0 && Number(item.vote_count) > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Leading
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400">{item.party_name || 'Independent'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-400 font-mono">
                      {item.vote_count} <span className="text-xs text-slate-400 font-normal">Votes</span>
                    </span>
                    <p className="text-xs text-slate-400 font-mono">{Number(item.percentage || 0).toFixed(1)}%</p>
                  </div>
                </div>

                {/* Dynamic Progress Bar */}
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={fetchResults}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Tally
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   2. Main Student Dashboard Component
------------------------------------------------------------- */
export default function StudentDashboard({ onSelectElection }) {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [turnout, setTurnout] = useState(0);
  const [loading, setLoading] = useState(true);

  // Active Ballot State
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedPost, setSelectedPost] = useState(''); // 🎯 Post Dropdown Selection State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [ballotLoading, setBallotLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Election Results Modal State
  const [viewResultsElection, setViewResultsElection] = useState(null);

  // Notification Toast State
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const triggerToast = (msg, type = 'error') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'error' });
    }, 6000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch('/api/student/elections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setElections(data.elections || []);
      }

      const deptId = user?.department_id || user?.dept_id || 1;
      const turnoutRes = await fetch(`/api/student/turnout/${deptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const turnoutData = await turnoutRes.json();
      if (turnoutData.success) {
        setTurnout(turnoutData.department_turnout || 0);
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBallot = async (election) => {
    const isTimeExpired = election.end_date ? new Date(election.end_date) <= new Date() : false;
    const isCompleted = election.status?.toLowerCase() === 'completed' || isTimeExpired;

    if (isCompleted) {
      triggerToast('Voting is closed. This election has already completed.', 'error');
      return;
    }

    if (onSelectElection) {
      onSelectElection(election.election_id);
      return;
    }

    setSelectedElection(election);
    setSelectedCandidate(null);
    setSelectedPost(''); // Dropdown reset එකක්
    setBallotLoading(true);

    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch(`/api/student/elections/${election.election_id}/ballot`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates || []);
      } else {
        triggerToast(data.message || 'Failed to load candidate list.', 'error');
        setSelectedElection(null);
      }
    } catch (err) {
      triggerToast('Error connecting to ballot dispatch service.', 'error');
      setSelectedElection(null);
    } finally {
      setBallotLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidate || !selectedElection) return;

    setSubmitting(true);
    const token = localStorage.getItem('vote_token');

    try {
      const res = await fetch('/api/student/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          election_id: selectedElection.election_id,
          candidate_id: selectedCandidate
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || 'Vote successfully recorded in database ledger!', 'success');
        setSelectedElection(null);
        setSelectedCandidate(null);
        setSelectedPost('');
        fetchDashboardData();
      } else {
        triggerToast(data.message || 'Security Breach: Voting is closed or student has already voted.', 'error');
      }
    } catch (err) {
      triggerToast('Network error during atomic transaction execution.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-white relative">

      {/* Top Floating Toast Notification */}
      {notification.show && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-xl w-full px-4 animate-bounce">
          <div className={`p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-4 ${
            notification.type === 'success'
              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
              : 'bg-rose-600 border-rose-500 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 shrink-0 text-slate-950" />
              ) : (
                <AlertOctagon className="w-6 h-6 shrink-0 text-white animate-pulse" />
              )}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  {notification.type === 'success' ? 'Transaction Success' : 'Database Security Exception'}
                </h4>
                <p className="text-xs font-bold mt-0.5">{notification.message}</p>
              </div>
            </div>

            <button
              onClick={() => setNotification({ show: false, message: '', type: 'error' })}
              className="p-1 rounded-lg hover:bg-black/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase mb-3">
              DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome, {user?.full_name || user?.name || user?.username || 'Student Voter'}
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-3 flex-wrap">
              <span>Reg No: <strong className="text-indigo-400 font-mono">{user?.student_reg_no || 'STU/2026/005'}</strong></span>
              <span>•</span>
              <span>Dept ID: <strong className="text-indigo-400 font-mono">{user?.department_id || 1}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" /> Verified Student Profile
            </span>
            <button
              onClick={fetchDashboardData}
              title="Refresh Dashboard"
              className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Elections</p>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-4xl font-black text-white">{elections.length}</h3>
            <span className="text-xs text-slate-400 font-medium">Ongoing & Completed cycles</span>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department Turnout (UDF)</p>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-4xl font-black text-indigo-400">{Number(turnout).toFixed(2)}%</h3>
            <span className="text-xs text-slate-400 font-medium">PL/pgSQL Calculated</span>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Access</p>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-2xl font-black text-emerald-400">ELIGIBLE</h3>
            <span className="text-xs text-slate-400 font-medium">check_voter_eligibility Pass</span>
          </div>
        </div>
      </div>

      {/* Elections List */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-black text-white mb-1">Campus Elections</h2>
        <p className="text-xs text-slate-400 mb-6">Select an ongoing election cycle below to cast your ballot securely, or view results for completed ones.</p>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading election modules...</div>
        ) : elections.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm bg-slate-900/80 rounded-2xl border border-slate-800">
            No elections found at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {elections.map((election) => {
              const isTimeExpired = election.end_date ? new Date(election.end_date) <= new Date() : false;
              const displayStatus = isTimeExpired ? 'Completed' : election.status;
              const isCompleted = displayStatus?.toLowerCase() === 'completed';

              return (
                <div key={election.election_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-indigo-500/50 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        !isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {displayStatus}
                      </span>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
                        <span className="text-indigo-400 font-bold">{election.total_candidates || 0} Candidates</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" /> ID: #{election.election_id}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{election.title}</h3>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setViewResultsElection(election)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
                    >
                      <BarChart2 className="w-4 h-4 text-indigo-400" /> Results
                    </button>

                    {isCompleted ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" /> Voting Closed
                      </button>
                    ) : election.has_voted ? (
                      <button
                        type="button"
                        onClick={() => triggerToast('Security Breach: Student has already cast a ballot in this election.', 'error')}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-950/40 hover:text-rose-400 transition-all cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" /> Already Voted
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenBallot(election)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        Cast Ballot <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Election Results Modal */}
      {viewResultsElection && (
        <ElectionResultsModal 
          election={viewResultsElection} 
          onClose={() => setViewResultsElection(null)} 
        />
      )}

      {/* 🎯 Official Ballot Modal with Post Selection Dropdown */}
      {selectedElection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => { setSelectedElection(null); setSelectedPost(''); }} 
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-4 mb-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 uppercase">
                Official Electronic Ballot
              </span>
              <h2 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-400" /> {selectedElection.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Select a position/post below, then choose your candidate and submit your vote.</p>
            </div>

            {ballotLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Fetching Candidate List...
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                No candidates registered for this election cycle.
              </div>
            ) : (
              <div className="space-y-6 mb-6">
                
                {/* 🎯 Position Selection Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    Select Position / Post:
                  </label>
                  <select
                    value={selectedPost}
                    onChange={(e) => {
                      setSelectedPost(e.target.value);
                      setSelectedCandidate(null); // Post එක වෙනස් කරද්දී තෝරපු candidate reset කිරීම
                    }}
                    className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-3 text-sm font-bold text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Choose Position (e.g., President, Secretary) --</option>
                    {[...new Set(candidates.map(c => c.post_name))].map(post => (
                      <option key={post} value={post}>{post}</option>
                    ))}
                  </select>
                </div>

                {/* 🎯 Filtered Candidates List according to Selected Dropdown Post */}
                {selectedPost ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {candidates
                      .filter(cand => cand.post_name === selectedPost)
                      .map((cand) => (
                        <div
                          key={cand.candidate_id}
                          onClick={() => setSelectedCandidate(cand.candidate_id)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                            selectedCandidate === cand.candidate_id
                              ? 'bg-indigo-600/20 border-indigo-500 shadow-xl ring-2 ring-indigo-500/50'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                              {cand.post_name}
                            </span>
                            <input
                              type="radio"
                              name="candidate_choice"
                              checked={selectedCandidate === cand.candidate_id}
                              onChange={() => setSelectedCandidate(cand.candidate_id)}
                              className="accent-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <h4 className="text-base font-bold text-white mt-2">{cand.candidate_name}</h4>
                          <p className="text-xs text-slate-400 mt-1">{cand.party_name || 'Independent'}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800/80">
                    Please select a position from the dropdown above to view candidates.
                  </div>
                )}

              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                {selectedCandidate ? 'Candidate Selected ✓' : 'Please select a candidate'}
              </span>

              <button
                disabled={!selectedCandidate || submitting}
                onClick={handleCastVote}
                className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  !selectedCandidate || submitting
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Transacting Vote...
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4" /> Cast Official Vote
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}