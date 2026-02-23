import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { RECURRING_OPTIONS, PRIORITY_OPTIONS } from '../lib/utils';
import { User, Task, RecurringType, TaskPriority } from '../types';
import { UserRole } from '../types';

export const AssignTask: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [attachmentRequired, setAttachmentRequired] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'media' | 'text'>('media');
  const [attachmentDesc, setAttachmentDesc] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [assignedToId, setAssignedToId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [holidays, setHolidays] = useState<{ date: string }[]>([]);

  useEffect(() => {
    if (user?.role === UserRole.AUDITOR) {
      navigate('/tasks');
      return;
    }
    Promise.all([api.getUsers(), api.getHolidays()]).then(([u, h]) => {
      setUsers(u);
      setHolidays(h);
    });
  }, [user?.role, navigate]);

  useEffect(() => {
    if (attachmentRequired) setShowAttachmentModal(true);
    else { setAttachmentDesc(''); setAttachmentType('media'); }
  }, [attachmentRequired]);

  const DAYS = [
    { value: 0, label: 'Mon' },
    { value: 1, label: 'Tue' },
    { value: 2, label: 'Wed' },
    { value: 3, label: 'Thu' },
    { value: 4, label: 'Fri' },
    { value: 5, label: 'Sat' },
    { value: 6, label: 'Sun' },
  ];
  const toggleDay = (d: number) => {
    setRecurringDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignedToId) return;
    setLoading(true);
    setSuccess('');
    try {
      const assignee = users.find((u) => u.id === assignedToId);
      const isHoliday = holidays.some((h) => h.date === dueDate);
      const task: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title,
        description,
        start_date: startDate || undefined,
        due_date: dueDate,
        priority,
        status: 'pending',
        recurring,
        recurring_days: recurring === 'daily' && recurringDays.length > 0 ? recurringDays : undefined,
        attachment_required: attachmentRequired,
        attachment_type: attachmentRequired ? attachmentType : undefined,
        attachment_description: attachmentRequired ? attachmentDesc : undefined,
        assigned_to_id: assignedToId,
        assigned_to_name: assignee?.name || '',
        assigned_to_city: assignee?.city,
        assigned_by_id: user.id,
        assigned_by_name: user.name,
        is_holiday: isHoliday,
      };
      const created = await api.createTask(task);
      const assigneeUser = users.find((u) => u.id === assignedToId);
      if (assigneeUser?.phone) {
        const link = `${window.location.origin}/#/tasks?highlight=${created.id}`;
        await api.sendTaskAssignmentWhatsApp(assigneeUser.phone, {
          title: created.title,
          due_date: created.due_date,
          priority: created.priority,
          link,
          assigned_by: user.name,
        });
      }
      setSuccess('Task assigned successfully!');
      setTitle('');
      setDescription('');
      setStartDate('');
      setDueDate('');
      setPriority('medium');
      setRecurring('none');
      setRecurringDays([]);
      setAttachmentRequired(false);
      setAttachmentDesc('');
      setAssignedToId('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (user?.role === UserRole.AUDITOR) return null;

  return (
    <div>
      <h1 className="page-title">Assign Task</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Enter task title"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Task description..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            min={startDate || today}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-teal-500"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Recurring</label>
          <select
            value={recurring}
            onChange={(e) => setRecurring(e.target.value as RecurringType)}
            className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-teal-500"
          >
            {RECURRING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {recurring === 'daily' && (
            <div className="mt-2">
              <p className="text-xs text-slate-600 mb-2">On which days of the week?</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      recurringDays.includes(d.value)
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="attachment"
            checked={attachmentRequired}
            onChange={(e) => setAttachmentRequired(e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="attachment" className="text-sm font-medium text-slate-700">
            Attachment required
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            required
            className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Select member</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.city ? `(${u.city})` : ''}
              </option>
            ))}
          </select>
        </div>
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>
        )}
        <Button type="submit" isLoading={loading}>
          Save & Assign
        </Button>
      </form>

      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Attachment Required</h3>
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Type</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="attachmentType"
                      checked={attachmentType === 'media'}
                      onChange={() => setAttachmentType('media')}
                      className="text-teal-600"
                    />
                    <span>Media (photo/video upload)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="attachmentType"
                      checked={attachmentType === 'text'}
                      onChange={() => setAttachmentType('text')}
                      className="text-teal-600"
                    />
                    <span>Text</span>
                  </label>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Description (optional)</p>
                <textarea
                  value={attachmentDesc}
                  onChange={(e) => setAttachmentDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="e.g. Photo of completed work..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAttachmentModal(false)}>Close</Button>
              <Button onClick={() => setShowAttachmentModal(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
