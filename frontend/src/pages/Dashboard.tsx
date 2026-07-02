import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Download, RefreshCw } from 'lucide-react';
import { api, apiBase } from '../lib/api';
import { auth } from '../lib/firebase';
import { Application, Summary } from '../types';
import StatsCards from '../components/StatsCards';
import Filters, { FilterState } from '../components/Filters';
import JobTable from '../components/JobTable';
import EditModal from '../components/EditModal';

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Partial<Application> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '', status: '', company: '', from: '', to: '', sort: 'newest',
  });

  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), sort: filters.sort });
    Object.entries(filters).forEach(([k, v]) => v && k !== 'sort' && p.set(k, v));
    return p.toString();
  }, [filters, page]);

  const load = useCallback(async () => {
    const [s, list] = await Promise.all([
      api<Summary>('/api/analytics/summary'),
      api<{ items: Application[]; total: number }>(`/api/applications?${query}`),
    ]);
    setSummary(s); setApps(list.items); setTotal(list.total);
  }, [query]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const companies = useMemo(
    () => [...new Set(apps.map((a) => a.company))].sort(),
    [apps]
  );

  const save = async (data: Partial<Application>) => {
    if (editing?.id) {
      await api(`/api/applications/${editing.id}`, { method: 'PATCH', body: JSON.stringify(data) });
    } else {
      await api('/api/applications', { method: 'POST', body: JSON.stringify(data) });
    }
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    await api(`/api/applications/${id}`, { method: 'DELETE' });
    await load();
  };

  const sync = async () => {
    setSyncing(true);
    try { await api('/api/gmail/sync', { method: 'POST' }); await load(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Sync failed'); }
    finally { setSyncing(false); }
  };

  const exportCsv = async () => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${apiBase}/api/export/csv`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'applications.csv';
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={sync} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> Sync Gmail
          </button>
          <button onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setEditing({})}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      <StatsCards summary={summary} />
      <Filters filters={filters} companies={companies} onChange={(f) => { setFilters(f); setPage(1); }} />
      <JobTable apps={apps} onEdit={setEditing} onDelete={remove} />

      {total > 25 && (
        <div className="flex justify-center gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 text-gray-700 dark:text-gray-200">Previous</button>
          <span className="px-3 py-1.5 text-gray-500">Page {page} of {Math.ceil(total / 25)}</span>
          <button disabled={page >= Math.ceil(total / 25)} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 text-gray-700 dark:text-gray-200">Next</button>
        </div>
      )}

      {editing !== null && <EditModal app={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}
