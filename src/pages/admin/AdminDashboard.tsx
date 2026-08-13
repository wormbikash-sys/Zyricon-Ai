import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AdminStats, AICreditsBalanceInfo } from '../../types';
import {
  Users,
  MessageSquare,
  Zap,
  DollarSign,
  Wallet,
  Crown,
  Activity,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [balance, setBalance] = useState<AICreditsBalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sData, bData] = await Promise.all([
        api.getAdminStats(),
        api.getAICreditsBalance(),
      ]);
      setStats(sData);
      setBalance(bData);
    } catch (err) {
      console.error('[AdminDashboard] Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Sparkles className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">System Overview & Analytics</h1>
          <p className="text-xs text-slate-400">Real-time metrics for users, AI completions, and provider balances.</p>
        </div>

        <button
          onClick={loadDashboardData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* AICredits Wallet Balance Card */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AICredits Gateway Balance</p>
              <h2 className="text-3xl font-black text-slate-100 mt-0.5">
                {balance?.currency || 'INR'} {balance?.balance?.toFixed(2) || '0.00'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${balance?.apiKeyConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                Status: {balance?.status || 'Active'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <p className="text-slate-400">Base Gateway URL:</p>
            <p className="font-mono text-indigo-300 font-semibold">{balance?.endpointUrl}</p>
            <p className="text-[10px] text-slate-500">Official Endpoint: https://api.aicredits.in/v1</p>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid - 2 Column on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0d061c] border border-purple-900/40 rounded-2xl p-3.5 sm:p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-purple-300">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-purple-400 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{stats?.totalUsers || 0}</p>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
            <span>Free: {stats?.freeUsers || 0}</span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5">
              <Crown className="w-3 h-3" /> PRO: {stats?.premiumUsers || 0}
            </span>
          </div>
        </div>

        <div className="bg-[#0d061c] border border-purple-900/40 rounded-2xl p-3.5 sm:p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-purple-300">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Conversations</span>
            <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{stats?.totalConversations || 0}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Msgs: {stats?.totalMessages || 0}</p>
        </div>

        <div className="bg-[#0d061c] border border-purple-900/40 rounded-2xl p-3.5 sm:p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-purple-300">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Today Requests</span>
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{stats?.todayRequests || 0}</p>
          <p className="text-[10px] sm:text-[11px] text-emerald-400 font-medium truncate">Completions today</p>
        </div>

        <div className="bg-[#0d061c] border border-purple-900/40 rounded-2xl p-3.5 sm:p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-purple-300">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Est. AI Cost</span>
            <DollarSign className="w-4 h-4 text-purple-400 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">${stats?.estimatedCost?.toFixed(4) || '0.0000'}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Token usage logs</p>
        </div>
      </div>

      {/* System Status Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Current Platform Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-slate-400 font-medium">Default Model</p>
            <p className="font-mono text-indigo-300 font-bold text-sm mt-1">{stats?.currentModel}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-slate-400 font-medium">System Status</p>
            <p className="text-emerald-400 font-bold text-sm mt-1">{stats?.systemStatus}</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-slate-400 font-medium">Active Users (7 Days)</p>
            <p className="text-slate-100 font-bold text-sm mt-1">{stats?.activeUsers} users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
