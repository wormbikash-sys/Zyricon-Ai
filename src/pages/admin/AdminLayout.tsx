import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import {
  Shield,
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Cpu,
  Sliders,
  Crown,
  FileText,
  Settings,
  ArrowLeft,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#090510] text-slate-100 flex items-center justify-center p-4">
        <div className="bg-[#120824] border border-purple-800/40 rounded-2xl p-6 sm:p-8 max-w-md text-center space-y-4 shadow-2xl">
          <Shield className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold">403 - Access Denied</h2>
          <p className="text-xs text-slate-400">
            Administrative privileges are required to access this dashboard.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Chat
          </Link>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Chats', path: '/admin/chats', icon: MessageSquare },
    { label: 'Usage', path: '/admin/usage', icon: BarChart3 },
    { label: 'Models', path: '/admin/models', icon: Cpu },
    { label: 'AI Behavior', path: '/admin/system-prompt', icon: Sliders },
    { label: 'Premium', path: '/admin/premium', icon: Crown },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080312] text-slate-100 flex flex-col md:flex-row w-full max-w-full overflow-x-hidden">
      {/* Mobile Header (Height: 56-64px) */}
      <header className="md:hidden h-14 bg-[#0d061c] border-b border-purple-900/30 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl bg-purple-900/20 hover:bg-purple-800/40 text-purple-200 transition-colors"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="font-extrabold text-sm tracking-tight text-white">Zyricon Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-xl object-cover border border-purple-500/40"
          />
          <Link
            to="/"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-semibold"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Chat</span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer / Desktop Fixed Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[280px] bg-[#0d061c] border-r border-purple-900/30 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 shrink-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/30 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">Zyricon Admin</span>
              <p className="text-[10px] text-purple-400 font-mono">Control Panel</p>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-1.5 rounded-xl bg-purple-900/20 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:bg-purple-900/20 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-purple-900/30 mt-auto space-y-2">
          <div className="p-2.5 rounded-xl bg-[#140a2b] border border-purple-900/40 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-purple-400 font-mono truncate">{user.email}</p>
            </div>
          </div>

          <Link
            to="/"
            onClick={() => setDrawerOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#160b2b] hover:bg-[#20103e] border border-purple-800/40 text-slate-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Chat</span>
          </Link>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar min-w-0 max-w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
