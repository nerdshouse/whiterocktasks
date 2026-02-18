import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Task, UserRole } from '../types';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { isHoliday } from '../lib/utils';
import { Paperclip, Check, X, HelpCircle } from 'lucide-react';

export const TaskTable: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuditor = user?.role === UserRole.AUDITOR;
  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.OWNER;

  useEffect(() => {
    const load = async () => {
      const [t, h] = await Promise.all([api.getTasks(), api.getHolidays()]);
      setTasks(t);
      setHolidays(h);
      setLoading(false);
    };
    load();
  }, []);

  const filteredTasks = isAuditor
    ? tasks.filter((t) => t.status === 'completed')
    : isManager
    ? tasks
    : tasks.filter(
        (t) => t.assigned_to_id === user?.id || t.assigned_by_id === user?.id
      );

  const handleComplete = async (t: Task) => {
    if (!user) return;
    try {
      await api.updateTask(t.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      setTasks(await api.getTasks());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAudit = async (taskId: string, status: 'audited' | 'bogus' | 'unclear') => {
    if (!user) return;
    try {
      await api.setAuditStatus(taskId, status, user.name);
      setTasks(await api.getTasks());
    } catch (err) {
      console.error(err);
    }
  };

  const getPendingDays = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  if (isAuditor) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Auditor View</h1>
        <p className="text-slate-600 mb-6">
          Tasks pending audit. Mark as audited, bogus, or unclear.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">City</th>
                <th className="text-left py-3 px-2">Task</th>
                <th className="text-left py-3 px-2">Attachment</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Pending Days</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    highlightId === t.id ? 'bg-amber-50' : ''
                  }`}
                >
                  <td className="py-3 px-2">{t.assigned_to_name}</td>
                  <td className="py-3 px-2">{t.assigned_to_city || '-'}</td>
                  <td className="py-3 px-2">{t.title}</td>
                  <td className="py-3 px-2">
                    {t.attachment_required ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Paperclip size={14} /> Required
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        t.audit_status === 'audited'
                          ? 'bg-green-100 text-green-800'
                          : t.audit_status === 'bogus'
                          ? 'bg-red-100 text-red-800'
                          : t.audit_status === 'unclear'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.audit_status || 'pending'}
                    </span>
                  </td>
                  <td className="py-3 px-2">{getPendingDays(t.due_date)}</td>
                  <td className="py-3 px-2">
                    {(!t.audit_status || t.audit_status === 'pending') && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleAudit(t.id, 'audited')}
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleAudit(t.id, 'bogus')}
                        >
                          <X size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAudit(t.id, 'unclear')}
                        >
                          <HelpCircle size={14} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Task Table</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-2">Title</th>
              <th className="text-left py-3 px-2">Assigned To</th>
              <th className="text-left py-3 px-2">Due Date</th>
              <th className="text-left py-3 px-2">Priority</th>
              <th className="text-left py-3 px-2">Status</th>
              {!isManager && <th className="text-left py-3 px-2">Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((t) => {
              const onHoliday = isHoliday(t.due_date, holidays);
              return (
                <tr
                  key={t.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    highlightId === t.id ? 'bg-amber-50' : ''
                  } ${onHoliday ? 'bg-orange-50' : ''}`}
                >
                  <td className="py-3 px-2">
                    <span className="font-medium">{t.title}</span>
                    {onHoliday && (
                      <span className="ml-2 text-xs text-orange-600">(Holiday)</span>
                    )}
                  </td>
                  <td className="py-3 px-2">{t.assigned_to_name}</td>
                  <td className="py-3 px-2">{t.due_date}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        t.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : t.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        t.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : t.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  {!isManager && t.assigned_to_id === user?.id && t.status !== 'completed' && (
                    <td className="py-3 px-2">
                      <Button size="sm" variant="success" onClick={() => handleComplete(t)}>
                        Mark Complete
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
