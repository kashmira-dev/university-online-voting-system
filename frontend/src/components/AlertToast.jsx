import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const AlertToast = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      title: 'Success'
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
      icon: XCircle,
      iconColor: 'text-rose-400',
      title: 'Action Error'
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      title: 'Security Warning'
    },
    info: {
      bg: 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200',
      icon: Info,
      iconColor: 'text-indigo-400',
      title: 'System Notification'
    }
  };

  const current = styles[type] || styles.info;
  const IconComponent = current.icon;

  return (
    <div className={`fixed top-5 right-5 z-50 max-w-md w-full p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 ${current.bg} flex items-start gap-3.5`}>
      <IconComponent className={`w-6 h-6 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 pr-2">
        <h4 className="text-xs font-bold uppercase tracking-wider mb-1">{current.title}</h4>
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AlertToast;
