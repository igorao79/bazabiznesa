import { useState, useEffect } from "react";
import { api } from "../api";
import { RepairRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import RequestDetailModal from "../components/RequestDetailModal";
import {
  RefreshCw, PlayCircle, CheckCircle2, Phone, MapPin,
  AlertCircle, Inbox, Archive,
} from "lucide-react";

export default function MasterPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const reqs = await api.listRequests({ assignedTo: user.id });
      setRequests(reqs);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleTake = async (requestId: number) => {
    setActionLoading(requestId);
    setError("");
    setSuccessMsg("");
    try {
      await api.takeInWork(requestId);
      setSuccessMsg(`Заявка #${requestId} взята в работу`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (requestId: number) => {
    setActionLoading(requestId);
    setError("");
    setSuccessMsg("");
    try {
      await api.completeRequest(requestId);
      setSuccessMsg(`Заявка #${requestId} завершена`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const activeRequests = requests.filter((r) => r.status !== "done" && r.status !== "canceled");
  const completedRequests = requests.filter((r) => r.status === "done" || r.status === "canceled");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Мои заявки</h1>
          <p className="text-sm text-slate-500 mt-0.5">Назначенные и завершённые заявки</p>
        </div>
        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={15} />
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm ring-1 ring-inset ring-red-600/10">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="font-medium text-red-500 hover:text-red-700">Закрыть</button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm ring-1 ring-inset ring-emerald-600/10">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-medium text-emerald-500 hover:text-emerald-700">Закрыть</button>
        </div>
      )}

      {/* Active */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Активные</h2>
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{activeRequests.length}</span>
      </div>

      <div className="space-y-3 mb-8">
        {activeRequests.length === 0 ? (
          <div className="card p-10 text-center">
            <Inbox size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm">Нет активных заявок</p>
          </div>
        ) : (
          activeRequests.map((req) => (
            <div key={req.id} className="card-hover p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
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
                  <p className="text-xs text-slate-400 mt-2">{formatDate(req.createdAt)}</p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {req.status === "assigned" && (
                    <button
                      onClick={() => handleTake(req.id)}
                      disabled={actionLoading === req.id}
                      className="btn-primary text-xs whitespace-nowrap"
                    >
                      <PlayCircle size={14} />
                      {actionLoading === req.id ? "..." : "Взять в работу"}
                    </button>
                  )}
                  {req.status === "in_progress" && (
                    <button
                      onClick={() => handleComplete(req.id)}
                      disabled={actionLoading === req.id}
                      className="btn-success text-xs whitespace-nowrap"
                    >
                      <CheckCircle2 size={14} />
                      {actionLoading === req.id ? "..." : "Завершить"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completed */}
      {completedRequests.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Archive size={14} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Архив</h2>
            <span className="text-xs text-slate-400">({completedRequests.length})</span>
          </div>
          <div className="space-y-2">
            {completedRequests.map((req) => (
              <div key={req.id} className="card p-4 opacity-60 hover:opacity-80 transition-opacity">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedRequestId(req.id)}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    #{req.id}
                  </button>
                  <StatusBadge status={req.status} />
                  <PriorityBadge priority={req.priority} />
                  <span className="text-sm text-slate-600 ml-1">{req.clientName}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedRequestId && (
        <RequestDetailModal
          requestId={selectedRequestId}
          onClose={() => { setSelectedRequestId(null); loadData(); }}
        />
      )}
    </div>
  );
}
