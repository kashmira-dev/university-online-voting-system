import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, X, Users, CheckCircle2, Award } from 'lucide-react';

export default function ElectionResultsModal({ election, onClose }) {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (election?.election_id) {
      fetchResults();
    }
  }, [election?.election_id]);

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

  // 🎯 Calculate Real Total Votes Cast from results array if totalVotes prop/state is zero
  const computedTotal = results.reduce((sum, item) => sum + Number(item.vote_count || 0), 0);
  const displayTotalVotes = totalVotes > 0 ? totalVotes : computedTotal;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-800 pb-4 mb-6">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 uppercase flex items-center gap-1.5 w-fit">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Real-time Election Tally
          </span>
          <h2 className="text-2xl font-black text-white mt-2">{election?.title || 'Election Results'}</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Total Votes Cast: <strong className="text-white font-mono">{displayTotalVotes}</strong>
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
            {results.map((item, index) => {
              const count = Number(item.vote_count || 0);
              
              // 🎯 Compute Percentage dynamically on Frontend
              const computedPct = displayTotalVotes > 0 
                ? ((count / displayTotalVotes) * 100).toFixed(1)
                : Number(item.percentage || 0).toFixed(1);

              return (
                <div key={item.candidate_id || index} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        {item.post_name}
                      </span>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                        {item.candidate_name}
                        {index === 0 && count > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                            <Award className="w-3 h-3" /> Leading
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.party_name || 'Independent'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-indigo-400 font-mono">
                        {count} <span className="text-xs text-slate-400 font-normal">Votes</span>
                      </span>
                      <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">{computedPct}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${computedPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
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