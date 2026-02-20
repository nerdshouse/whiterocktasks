import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../services/api';
import { computeKpi, computeKpiByMember } from '../lib/utils';
import { KpiMetrics } from '../types';
import { UserRole } from '../types';

const PIE_COLORS = ['#14b8a6', '#22c55e', '#f59e0b', '#ef4444'];

export const Kpi: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<KpiMetrics | null>(null);
  const [memberRows, setMemberRows] = useState<ReturnType<typeof computeKpiByMember>>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.role === UserRole.OWNER;

  useEffect(() => {
    const load = async () => {
      const [tasks, holidays, absences, users] = await Promise.all([
        api.getTasks(),
        api.getHolidays(),
        api.getAbsences(),
        api.getUsers(),
      ]);
      setMetrics(computeKpi(tasks, holidays, absences, isOwner ? undefined : user?.id));
      setMemberRows(computeKpiByMember(tasks, holidays, absences, users));
      setLoading(false);
    };
    load();
  }, [user?.id, isOwner]);

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (!metrics) return null;

  const pieData = [
    { name: 'On Time Completed', value: metrics.on_time_completed, color: PIE_COLORS[0] },
    { name: 'Late Completed', value: metrics.late_completed, color: PIE_COLORS[1] },
    { name: 'Overdue', value: metrics.overdue_count, color: PIE_COLORS[2] },
    { name: 'Pending', value: Math.max(0, metrics.total_assigned - metrics.on_time_completed - metrics.late_completed - metrics.overdue_count), color: PIE_COLORS[3] },
  ].filter((d) => d.value > 0);

  const summaryRows = [
    { label: 'Total Assigned', value: metrics.total_assigned },
    { label: 'On Time Completed', value: metrics.on_time_completed },
    { label: 'Late Completed', value: metrics.late_completed },
    { label: 'Overdue Tasks', value: metrics.overdue_count },
    { label: 'Overdue %', value: `${metrics.overdue_percent}%` },
    { label: 'Late Completion %', value: `${metrics.late_completion_percent}%` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">KPI Dashboard</h1>
      <p className="text-slate-600 mb-6">
        {isOwner ? 'Full team KPI.' : 'Your personal KPI.'} Tasks on holidays and during absence are excluded.
      </p>

      {pieData.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Task Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse bg-white rounded-xl border border-slate-200 shadow-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Metric</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-800">Value</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-700">{row.label}</td>
                <td className="py-3 px-4 text-right font-medium text-slate-800">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        {isOwner ? 'KPI by Member' : 'My KPI'}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-xl border border-slate-200 shadow-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-4 px-4 font-semibold text-slate-800">Name</th>
              <th className="text-left py-4 px-4 font-semibold text-slate-800">City</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-800">Total Assigned</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-800">On Time</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-800">Late</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-800">Overdue</th>
              <th className="text-right py-4 px-4 font-semibold text-slate-800">Late %</th>
            </tr>
          </thead>
          <tbody>
            {memberRows.filter((r) => isOwner || r.userId === user?.id).map((row) => (
              <tr key={row.userId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-800">{row.userName}</td>
                <td className="py-3 px-4 text-slate-600">{row.city || '-'}</td>
                <td className="py-3 px-4 text-right text-slate-700">{row.total_assigned}</td>
                <td className="py-3 px-4 text-right text-green-600">{row.on_time_completed}</td>
                <td className="py-3 px-4 text-right text-amber-600">{row.late_completed}</td>
                <td className="py-3 px-4 text-right text-red-600">{row.overdue_count}</td>
                <td className="py-3 px-4 text-right font-medium text-slate-800">
                  {row.late_completion_percent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
