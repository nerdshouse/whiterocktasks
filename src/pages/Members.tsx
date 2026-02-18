import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { UserPlus, UserMinus } from 'lucide-react';

export const Members: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.DOER);
  const [newUserCity, setNewUserCity] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.OWNER;

  useEffect(() => {
    api.getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        city: newUserCity || undefined,
        phone: newUserPhone || undefined,
      });
      setUsers(await api.getUsers());
      setShowAddForm(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserCity('');
      setNewUserPhone('');
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Remove this member? This cannot be undone.')) return;
    try {
      await api.deleteUser(id);
      setUsers(await api.getUsers());
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Members</h1>
        {isManager && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <UserPlus size={18} className="mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {showAddForm && isManager && (
        <form
          onSubmit={handleAddMember}
          className="mb-8 p-6 bg-white rounded-xl border border-slate-200 max-w-lg"
        >
          <h2 className="font-semibold text-slate-800 mb-4">Add New Member</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="space-y-4">
            <Input
              label="Name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
              placeholder="Full name"
            />
            <Input
              label="Email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
              placeholder="email@company.com"
            />
            <Input
              label="Password"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value={UserRole.OWNER}>Owner</option>
                <option value={UserRole.MANAGER}>Manager</option>
                <option value={UserRole.DOER}>Doer</option>
                <option value={UserRole.AUDITOR}>Auditor</option>
              </select>
            </div>
            <Input
              label="City"
              value={newUserCity}
              onChange={(e) => setNewUserCity(e.target.value)}
              placeholder="City"
            />
            <Input
              label="Phone (for WhatsApp)"
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
              placeholder="+91..."
            />
            <div className="flex gap-2">
              <Button type="submit" isLoading={submitting}>
                Add Member
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl border border-slate-200 shadow-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Name</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Email</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Role</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">City</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Phone</th>
              {isManager && (
                <th className="text-right py-4 px-4 font-semibold text-slate-800">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-800">{u.name}</td>
                <td className="py-3 px-4 text-slate-600">{u.email}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">{u.city || '-'}</td>
                <td className="py-3 px-4 text-slate-600">{u.phone || '-'}</td>
                {isManager && (
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteMember(u.id)}
                      disabled={u.id === user?.id}
                    >
                      <UserMinus size={14} />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
