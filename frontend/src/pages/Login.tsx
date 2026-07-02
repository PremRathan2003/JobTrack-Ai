import { Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
          <Briefcase className="text-white" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">JobTrack AI</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">
          Automatically track your job applications from your inbox.
        </p>
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-700 rounded-lg py-3 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35.4 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
