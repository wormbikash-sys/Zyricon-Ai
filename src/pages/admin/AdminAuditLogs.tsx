import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { FileText, Clock, RefreshCw } from 'lucide-react';

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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">System Audit Activity Logs</h1>
          <p className="text-xs text-slate-400">Track administrative changes, user role updates, and system prompt edits.</p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">
                    No administrative audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                    <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-indigo-300">{log.adminName || log.adminId}</td>
                    <td className="p-4">
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{log.details}</td>
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
