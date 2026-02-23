import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Task } from '../types';
import { UserRole } from '../types';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const RedZone: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const all = await api.getTasks();
    const today = new Date().toISOString().split('T')[0];
    const overdue = all.filter(
      (t) =>
        (t.status === 'pending' || t.status === 'overdue') &&
        t.due_date < today
    );
    setTasks(overdue);
    setLoading(false);
  };

  const isOwner = user?.role === UserRole.OWNER;
  const isManager = user?.role === UserRole.MANAGER;
  const isDoer = user?.role === UserRole.DOER;
  const filtered = isOwner
    ? tasks
    : isManager
    ? tasks
    : isDoer
    ? tasks.filter((t) => t.assigned_to_id === user?.id)
    : [];

  if (loading) return <div className="text-slate-500">Loading...</div>;

  if (filtered.length === 0 && !loading) {
    return (
      <div>
        <h1 className="page-title flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} />
          Red Zone (Overdue Tasks)
        </h1>
        <p className="page-subtitle">
          Tasks that are past their due date and not yet completed.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-800">
          No overdue tasks. Great job!
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} />
          Red Zone (Overdue Tasks)
        </h1>
        <p className="page-subtitle">
          Tasks that are past their due date and not yet completed.
        </p>
      {filtered.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-800">
          No overdue tasks. Great job!
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const daysOverdue = Math.ceil(
              (new Date().getTime() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <Link
                key={t.id}
                to={`/tasks?highlight=${t.id}`}
                className="block p-4 bg-white rounded-xl border-l-4 border-red-500 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">{t.title}</p>
                    <p className="text-sm text-slate-500">
                      Assigned to {t.assigned_to_name} • Due {t.due_date} • {daysOverdue} day(s)
                      overdue
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                    {t.priority}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
