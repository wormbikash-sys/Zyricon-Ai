import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { ModelInfo } from '../types';
import ModelSelector from './ModelSelector';
import SettingsModal from './SettingsModal';
import UpgradeModal from './UpgradeModal';
import {
  Sparkles,
  Shield,
  Crown,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  models: ModelInfo[];
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedModel,
  onSelectModel,
  models,
  onToggleSidebar,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dailyUsed = user?.dailyChatsUsed || 0;
  const dailyLimit = user?.dailyChatLimit || 5;
  const isPremium = user?.premium || user?.accountType === 'PREMIUM';

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-900 transition-colors"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                Nexus<span className="text-indigo-400">AI</span>
                {isPremium && (
                  <span className="text-[10px] font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    PRO
                  </span>
                )}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Model Selector */}
        <div className="hidden sm:block max-w-xs w-full">
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            models={models}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Usage Meter */}
          {!isPremium ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300">
                Daily Chats:{' '}
                <strong className={dailyUsed >= dailyLimit ? 'text-amber-400' : 'text-slate-100'}>
                  {dailyUsed} / {dailyLimit}
                </strong>
              </span>
              <button
                onClick={() => setShowUpgrade(true)}
                className="ml-1 text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
              >
                Upgrade
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium">
              <Crown className="w-3.5 h-3.5" />
              <span>Unlimited Usage</span>
            </div>
          )}

          {/* Admin link */}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          )}

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover bg-slate-800"
              />
              <span className="hidden lg:inline-block text-xs font-medium text-slate-200">
                {user?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Role: {user?.role}</span>
                    <span className="capitalize text-indigo-400 font-semibold">{user?.accountType}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowSettings(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Account & Settings
                </button>

                {!isPremium && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowUpgrade(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    Upgrade to Premium
                  </button>
                )}

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
};

export default Navbar;
