import { Search } from 'lucide-react';
import { AppStatus, STATUS_LABELS } from '../types';

export interface FilterState {
  search: string;
  status: string;
  company: string;
  from: string;
  to: string;
  sort: string;
}

interface Props {
  filters: FilterState;
  companies: string[];
  onChange: (f: FilterState) => void;
}

const input =
  'rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function Filters({ filters, companies, onChange }: Props) {
  const set = (k: keyof FilterState, v: string) => onChange({ ...filters, [k]: v });
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-48">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={filters.search} onChange={(e) => set('search', e.target.value)}
          placeholder="Search company, role, location…" className={`${input} w-full pl-9`} />
      </div>
      <select value={filters.status} onChange={(e) => set('status', e.target.value)} className={input}>
        <option value="">All statuses</option>
        {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <select value={filters.company} onChange={(e) => set('company', e.target.value)} className={input}>
        <option value="">All companies</option>
        {companies.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className={input} />
      <input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className={input} />
      <select value={filters.sort} onChange={(e) => set('sort', e.target.value)} className={input}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="company">Company A–Z</option>
        <option value="status">By status</option>
      </select>
    </div>
  );
}
