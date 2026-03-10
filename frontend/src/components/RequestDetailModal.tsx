import { useState, useEffect } from "react";
import { RequestDetail } from "../types";
import { api } from "../api";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import {
  X, User, Phone, MapPin, HardHat, CalendarDays,
  History, MessageSquare, Send, Loader2,
} from "lucide-react";

interface Props {
  requestId: number;
  onClose: () => void;
}

export default function RequestDetailModal({ requestId, onClose }: Props) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.getRequest(requestId).then(setDetail).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, [requestId]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.addComment(requestId, commentText.trim());
      setCommentText("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div className="card p-8 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {error ? <p className="text-red-600 text-sm">{error}</p> : (
            <>
              <Loader2 size={18} className="animate-spin text-indigo-500" />
              <span className="text-sm text-slate-500">Загрузка...</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800">Заявка #{detail.id}</h2>
            <StatusBadge status={detail.status} />
            <PriorityBadge priority={detail.priority} />
          </div>
          <button onClick={onClose} className="btn-ghost p-2 -mr-2 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={User} label="Клиент" value={detail.clientName} />
            <InfoItem icon={Phone} label="Телефон" value={detail.phone} />
            <InfoItem icon={MapPin} label="Адрес" value={detail.address} />
            {detail.assignedMaster && (
              <InfoItem icon={HardHat} label="Мастер" value={detail.assignedMaster.name} />
            )}
            <InfoItem icon={CalendarDays} label="Создана" value={formatDate(detail.createdAt)} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Описание проблемы</p>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4">{detail.problemText}</p>
          </div>

          {/* Audit Log */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History size={14} className="text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">История действий</h3>
            </div>
            {detail.auditLogs.length === 0 ? (
              <p className="text-slate-400 text-xs">Нет записей</p>
            ) : (
              <div className="space-y-0">
                {detail.auditLogs.map((log, idx) => (
                  <div key={log.id} className="flex gap-3 pb-3 relative">
                    {/* Timeline line */}
                    {idx < detail.auditLogs.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200" />
                    )}
                    <div className="w-[15px] h-[15px] rounded-full bg-indigo-100 border-2 border-indigo-400 mt-0.5 shrink-0 z-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{log.action}</p>
                      {log.details && <p className="text-xs text-slate-500">{log.details}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{log.user.name} / {formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Комментарии</h3>
            </div>
            {detail.comments.length === 0 ? (
              <p className="text-slate-400 text-xs mb-3">Нет комментариев</p>
            ) : (
              <div className="space-y-2 mb-3">
                {detail.comments.map((c) => (
                  <div key={c.id} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-sm text-slate-700">{c.text}</p>
                    <p className="text-xs text-slate-400 mt-1">{c.user.name} / {formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Написать комментарий..."
                className="input text-sm"
              />
              <button
                onClick={handleAddComment}
                disabled={submitting || !commentText.trim()}
                className="btn-primary px-3"
              >
                <Send size={14} />
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-400 shrink-0 mt-0.5">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
