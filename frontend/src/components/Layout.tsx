import { ReactNode, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Briefcase, LayoutDashboard, BarChart3, Settings as SettingsIcon, Bell, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { AppNotification } from '../types';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const load = () => api<AppNotification[]>('/api/notifications').then(setNotifs).catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </span>
            <span className="hidden sm:inline">JobTrack AI</span>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                <Icon size={16} /><span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => {
                setOpen((o) => !o);
                if (!open && unread) api('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
              }} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 relative">
                <Bell size={18} />
                {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-2">
                  {notifs.length === 0 && <p className="text-sm text-gray-500 p-3">No notifications yet.</p>}
                  {notifs.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggle} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user?.photoURL && <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />}
            <button onClick={logout} title="Sign out" className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
