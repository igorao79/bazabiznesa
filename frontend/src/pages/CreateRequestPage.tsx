import { useState } from "react";
import { api } from "../api";
import { Priority } from "../types";
import { useToast } from "../context/ToastContext";
import { Send, AlertCircle, User, Phone, MapPin, FileText } from "lucide-react";

type FieldErrors = {
  clientName?: string;
  phone?: string;
  address?: string;
  problemText?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
      <AlertCircle size={12} className="shrink-0" />
      {message}
    </p>
  );
}

export default function CreateRequestPage() {
  const [form, setForm] = useState({
    clientName: "",
    phone: "",
    address: "",
    problemText: "",
    priority: "normal" as Priority,
  });
  const { toast } = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const validate = (values: typeof form): FieldErrors => {
    const e: FieldErrors = {};
    if (!values.clientName.trim()) e.clientName = "Укажите ФИО клиента";
    if (!values.phone.trim()) e.phone = "Укажите номер телефона";
    else if (values.phone.replace(/\D/g, "").length < 7) e.phone = "Номер слишком короткий";
    if (!values.address.trim()) e.address = "Укажите адрес";
    if (!values.problemText.trim()) e.problemText = "Опишите проблему";
    else if (values.problemText.trim().length < 10) e.problemText = "Описание слишком короткое (мин. 10 символов)";
    return e;
  };

  const handleChange = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) {
      setErrors((prev) => {
        const updated = validate(next);
        return { ...prev, [field]: updated[field as keyof FieldErrors] };
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validate(form);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field as keyof FieldErrors] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    setTouched({ clientName: true, phone: true, address: true, problemText: true });

    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await api.createRequest(form);
      toast("success", "Заявка создана. Она появится в панели диспетчера со статусом «Новая».");
      setForm({ clientName: "", phone: "", address: "", problemText: "", priority: "normal" });
      setTouched({});
      setErrors({});
    } catch (err: any) {
      toast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: keyof FieldErrors) =>
    `input ${errors[field] && touched[field] ? "border-red-400 ring-2 ring-red-100 focus:ring-red-200 focus:border-red-400" : ""}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Новая заявка</h1>
        <p className="text-sm text-slate-500 mt-1">Заполните форму для создания заявки в ремонтную службу</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="card p-6 space-y-5">
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
              onBlur={() => handleBlur("clientName")}
              className={fieldClass("clientName")}
              placeholder="Иванов Иван Иванович"
            />
            <FieldError message={touched.clientName ? errors.clientName : undefined} />
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
              onBlur={() => handleBlur("phone")}
              className={fieldClass("phone")}
              placeholder="+7 (999) 123-45-67"
            />
            <FieldError message={touched.phone ? errors.phone : undefined} />
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
              onBlur={() => handleBlur("address")}
              className={fieldClass("address")}
              placeholder="ул. Ленина, д. 10, кв. 5"
            />
            <FieldError message={touched.address ? errors.address : undefined} />
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
            onBlur={() => handleBlur("problemText")}
            rows={4}
            className={`${fieldClass("problemText")} resize-none`}
            placeholder="Подробно опишите проблему..."
          />
          <FieldError message={touched.problemText ? errors.problemText : undefined} />
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
