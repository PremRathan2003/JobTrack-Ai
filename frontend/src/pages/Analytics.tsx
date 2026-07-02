import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../lib/api';
import { Summary, STATUS_LABELS, AppStatus } from '../types';

const PIE_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#a855f7', '#818cf8', '#06b6d4', '#22c55e', '#ef4444', '#6b7280'];

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<Array<{ month: string; count: number }>>([]);
  const [topCompanies, setTopCompanies] = useState<Array<{ company: string; count: number }>>([]);

  useEffect(() => {
    Promise.all([
      api<Summary>('/api/analytics/summary'),
      api<typeof monthly>('/api/analytics/monthly'),
      api<typeof topCompanies>('/api/analytics/top-companies'),
    ]).then(([s, m, t]) => { setSummary(s); setMonthly(m); setTopCompanies(t); })
      .catch(console.error);
  }, []);

  const statusData = summary
    ? Object.entries(summary.statusDistribution).map(([k, v]) => ({
        name: STATUS_LABELS[k as AppStatus] || k, value: v,
      }))
    : [];

  const card = 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4';

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Applications per Month</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={card}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Companies</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCompanies} layout="vertical">
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis type="category" dataKey="company" width={110} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={card + ' flex flex-col items-center justify-center'}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Interview Success Rate</h2>
          <p className="text-5xl font-bold text-indigo-600">{summary?.interviewSuccessRate ?? 0}%</p>
          <p className="text-xs text-gray-500 mt-2">Offers ÷ interviews</p>
        </div>
      </div>
    </div>
  );
}
