import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
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
  Calendar,
  Users,
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

  if (!user) return <>{children}</>;

  const isAuditor = user.role === UserRole.AUDITOR;
  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.OWNER;
  const canAssign = [UserRole.OWNER, UserRole.MANAGER, UserRole.DOER].includes(user.role);

  const navItems: { to: string; icon: any; label: string }[] = [
    ...(canAssign ? [{ to: '/assign', icon: ClipboardList, label: 'Assign Task' }] : []),
    { to: '/removal', icon: Trash2, label: 'Removal Request' },
    { to: '/redzone', icon: AlertTriangle, label: 'Red Zone' },
    { to: '/kpi', icon: BarChart3, label: 'KPI' },
    { to: '/tasks', icon: Table2, label: isAuditor ? 'Audit Tasks' : 'Task Table' },
    { to: '/members', icon: Users, label: 'Members' },
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
