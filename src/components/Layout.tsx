import React, { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Task, UserRole } from '../types';
import {
  ClipboardList,
  Trash2,
  AlertTriangle,
  BarChart3,
  Table2,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Paperclip,
  CheckCircle,
} from 'lucide-react';

const NavItem = ({
  to,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  to: string;
  icon: any;
  label: string;
  active: boolean;
  onClick?: () => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user && !location.pathname.includes('login')) {
      api.getTasks().then((t) =>
        setCompletedTasks(t.filter((x) => x.status === 'completed').slice(0, 10))
      );
    }
  }, [user, location.pathname]);

  if (!user) return <>{children}</>;

  const isAuditor = user.role === UserRole.AUDITOR;
  if (isAuditor && location.pathname !== '/tasks') {
    return <Navigate to="/tasks" replace />;
  }
  const isOwner = user.role === UserRole.OWNER;
  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.OWNER;
  const canAssign = [UserRole.OWNER, UserRole.MANAGER, UserRole.DOER].includes(user.role);
  const canSeeRedZone = [UserRole.OWNER, UserRole.MANAGER, UserRole.DOER].includes(user.role);

  const navItems: { to: string; icon: any; label: string }[] = isAuditor
    ? [{ to: '/tasks', icon: Table2, label: 'Audit Tasks' }]
    : [
        ...(canAssign ? [{ to: '/assign', icon: ClipboardList, label: 'Assign Task' }] : []),
        { to: '/removal', icon: Trash2, label: 'Removal Request' },
        ...(canSeeRedZone ? [{ to: '/redzone', icon: AlertTriangle, label: 'Red Zone' }] : []),
        { to: '/kpi', icon: BarChart3, label: 'KPI' },
        { to: '/tasks', icon: Table2, label: 'Task Table' },
        ...(isOwner ? [{ to: '/members', icon: Users, label: 'Members' }] : []),
        ...(isManager ? [{ to: '/bogus-attachment', icon: Paperclip, label: 'Bogus Attachment' }] : []),
        { to: '/settings', icon: Settings, label: 'Settings' },
      ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold font-serif text-slate-800">
            WhiteRock<span className="text-[10px] align-top ml-0.5 font-sans">TM</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2">Tasks</p>
          <p className="text-xs text-slate-500 mt-1 truncate">{user.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
            />
          ))}
          {!isAuditor && completedTasks.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Completed Tasks</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {completedTasks.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tasks?highlight=${t.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg truncate"
                  >
                    <CheckCircle size={14} className="inline mr-2 text-green-500" />
                    {t.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-lg font-bold font-serif">WhiteRock Tasks</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-bold">Menu</h2>
            <button onClick={() => setMobileOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            {!isAuditor && completedTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500">Completed Tasks</p>
                {completedTasks.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tasks?highlight=${t.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-600"
                  >
                    <CheckCircle size={14} className="inline mr-2 text-green-500" />
                    {t.title}
                  </Link>
                ))}
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 overflow-auto pb-8">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
