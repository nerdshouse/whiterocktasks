import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Task } from '../types';
import { Button } from '../components/ui/Button';
import { Paperclip, Check, X, HelpCircle } from 'lucide-react';

export const BogusAttachment: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTasks().then((t) => {
      setTasks(t.filter((x) => x.attachment_required && x.status === 'completed'));
      setLoading(false);
    });
  }, []);

  const handleAudit = async (taskId: string, status: 'audited' | 'bogus' | 'unclear') => {
    if (!user) return;
    try {
      await api.setAuditStatus(taskId, status, user.name);
      setTasks(await api.getTasks().then((t) =>
        t.filter((x) => x.attachment_required && x.status === 'completed')
      ));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Paperclip size={24} />
        Bogus Attachment
      </h1>
      <p className="text-slate-600 mb-6">
        Review completed tasks with required attachments. Mark as audited, bogus, or unclear.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl border border-slate-200 shadow-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Task</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Assigned To</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Attachment Type</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Status</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                  No completed tasks with required attachments.
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{t.title}</td>
                  <td className="py-3 px-4 text-slate-600">{t.assigned_to_name}</td>
                  <td className="py-3 px-4 text-slate-600">{t.attachment_description || '-'}</td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4 text-right">
                    {(!t.audit_status || t.audit_status === 'pending') ? (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="success" onClick={() => handleAudit(t.id, 'audited')}>
                          <Check size={14} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleAudit(t.id, 'bogus')}>
                          <X size={14} />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleAudit(t.id, 'unclear')}>
                          <HelpCircle size={14} />
                        </Button>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
