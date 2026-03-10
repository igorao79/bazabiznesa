import { useState } from "react";
import { api } from "../api";
import { Priority } from "../types";
import { Send, CheckCircle2, AlertCircle, User, Phone, MapPin, FileText } from "lucide-react";

export default function CreateRequestPage() {
  const [form, setForm] = useState({
    clientName: "",
    phone: "",
    address: "",
    problemText: "",
    priority: "normal" as Priority,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await api.createRequest(form);
      setSuccess(true);
      setForm({ clientName: "", phone: "", address: "", problemText: "", priority: "normal" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Новая заявка</h1>
        <p className="text-sm text-slate-500 mt-1">Заполните форму для создания заявки в ремонтную службу</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 mb-5 ring-1 ring-inset ring-emerald-600/10">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-sm">Заявка создана. Она появится в панели диспетчера со статусом «Новая».</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-5 ring-1 ring-inset ring-red-600/10">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-slate-400" />
                ФИО клиента
              </span>
            </label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => handleChange("clientName", e.target.value)}
              className="input"
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                Телефон
              </span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="input"
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                Адрес
              </span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="input"
              placeholder="ул. Ленина, д. 10, кв. 5"
              required
            />
          </div>

          <div>
            <label className="label">Приоритет</label>
            <select
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              className="select"
            >
              <option value="low">Низкий</option>
              <option value="normal">Обычный</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">
            <span className="flex items-center gap-1.5">
              <FileText size={14} className="text-slate-400" />
              Описание проблемы
            </span>
          </label>
          <textarea
            value={form.problemText}
            onChange={(e) => handleChange("problemText", e.target.value)}
            rows={4}
            className="input resize-y"
            placeholder="Подробно опишите проблему..."
            required
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
            <Send size={16} />
            {loading ? "Отправка..." : "Создать заявку"}
          </button>
        </div>
      </form>
    </div>
  );
}
