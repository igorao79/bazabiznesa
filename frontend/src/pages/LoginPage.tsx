import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Wrench, LogIn, LayoutDashboard, HardHat, AlertCircle, ChevronRight } from "lucide-react";

const quickAccounts = [
  { user: "dispatcher", pass: "dispatcher123", label: "Диспетчер", name: "Иванова Мария Петровна", icon: LayoutDashboard, color: "text-indigo-600 bg-indigo-50" },
  { user: "master1", pass: "master123", label: "Мастер 1", name: "Сидоров Алексей Иванович", icon: HardHat, color: "text-emerald-600 bg-emerald-50" },
  { user: "master2", pass: "master123", label: "Мастер 2", name: "Козлов Дмитрий Сергеевич", icon: HardHat, color: "text-emerald-600 bg-emerald-50" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (user: string, pass: string) => {
    setError("");
    setLoading(true);
    try {
      await login(user, pass);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-100/60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Wrench size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ремонтная служба</h1>
          <p className="text-slate-500 mt-1 text-sm">Система управления заявками</p>
        </div>

        {/* Login form */}
        <div className="card p-6 sm:p-8 mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Введите логин"
              />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Введите пароль"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ring-red-600/10">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <LogIn size={16} />
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>

        {/* Quick access */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Тестовые аккаунты</p>
          <div className="space-y-2">
            {quickAccounts.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.user}
                  onClick={() => quickLogin(acc.user, acc.pass)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                             transition-all duration-150 hover:bg-slate-50 active:bg-slate-100
                             disabled:opacity-50 group"
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${acc.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{acc.label}</p>
                    <p className="text-xs text-slate-400 truncate">{acc.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
