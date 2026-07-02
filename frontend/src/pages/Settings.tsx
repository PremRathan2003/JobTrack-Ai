import { useEffect, useRef, useState } from 'react';
import { Mail, Unplug, Upload, FileText, Trash2, Download } from 'lucide-react';
import { api, apiBase } from '../lib/api';
import { auth } from '../lib/firebase';

interface GmailStatus {
  connected: boolean;
  gmailAddress?: string;
  lastSyncAt?: string | null;
}
interface Doc { id: string; kind: string; filename: string; createdAt: string; }

const card = 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5';

export default function Settings() {
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState('resume');

  const load = () => {
    api<GmailStatus>('/api/gmail/status').then(setGmail).catch(() => {});
    api<Doc[]>('/api/documents').then(setDocs).catch(() => {});
  };
  useEffect(load, []);

  const connect = async () => {
    const { url } = await api<{ url: string }>('/api/gmail/connect');
    window.location.href = url;
  };

  const disconnect = async () => {
    if (!confirm('Disconnect Gmail? Synced data stays; syncing stops.')) return;
    await api('/api/gmail/disconnect', { method: 'DELETE' });
    load();
  };

  const uploadDoc = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    await api('/api/documents', { method: 'POST', body: fd });
    load();
  };

  const download = async (id: string, filename: string) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${apiBase}/api/documents/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await res.blob());
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <Mail size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Gmail Connection</h2>
        </div>
        {gmail?.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connected as <span className="font-medium">{gmail.gmailAddress}</span>
            </p>
            <p className="text-xs text-gray-500">
              Last sync: {gmail.lastSyncAt ? new Date(gmail.lastSyncAt).toLocaleString() : 'never'} ·
              read-only access · syncs hourly
            </p>
            <button onClick={disconnect}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
              <Unplug size={15} /> Disconnect Gmail
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect Gmail to automatically detect job applications. We request <b>read-only</b> access
              and only scan job-related senders (LinkedIn, Indeed, Workday, Greenhouse, Lever, and more).
            </p>
            <button onClick={connect}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              Connect Gmail
            </button>
          </div>
        )}
      </div>

      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Resumes & Cover Letters</h2>
        </div>
        <div className="flex gap-2 mb-4">
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white">
            <option value="resume">Resume</option>
            <option value="cover_letter">Cover letter</option>
          </select>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Upload size={15} /> Upload (max 5 MB)
          </button>
          <input ref={fileRef} type="file" hidden accept=".pdf,.doc,.docx"
            onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
        </div>
        {docs.length === 0 && <p className="text-sm text-gray-500">No documents uploaded.</p>}
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm text-gray-900 dark:text-white">{d.filename}</p>
              <p className="text-xs text-gray-500">{d.kind.replace('_', ' ')} · {new Date(d.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => download(d.id, d.filename)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Download size={15} /></button>
              <button onClick={async () => { await api(`/api/documents/${d.id}`, { method: 'DELETE' }); load(); }}
                className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
