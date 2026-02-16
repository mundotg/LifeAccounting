import { FormEvent } from "react";
import { CurrencyType, TransactionType } from "@prisma/client";
import { Locale, t } from "@/lib/i18n";

interface FormState {
  type: TransactionType;
  amount: string;
  description: string;
  moeda: CurrencyType;
}

interface TransactionFormProps {
  locale: Locale;
  showForm: boolean;
  form: FormState;
  setForm: (value: FormState) => void;
  onSubmit: (e: FormEvent) => void;
}

export function TransactionForm({ locale, showForm, form, setForm, onSubmit }: TransactionFormProps) {
  if (!showForm) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mb-6 border border-slate-100">
      <h2 className="text-center font-semibold mb-4">{t(locale, "addTransaction")}</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t(locale, "type")}</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
              className="border p-2 rounded w-full"
            >
              <option value={TransactionType.ENTRADA}>{t(locale, "income")}</option>
              <option value={TransactionType.SAIDA}>{t(locale, "outcome")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t(locale, "currency")}</label>
            <select
              value={form.moeda}
              onChange={(e) => setForm({ ...form, moeda: e.target.value as CurrencyType })}
              className="border p-2 rounded w-full"
            >
              <option value={CurrencyType.USD}>USD</option>
              <option value={CurrencyType.AOA}>AOA</option>
              <option value={CurrencyType.EUR}>EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(locale, "amount")}</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(locale, "description")}</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t(locale, "salaryExample")}
            className="border p-2 rounded w-full"
          />
        </div>

        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-2">
          {t(locale, "saveTransaction")}
        </button>
      </form>
    </div>
  );
}
