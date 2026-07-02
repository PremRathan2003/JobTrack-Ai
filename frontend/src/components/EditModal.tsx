import { useState } from 'react';
import { X } from 'lucide-react';
import { Application, AppStatus, STATUS_LABELS } from '../types';

interface Props {
  app: Partial<Application> | null; // null = closed; {} = new record
  onSave: (data: Partial<Application>) => Promise<void>;
  onClose: () => void;
}

const input =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function EditModal({ app, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    company: app?.company || '',
    jobTitle: app?.jobTitle || '',
    location: app?.location || '',
    status: (app?.status || 'APPLIED') as AppStatus,
    appliedAt: app?.appliedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    notes: app?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  if (!app) return null;

  const submit = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {app.id ? 'Edit Application' : 'Add Application'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input className={input} placeholder="Company *" value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <input className={input} placeholder="Job title *" value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
          <input className={input} placeholder="Location" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className={input} value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AppStatus })}>
              {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <input type="date" className={input} value={form.appliedAt}
              onChange={(e) => setForm({ ...form, appliedAt: e.target.value })} />
          </div>
          <textarea className={input} rows={3} placeholder="Notes" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={submit} disabled={saving || !form.company || !form.jobTitle}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
