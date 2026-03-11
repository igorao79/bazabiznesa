import { ReactNode, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Wrench,
  FilePlus,
  LayoutDashboard,
  ClipboardList,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const roleLabels: Record<string, string> = {
  dispatcher: "Диспетчер",
  master: "Мастер",
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { key: "create", label: "Новая заявка", icon: FilePlus, show: user?.role === "dispatcher" },
    { key: "dispatcher", label: "Панель диспетчера", icon: LayoutDashboard, show: user?.role === "dispatcher" },
    { key: "master", label: "Мои заявки", icon: ClipboardList, show: user?.role === "master" },
  ].filter((i) => i.show);

  const handleNav = (key: string) => {
    onNavigate(key);
    setSidebarOpen(false);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-200/60">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white">
          <Wrench size={18} strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-800">Ремонтная служба</p>
          <p className="text-xs text-slate-400">Управление заявками</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`w-full ${active ? "nav-item-active" : "nav-item-inactive"}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-slate-200/60 px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-200 text-slate-600">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
              <p className="text-xs text-slate-400">{roleLabels[user.role]}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost w-full text-sm justify-start text-slate-500 py-2">
            <LogOut size={16} />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/80">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl animate-sidebar-in">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2 -ml-2">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">Ремонтная служба</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
