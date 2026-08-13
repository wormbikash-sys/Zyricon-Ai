import React, { useState } from 'react';
import { User } from '../../types';
import {
  X,
  Shield,
  Crown,
  Ban,
  Trash2,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (id: string, payload: any) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [customDays, setCustomDays] = useState<number>(30);
  const [customDailyLimit, setCustomDailyLimit] = useState<number>(
    user.dailyChatLimit || 5
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [showConfirmBan, setShowConfirmBan] = useState<boolean>(false);

  const isPremium = user.premium || user.accountType === 'PREMIUM';

  const handleAction = async (actionName: string, payload: any) => {
    setLoadingAction(actionName);
    try {
      await onUpdate(user.id, payload);
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExtendPremium = async (days: number) => {
    setLoadingAction('extend_premium');
    try {
      await onUpdate(user.id, {
        premium: true,
        accountType: 'PREMIUM',
        extendPremiumDays: days,
      });
    } catch (e: any) {
      alert(e.message || 'Failed to extend premium');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    setLoadingAction('delete');
    try {
      await onDelete(user.id, user.name);
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to delete user');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="bg-[#0f0720] border border-purple-800/40 rounded-3xl w-[calc(100vw-24px)] max-w-[500px] max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-900/30 flex items-center justify-between sticky top-0 bg-[#0f0720]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-2xl object-cover border border-purple-500/30 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1.5">
                {user.name}
                {user.isBanned && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded font-semibold uppercase shrink-0">
                    Banned
                  </span>
                )}
              </h2>
              <p className="text-xs text-purple-300/80 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-purple-900/20 text-slate-400 hover:text-white hover:bg-purple-900/40 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#150a2e] border border-purple-900/40 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Account Type</span>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-amber-400' : 'text-slate-500'}`} />
                {isPremium ? 'PRO Member' : 'Standard Free'}
              </p>
            </div>

            <div className="bg-[#150a2e] border border-purple-900/40 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Daily Quota</span>
              <p className="text-xs font-mono font-bold text-white">
                {user.dailyChatsUsed} / {isPremium ? 'Unlimited' : user.dailyChatLimit}
              </p>
            </div>
          </div>

          {/* Role & Premium Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Role & Access Level</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleAction('role', { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                disabled={loadingAction !== null}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-[#150a2e] border-purple-900/40 text-slate-300 hover:border-purple-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Role: {user.role}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('premium', { premium: !isPremium })}
                disabled={loadingAction !== null}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isPremium
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-[#150a2e] border-purple-900/40 text-slate-300 hover:border-amber-500/40'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{isPremium ? 'Revoke Premium' : 'Grant Premium'}</span>
              </button>
            </div>
          </div>

          {/* Extend Premium Options */}
          {isPremium && (
            <div className="bg-[#150a2e] border border-purple-900/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Extend Subscription
                </span>
                {user.premiumUntil && (
                  <span className="text-[10px] text-purple-400 font-mono">
                    Expires: {new Date(user.premiumUntil).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[7, 30, 90, 365].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleExtendPremium(days)}
                    disabled={loadingAction !== null}
                    className="py-1.5 rounded-lg bg-[#200f40] hover:bg-[#2c1558] border border-purple-800/40 text-[11px] font-bold text-purple-200 transition-colors"
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Daily Quota Management */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Daily Limits & Reset</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={customDailyLimit}
                  onChange={e => setCustomDailyLimit(parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-[#150a2e] border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="Custom limit"
                />
                <button
                  type="button"
                  onClick={() => handleAction('limit', { dailyChatLimit: customDailyLimit })}
                  disabled={loadingAction !== null}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Save Limit
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAction('reset', { resetDailyUsage: true })}
                disabled={loadingAction !== null}
                className="px-3 py-2 rounded-xl bg-[#150a2e] hover:bg-[#200f40] border border-purple-900/40 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Usage
              </button>
            </div>
          </div>

          {/* Dangerous Actions */}
          <div className="pt-3 border-t border-purple-900/30 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Security & Account Status</h3>

            {showConfirmBan ? (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
                <p className="text-rose-200 font-medium">
                  Are you sure you want to {user.isBanned ? 'UNBAN' : 'BAN'} this account?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAction('ban', { isBanned: !user.isBanned });
                      setShowConfirmBan(false);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Confirm {user.isBanned ? 'Unban' : 'Ban'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmBan(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmBan(true)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  user.isBanned
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{user.isBanned ? 'Unban User Account' : 'Ban User Account'}</span>
              </button>
            )}

            {showConfirmDelete ? (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-600/40 space-y-2 text-xs">
                <p className="text-rose-200 font-medium">
                  Permanently delete account and all history for <strong>{user.name}</strong>? This action CANNOT be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loadingAction === 'delete'}
                    className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    {loadingAction === 'delete' ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/40 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete User Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
