import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertOctagon, Award, X } from 'lucide-react';

export default function BallotPage({ electionId, onBack }) {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });

  useEffect(() => {
    fetchBallotData();
  }, [electionId]);

  const triggerToast = (msg, type = 'error') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'error' });
    }, 6000);
  };

  const fetchBallotData = async () => {
    setLoading(true);
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch(`/api/student/elections/${electionId}/ballot`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setElection(data.election);
        setCandidates(data.candidates || []);
        setHasVoted(data.has_voted || false);
      } else {
        // Fallback: Fetch candidates directly if ballot endpoint structure differs
        const candRes = await fetch(`/api/admin/elections/${electionId}/leaderboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const candData = await candRes.json();
        if (candData.success) {
          setCandidates(candData.leaderboard || []);
        } else {
          triggerToast(data.message || 'Failed to load ballot.', 'error');
        }
      }
    } catch (err) {
      triggerToast('Network error while loading ballot.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVotes = async (e) => {
    e.preventDefault();

    if (!selectedCandidateId) {
      triggerToast('Please select at least one candidate before casting your ballot.', 'error');
      return;
    }

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
          election_id: electionId, 
          candidate_id: parseInt(selectedCandidateId, 10),
          votes: [{ candidate_id: parseInt(selectedCandidateId, 10) }]
        })
      });
      const data = await res.json();

      if (data.success) {
        triggerToast('Votes successfully cast and recorded in immutable database ledger!', 'success');
        setHasVoted(true);
      } else {
        triggerToast(data.message || 'Security Breach: Student has already cast a ballot in this election.', 'error');
      }
    } catch (err) {
      triggerToast('Network error while casting vote.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading secure ballot...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 relative text-white">
      
      {/* Top Floating Popup Toast Notification */}
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

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-[#0f172a] border border-slate-800 px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4" /> PL/pgSQL Double-Voting Protection Active
        </div>
      </div>

      {/* Election Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h1 className="text-2xl font-black text-white">{election?.title || 'Election Ballot'}</h1>
        <p className="text-xs text-slate-300 mt-1">{election?.description || 'Select your preferred candidate and cast your secure ballot.'}</p>
      </div>

      {hasVoted ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Ballot Already Submitted</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            You have already successfully cast your vote in this election cycle. Double-voting is strictly prevented at the database kernel level via unique constraints and triggers.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitVotes} className="space-y-8">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" /> Nominated Candidates
              </h2>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select 1 Candidate</span>
            </div>

            {candidates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">No candidates nominated for this election yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((cand) => {
                  const candidateId = cand.candidate_id;
                  const isSelected = selectedCandidateId === candidateId;
                  const candName = cand.candidate_name || cand.name || 'Candidate Name';
                  const partyName = cand.party_name || 'Independent Alliance';
                  const postName = cand.post_name || 'Nominee';

                  return (
                    <div
                      key={candidateId}
                      onClick={() => setSelectedCandidateId(candidateId)}
                      className={`cursor-pointer border rounded-2xl p-4 flex items-start gap-4 transition-all ${
                        isSelected ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-lg flex-shrink-0">
                        {candName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{candName}</h3>
                        <p className="text-xs text-indigo-300 font-semibold">{partyName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Position: <span className="text-slate-200 font-medium">{postName}</span></p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 ${
                        isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sticky bottom-4 bg-[#0f172a]/95 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-white">
            <p className="text-xs text-slate-300">Review your choice carefully. Votes cannot be changed after submission.</p>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {submitting ? 'Executing Atomic Transaction...' : 'Cast Final Ballot'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}