import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', progress }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30'
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-card glass-card-hover p-5 rounded-2xl border flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-white font-display mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${currentTheme} border`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Turnout Rate</span>
            <span className="font-bold text-slate-200">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                color === 'emerald' ? 'bg-emerald-400' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
