import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Holiday, Absence, UserRole } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Calendar, Database, CheckCircle, XCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [absenceFrom, setAbsenceFrom] = useState('');
  const [absenceTo, setAbsenceTo] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbTest, setDbTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [dbTestLoading, setDbTestLoading] = useState(false);

  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.OWNER;

  useEffect(() => {
    api.getHolidays().then(setHolidays);
    api.getAbsences().then(setAbsences);
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayName) return;
    setLoading(true);
    try {
      await api.addHoliday(holidayDate, holidayName);
      setHolidays(await api.getHolidays());
      setHolidayDate('');
      setHolidayName('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Delete this holiday?')) return;
    try {
      await api.deleteHoliday(id);
      setHolidays(await api.getHolidays());
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAbsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !absenceFrom || !absenceTo) return;
    setLoading(true);
    try {
      await api.addAbsence({
        user_id: user.id,
        user_name: user.name,
        from_date: absenceFrom,
        to_date: absenceTo,
        reason: absenceReason,
      });
      setAbsences(await api.getAbsences());
      setAbsenceFrom('');
      setAbsenceTo('');
      setAbsenceReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestDatabase = async () => {
    setDbTest(null);
    setDbTestLoading(true);
    try {
      const [users, tasks, holidaysList] = await Promise.all([
        api.getUsers(),
        api.getTasks(),
        api.getHolidays(),
      ]);
      setDbTest({
        ok: true,
        message: `Connected. Users: ${users.length}, Tasks: ${tasks.length}, Holidays: ${holidaysList.length}`,
      });
    } catch (err: any) {
      setDbTest({
        ok: false,
        message: err?.message || String(err),
      });
    } finally {
      setDbTestLoading(false);
    }
  };

  return (
    <div>
      <section className="mb-10">
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Database size={20} className="text-slate-500" />
            Test database
          </h2>
        <p className="text-sm text-slate-600 mb-4">
          Verify Firestore connection and counts for users, tasks, and holidays.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="secondary"
            onClick={handleTestDatabase}
            isLoading={dbTestLoading}
            disabled={dbTestLoading}
          >
            Test connection
          </Button>
          {dbTest && (
            <span
              className={`flex items-center gap-2 text-sm font-medium ${
                dbTest.ok ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {dbTest.ok ? (
                <CheckCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {dbTest.message}
            </span>
          )}
        </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-slate-500" />
          List of Holidays
        </h2>
        {isManager && (
        <form onSubmit={handleAddHoliday} className="flex flex-wrap gap-4 mb-6">
          <Input
            label="Date"
            type="date"
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
            required
          />
          <Input
            label="Name"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            required
            placeholder="e.g. Diwali"
          />
          <div className="flex items-end">
            <Button type="submit" isLoading={loading}>
              Add Holiday
            </Button>
          </div>
        </form>
        )}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                {isManager && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 3 : 2} className="py-8 px-4 text-center text-slate-500">
                    No holidays added yet.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id}>
                    <td>{h.date}</td>
                    <td className="font-medium text-slate-800">{h.name}</td>
                    {isManager && (
                      <td className="text-right">
                        <Button size="sm" variant="danger" onClick={() => handleDeleteHoliday(h.id)}>
                          Delete
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Mark Myself Absent</h2>
        <p className="text-sm text-slate-600 mb-4">
          When you mark yourself absent, your tasks during that period won&apos;t count in KPI.
        </p>
        <form onSubmit={handleMarkAbsent} className="flex flex-wrap gap-4 max-w-md mb-8">
          <Input
            label="From Date"
            type="date"
            value={absenceFrom}
            onChange={(e) => setAbsenceFrom(e.target.value)}
            required
          />
          <Input
            label="To Date"
            type="date"
            value={absenceTo}
            onChange={(e) => setAbsenceTo(e.target.value)}
            required
          />
          <Input
            label="Reason (optional)"
            value={absenceReason}
            onChange={(e) => setAbsenceReason(e.target.value)}
            placeholder="Leave, sick, etc."
          />
          <div className="flex items-end">
            <Button type="submit" isLoading={loading}>
              Mark Absent
            </Button>
          </div>
        </form>

        <h3 className="font-semibold text-slate-800 mb-3">Absence Records</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {absences.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-slate-500">
                    No absence records yet.
                  </td>
                </tr>
              ) : (
                absences.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{a.user_name}</td>
                    <td className="py-3 px-4 text-slate-700">{a.from_date}</td>
                    <td className="py-3 px-4 text-slate-700">{a.to_date}</td>
                    <td className="py-3 px-4 text-slate-600">{a.reason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
