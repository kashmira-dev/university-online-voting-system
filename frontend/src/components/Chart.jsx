import React from 'react';
import { Trophy, Award, TrendingUp } from 'lucide-react';

const Chart = ({ leaderboard = [], totalVotes = 0 }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl text-center text-slate-400 text-sm">
        No candidate tally data recorded yet for this election.
      </div>
    );
  }

  const maxVotes = Math.max(...leaderboard.map(c => c.votes_count || 0), 1);

  return (
    <div className="glass-card p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Live Candidate Tally & Leaderboard
          </h3>
          <p className="text-xs text-slate-400">Real-time vote count breakdown and percentage share</p>
        </div>
        <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
          Total Votes: {totalVotes}
        </div>
      </div>

      <div className="space-y-5">
        {leaderboard.map((candidate, index) => {
          const isWinner = index === 0 && candidate.votes_count > 0;
          const percentage = totalVotes > 0 ? (((candidate.votes_count || 0) / totalVotes) * 100).toFixed(1) : 0;

          return (
            <div key={candidate.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isWinner 
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {isWinner ? <Award className="w-4 h-4" /> : `#${index + 1}`}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{candidate.name}</span>
                      {isWinner && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Leading Candidate
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{candidate.party} • {candidate.faculty}</p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-white">{candidate.votes_count || 0} votes</div>
                  <div className="text-xs text-indigo-400">{percentage}%</div>
                </div>
              </div>

              {/* Dynamic Bar */}
              <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isWinner 
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-500 shadow-md shadow-indigo-500/30' 
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-400'
                  }`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Chart;
