import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import {
  Users,
  Search,
  Shield,
  Crown,
  Ban,
  Trash2,
  RotateCcw,
  Sliders,
  Sparkles,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
      if (selectedUser?.id === id) {
        setSelectedUser(res.user);
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    try {
      await api.deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (selectedUser?.id === id) {
        setSelectedUser(null);
      }
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  const filtered = users.filter(
    u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">User Management</h1>
          <p className="text-xs text-slate-400">View and manage user accounts, permissions, bans, and daily quotas.</p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name, email..."
            className="w-full bg-[#0d061c] border border-purple-900/40 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
      )}

      {/* Mobile Users View (Cards) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-purple-300 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-purple-500" />
            <span>Loading user accounts...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 bg-[#0d061c] border border-purple-900/30 rounded-2xl text-center text-xs text-slate-400">
            No users match search query.
          </div>
        ) : (
          filtered.map(u => {
            const isPremium = u.premium || u.accountType === 'PREMIUM';
            return (
              <div
                key={u.id}
                className="bg-[#0d061c] border border-purple-900/40 rounded-2xl p-4 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-9 h-9 rounded-xl object-cover border border-purple-500/30 bg-purple-950 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                        {u.name}
                        {u.isBanned && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.2 rounded font-semibold uppercase shrink-0">
                            BANNED
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-purple-300/80 truncate">{u.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isPremium
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-purple-950 border-purple-800/40 text-purple-300'
                    }`}
                  >
                    {isPremium ? 'PRO' : 'FREE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-2 border-t border-purple-900/30">
                  <div>
                    <span className="text-purple-400">Role:</span>{' '}
                    <strong className="text-white">{u.role}</strong>
                  </div>
                  <div>
                    <span className="text-purple-400">Quota:</span>{' '}
                    <strong className="font-mono text-white">
                      {u.dailyChatsUsed}/{isPremium ? '∞' : u.dailyChatLimit}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(u)}
                  className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Manage User Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Users Table View */}
      <div className="hidden md:block bg-[#0d061c] border border-purple-900/40 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120826] border-b border-purple-900/40 text-purple-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Daily Usage</th>
                <th className="p-4">Total Chats</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/20 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const isPremium = u.premium || u.accountType === 'PREMIUM';
                  return (
                    <tr key={u.id} className="hover:bg-purple-900/10 transition-colors">
                      {/* User Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-purple-900 bg-purple-950"
                          />
                          <div>
                            <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {u.name}
                              {u.isBanned && (
                                <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                                  BANNED
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-purple-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-purple-800/40 bg-purple-950/60 text-purple-300 flex items-center gap-1 w-fit">
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 w-fit ${
                          isPremium
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-purple-950 border-purple-800/40 text-slate-400'
                        }`}>
                          <Crown className="w-3 h-3" />
                          {isPremium ? 'PRO (Unlimited)' : 'FREE'}
                        </span>
                      </td>

                      {/* Daily Usage */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-mono text-slate-200">
                          {u.dailyChatsUsed} / {isPremium ? '∞' : u.dailyChatLimit}
                          <button
                            onClick={() => handleUpdateUser(u.id, { resetDailyUsage: true })}
                            className="p-1 hover:text-purple-400 text-slate-500"
                            title="Reset daily usage to 0"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Total Chats */}
                      <td className="p-4 font-mono text-slate-300">{u.totalChats || 0}</td>

                      {/* Manage Button */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
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
