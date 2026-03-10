import { useState, useEffect } from "react";
import { api } from "../api";
import { RepairRequest, Stats, Status } from "../types";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import RequestDetailModal from "../components/RequestDetailModal";
import {
  Circle, Clock, PlayCircle, CheckCircle2, XCircle,
  Search, RefreshCw, UserPlus, Ban, MapPin, Phone, AlertCircle, Inbox,
} from "lucide-react";

const statusOptions: { value: string; label: string }[] = [
  { value: "", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "assigned", label: "Назначенные" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Завершённые" },
  { value: "canceled", label: "Отменённые" },
];

const statCards = [
  { key: "new", label: "Новые", icon: Circle, color: "text-sky-600", bg: "bg-sky-50" },
  { key: "assigned", label: "Назначенные", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "in_progress", label: "В работе", icon: PlayCircle, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "done", label: "Завершённые", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "canceled", label: "Отменённые", icon: XCircle, color: "text-slate-400", bg: "bg-slate-100" },
];

export default function DispatcherPanel() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [masters, setMasters] = useState<{ id: number; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const [reqs, statsData, mastersData] = await Promise.all([
        api.listRequests(params), api.getStats(), api.getMasters(),
      ]);
      setRequests(reqs);
      setStats(statsData);
      setMasters(mastersData);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter, searchQuery]);

  const handleAssign = async (requestId: number, masterId: number) => {
    setActionLoading(requestId);
    try { await api.assignMaster(requestId, masterId); loadData(); }
    catch (err: any) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (requestId: number) => {
    if (!confirm("Отменить заявку?")) return;
    setActionLoading(requestId);
    try { await api.cancelRequest(requestId); loadData(); }
    catch (err: any) { setError(err.message); }
    finally { setActionLoading(null); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Панель диспетчера</h1>
          <p className="text-sm text-slate-500 mt-0.5">Управление заявками и назначение мастеров</p>
        </div>
        <button onClick={loadData} className="btn-secondary hidden sm:flex">
          <RefreshCw size={15} />
          Обновить
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {statCards.map(({ key, label, icon: Icon, color, bg }) => {
            const count = stats.byStatus[key] || 0;
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(isActive ? "" : key)}
                className={`stat-card group cursor-pointer transition-all duration-150
                  ${isActive ? "ring-2 ring-indigo-400 ring-offset-1 shadow-md" : "hover:shadow-md"}`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-2 mx-auto`}>
                  <Icon size={18} className={color} />
                </div>
                <p className={`text-3xl font-extrabold ${count > 0 ? "text-slate-800" : "text-slate-300"}`}>{count}</p>
                <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm ring-1 ring-inset ring-red-600/10">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-medium">Закрыть</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select sm:w-48">
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по клиенту, адресу, телефону..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="card p-12 text-center">
            <Inbox size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm">Заявки не найдены</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="card-hover p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <button
                      onClick={() => setSelectedRequestId(req.id)}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      #{req.id}
                    </button>
                    <StatusBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{req.clientName}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Phone size={11} />{req.phone}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{req.address}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{req.problemText}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{formatDate(req.createdAt)}</span>
                    {req.assignedMaster && (
                      <span className="inline-flex items-center gap-1 text-indigo-500 font-medium">
                        <UserPlus size={11} />{req.assignedMaster.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {(req.status === "new" || req.status === "assigned") && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAssign(req.id, Number(e.target.value));
                        e.target.value = "";
                      }}
                      disabled={actionLoading === req.id}
                      className="select text-xs py-2 w-full sm:w-44"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        {req.assignedTo ? "Сменить мастера" : "Назначить мастера"}
                      </option>
                      {masters.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                  {req.status !== "done" && req.status !== "canceled" && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      disabled={actionLoading === req.id}
                      className="btn-danger text-xs py-2"
                    >
                      <Ban size={13} />
                      <span className="hidden sm:inline">Отменить</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          onClose={() => { setSelectedRequestId(null); loadData(); }}
        />
      )}
    </div>
  );
}
