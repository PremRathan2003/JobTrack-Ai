import { Summary } from '../types';
import { FileText, Users, XCircle, Trophy, Clock } from 'lucide-react';

export default function StatsCards({ summary }: { summary: Summary | null }) {
  const cards = [
    { label: 'Total Applications', value: summary?.total, icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
    { label: 'Interviews', value: summary?.interviews, icon: Users, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950' },
    { label: 'Offers', value: summary?.offers, icon: Trophy, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
    { label: 'Rejections', value: summary?.rejections, icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-950' },
    { label: 'Pending', value: summary?.pending, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
            <Icon size={18} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '–'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
