import { ExchangeRates, TransactionT } from "@/type";
import { CurrencyType, TransactionType } from "@prisma/client";
import { Locale, t } from "@/lib/i18n";

interface TransactionModalProps {
  transaction: TransactionT | null;
  isOpen: boolean;
  onClose: () => void;
  exchangeRates: ExchangeRates;
  locale: Locale;
}

export function TransactionModal({ transaction, isOpen, onClose, exchangeRates, locale }: TransactionModalProps) {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return t(locale, "invalidDate");

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return t(locale, "invalidDate");

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(date);
  };

  const formatCurrency = (value: string | number, currency: CurrencyType): string => {
    const amount = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const convertCurrency = (amount: string | number, from: CurrencyType, to: CurrencyType): number => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    if (from === to) return value;
    return value * exchangeRates[from as keyof ExchangeRates][to as keyof ExchangeRates[keyof ExchangeRates]];
  };

  const amountValue = parseFloat(transaction.amount);
  const conversions = {
    USD: transaction.moeda === "USD" ? amountValue : convertCurrency(amountValue, transaction.moeda, "USD"),
    AOA: transaction.moeda === "AOA" ? amountValue : convertCurrency(amountValue, transaction.moeda, "AOA"),
    EUR: transaction.moeda === "EUR" ? amountValue : convertCurrency(amountValue, transaction.moeda, "EUR"),
  };

  const transactionLabel = transaction.type === TransactionType.ENTRADA ? t(locale, "income") : t(locale, "outcome");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className={`p-4 ${transaction.type === TransactionType.ENTRADA ? "bg-green-500" : "bg-red-500"} text-white`}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{transactionLabel}</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none">
              ✕
            </button>
          </div>
          <div className="text-2xl font-bold mt-2">{formatCurrency(transaction.amount, transaction.moeda)}</div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{transaction.description}</h3>
            <p className="text-gray-600">{formatDate(transaction.createdAt)}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-700 mb-3">{t(locale, "equivalentValues")}:</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(conversions).map(([currency, value]) => (
                <div
                  key={currency}
                  className={`p-3 rounded-lg text-center ${currency === transaction.moeda ? "bg-blue-100 border border-blue-300" : "bg-gray-100"}`}
                >
                  <div className="text-xs text-gray-500">{currency}</div>
                  <div className="font-medium">{formatCurrency(value, currency as CurrencyType)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-medium">{transaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t(locale, "currency")}</p>
                <p className="font-medium">{transaction.moeda}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors">
            {t(locale, "close")}
          </button>
        </div>
      </div>
    </div>
  );
}
