import { Pencil, Trash2 } from 'lucide-react';
import { Application, STATUS_LABELS, STATUS_COLORS } from '../types';

interface Props {
  apps: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

export default function JobTable({ apps, onEdit, onDelete }: Props) {
  if (apps.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center text-gray-500 dark:text-gray-400">
        No applications yet. Connect Gmail in Settings or add one manually.
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            {['Company', 'Role', 'Location', 'Applied', 'Status', 'Last Email', 'Notes', ''].map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.company}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.jobTitle}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a.location || '—'}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmt(a.appliedAt)}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                  {STATUS_LABELS[a.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmt(a.lastEmailAt)}</td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-40 truncate">{a.notes || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1 justify-end">
                  <button onClick={() => onEdit(a)} className="p-1.5 rounded text-gray-400 hover:text-indigo-600"><Pencil size={15} /></button>
                  <button onClick={() => onDelete(a.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
