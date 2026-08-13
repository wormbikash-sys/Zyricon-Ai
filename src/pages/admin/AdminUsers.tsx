import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import {
  Users,
  Search,
  Shield,
  Crown,
  Ban,
  CheckCircle,
  Trash2,
  RefreshCw,
  Plus,
  RotateCcw,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('[AdminUsers] Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateUser = async (id: string, payload: any) => {
    try {
      const res = await api.updateAdminUser(id, payload);
      setUsers(prev => prev.map(u => (u.id === id ? res.user : u)));
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      try {
        await api.deleteAdminUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (e: any) {
        alert(e.message || 'Delete failed');
      }
    }
  };

  const filtered = users.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">User Management</h1>
          <p className="text-xs text-slate-400">View and manage user accounts, permissions, bans, and daily quotas.</p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Tier / Status</th>
                <th className="p-4">Daily Usage</th>
                <th className="p-4">Total Chats</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const isPremium = u.premium || u.accountType === 'PREMIUM';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-800 bg-slate-950"
                          />
                          <div>
                            <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {u.name}
                              {u.isBanned && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.2 rounded font-semibold uppercase">
                                  BANNED
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleUpdateUser(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                            u.role === 'ADMIN'
                              ? 'bg-indigo-950/80 border-indigo-600/50 text-indigo-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Click to toggle user/admin role"
                        >
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </button>
                      </td>

                      {/* Tier Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleUpdateUser(u.id, { premium: !isPremium })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                            isPremium
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          {isPremium ? 'PRO (Unlimited)' : 'FREE'}
                        </button>
                      </td>

                      {/* Daily Usage */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-200">
                            {u.dailyChatsUsed} / {isPremium ? '∞' : u.dailyChatLimit}
                          </span>
                          <button
                            onClick={() => handleUpdateUser(u.id, { resetDailyUsage: true })}
                            className="p-1 hover:text-indigo-400 text-slate-500"
                            title="Reset daily usage to 0"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Total Chats */}
                      <td className="p-4 font-mono text-slate-300">{u.totalChats || 0}</td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateUser(u.id, { isBanned: !u.isBanned })}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              u.isBanned
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                            }`}
                            title={u.isBanned ? 'Unban User' : 'Ban User'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
