import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/authContext';
import { api } from '../services/api';
import {
  X,
  User,
  Shield,
  Zap,
  Trash2,
  Crown,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    api.getUserUsage()
      .then(data => setUsageStats(data))
      .catch(console.error)
      .finally(() => setLoadingUsage(false));
  }, []);

  const handleDeleteAccount = async () => {
    if (confirm('CRITICAL WARNING: Are you sure you want to permanently delete your account? All conversations, messages, and settings will be irrevocably deleted.')) {
      try {
        await api.deleteAccount();
        await logout();
        window.location.href = '/login';
      } catch (err: any) {
        alert(err.message || 'Failed to delete account');
      }
    }
  };

  const isPremium = user?.premium || user?.accountType === 'PREMIUM';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-indigo-400" />
          Account & Preferences
        </h3>

        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-800"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-slate-100 truncate">{user?.name}</h4>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">
                  Role: {user?.role}
                </span>
                {isPremium ? (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-semibold uppercase flex items-center gap-1">
                    <Crown className="w-3 h-3" /> PREMIUM
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">
                    FREE PLAN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Usage Meter */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Daily Usage Stats
            </h4>

            {loadingUsage ? (
              <p className="text-xs text-slate-500">Loading usage statistics...</p>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Daily Chats Used Today</span>
                  <span className="font-semibold text-slate-100">
                    {usageStats?.dailyChatsUsed || user?.dailyChatsUsed || 0} / {isPremium ? 'Unlimited' : (user?.dailyChatLimit || 5)}
                  </span>
                </div>
                {!isPremium && (
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          ((usageStats?.dailyChatsUsed || user?.dailyChatsUsed || 0) / (user?.dailyChatLimit || 5)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                  <span>Total Lifetime Conversations</span>
                  <span>{user?.totalChats || 0} chats</span>
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h4>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Permanently Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
