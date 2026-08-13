import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { FileText, Clock, RefreshCw, Shield, Sparkles } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data.auditLogs);
    } catch (e) {
      console.error('[AdminAuditLogs] Error loading logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">System Audit Logs</h1>
          <p className="text-xs text-slate-400">Track administrative changes, user role updates, and system prompt edits.</p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d061c] border border-purple-900/40 hover:bg-purple-900/20 text-xs font-semibold text-purple-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mobile Audit Logs Cards */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-purple-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-purple-500" />
            <span>Loading audit history...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 bg-[#0d061c] border border-purple-900/30 rounded-2xl text-center text-xs text-slate-400">
            No administrative audit logs recorded yet.
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="bg-[#0d061c] border border-purple-900/40 rounded-2xl p-3.5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="bg-purple-950 px-2 py-0.5 rounded-lg border border-purple-800/40 font-mono font-bold text-[10px] text-purple-300">
                  {log.action}
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-xs text-slate-200 font-medium">{log.details}</p>

              <div className="flex items-center gap-1.5 text-[10px] text-purple-400 pt-1 border-t border-purple-900/30">
                <Shield className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Admin: <strong className="text-white">{log.adminName || log.adminId}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Audit Logs Table */}
      <div className="hidden md:block bg-[#0d061c] border border-purple-900/40 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120826] border-b border-purple-900/40 text-purple-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/20 text-slate-300 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No administrative audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-purple-900/10 transition-colors">
                    <td className="p-4 text-purple-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-purple-300">{log.adminName || log.adminId}</td>
                    <td className="p-4">
                      <span className="bg-purple-950 px-2.5 py-1 rounded-lg border border-purple-800/40 font-bold text-purple-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-200 font-sans">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
