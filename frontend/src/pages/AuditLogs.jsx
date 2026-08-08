import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Search, Activity, Globe } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    const token = localStorage.getItem('vote_token');
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.client_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(log.user_id).includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] border border-slate-800 p-8 shadow-2xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Immutable Security Audit Trail
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">System Activity & Audit Logs</h1>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition-all shadow-lg flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Trail
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Transactional Audit Records
          </h2>
          
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Log ID</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Action Description</th>
                <th className="p-4">Client IP</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-16 text-slate-400">Loading logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-16 text-slate-400 italic">No audit log records found.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-900/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-400">#{log.log_id}</td>
                    <td className="p-4 font-mono text-slate-300">{log.user_id || 'System'}</td>
                    <td className="p-4 font-medium text-white">{log.action_description}</td>
                    <td className="p-4 font-mono text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-500" /> {log.client_ip || '127.0.0.1'}
                    </td>
                    <td className="p-4 text-slate-300">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}