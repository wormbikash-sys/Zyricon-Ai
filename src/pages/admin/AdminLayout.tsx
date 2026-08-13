import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import {
  Shield,
  LayoutDashboard,
  Users,
  Cpu,
  Sliders,
  FileText,
  Activity,
  ArrowLeft,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#090510] text-slate-100 flex items-center justify-center p-4">
        <div className="bg-[#120824] border border-purple-800/40 rounded-2xl p-6 sm:p-8 max-w-md text-center space-y-4">
          <Shield className="w-12 h-12 text-rose-500 mx-auto" />
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
    { label: 'Overview & Stats', path: '/admin', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Model Catalog', path: '/admin/models', icon: Cpu },
    { label: 'AI Behavior', path: '/admin/system-prompt', icon: Sliders },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { label: 'System Health', path: '/admin/health', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#080312] text-slate-100 flex flex-col md:flex-row w-full max-w-full overflow-x-hidden">
      {/* Admin Sidebar / Top Nav on Mobile */}
      <aside className="w-full md:w-64 bg-[#0d061c] border-b md:border-b-0 md:border-r border-purple-900/30 flex flex-col shrink-0">
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

          <Link
            to="/"
            className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 text-slate-300 text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Chat</span>
          </Link>
        </div>

        <nav className="p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto custom-scrollbar shrink-0">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
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

        <div className="hidden md:block p-4 border-t border-purple-900/30 mt-auto">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#160b2b] hover:bg-[#20103e] border border-purple-800/40 text-slate-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to User Workspace</span>
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
