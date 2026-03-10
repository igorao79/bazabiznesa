import { Status, Priority } from "../types";
import { Circle, Clock, PlayCircle, CheckCircle2, XCircle, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";

const statusConfig: Record<Status, { label: string; className: string; icon: typeof Circle }> = {
  new: { label: "Новая", className: "bg-sky-50 text-sky-700 ring-sky-600/20", icon: Circle },
  assigned: { label: "Назначена", className: "bg-amber-50 text-amber-700 ring-amber-600/20", icon: Clock },
  in_progress: { label: "В работе", className: "bg-violet-50 text-violet-700 ring-violet-600/20", icon: PlayCircle },
  done: { label: "Завершена", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: CheckCircle2 },
  canceled: { label: "Отменена", className: "bg-slate-100 text-slate-500 ring-slate-500/20", icon: XCircle },
};

const priorityConfig: Record<Priority, { label: string; className: string; icon: typeof Minus }> = {
  low: { label: "Низкий", className: "bg-slate-50 text-slate-500 ring-slate-400/20", icon: ArrowDown },
  normal: { label: "Обычный", className: "bg-blue-50 text-blue-600 ring-blue-500/20", icon: Minus },
  high: { label: "Высокий", className: "bg-orange-50 text-orange-600 ring-orange-500/20", icon: ArrowUp },
  urgent: { label: "Срочный", className: "bg-red-50 text-red-700 ring-red-600/20", icon: AlertTriangle },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${cfg.className}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = priorityConfig[priority];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset ${cfg.className}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}
