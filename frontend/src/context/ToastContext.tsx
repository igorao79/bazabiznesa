import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/10",
  error: "bg-red-50 text-red-800 ring-red-600/10",
  info: "bg-sky-50 text-sky-800 ring-sky-600/10",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-sky-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg ring-1 ring-inset
                animate-slide-up ${styles[t.type]}`}
            >
              <Icon size={18} className={`shrink-0 mt-0.5 ${iconStyles[t.type]}`} />
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 opacity-40 hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
