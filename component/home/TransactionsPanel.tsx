import { CurrencyType, TransactionType } from "@prisma/client";
import { Locale, t } from "@/lib/i18n";
import { TransactionT } from "@/type";

type TimeWindow = "7d" | "30d" | "month";

interface TransactionsPanelProps {
  locale: Locale;
  isLoading: boolean;
  filteredTransactions: TransactionT[];
  timeWindow: TimeWindow;
  setTimeWindow: (value: TimeWindow) => void;
  search: string;
  setSearch: (value: string) => void;
  onOpenTransaction: (transaction: TransactionT) => void;
  formatCurrency: (value: number, currency: CurrencyType) => string;
}

export function TransactionsPanel({
  locale,
  isLoading,
  filteredTransactions,
  timeWindow,
  setTimeWindow,
  search,
  setSearch,
  onOpenTransaction,
  formatCurrency,
}: TransactionsPanelProps) {
  const getBadgeColor = (type: TransactionType) =>
    type === TransactionType.ENTRADA ? "bg-green-500 text-white" : "bg-red-500 text-white";

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">{t(locale, "transactions")}</h2>
        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
          className="border p-1 rounded text-sm"
        >
          <option value="7d">{t(locale, "last7Days")}</option>
          <option value="30d">{t(locale, "last30Days")}</option>
          <option value="month">{t(locale, "currentMonth")}</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(locale, "searchDescription")}
          className="border p-1 rounded text-sm sm:ml-auto"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-4">{t(locale, "loading")}</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-4 text-gray-500">{t(locale, "noTransactions")}</div>
      ) : (
        <ul className="space-y-3">
          {filteredTransactions.map((item) => (
            <li
              key={item.id}
              onClick={() => onOpenTransaction(item)}
              className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{item.description}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getBadgeColor(item.type)} inline-block sm:hidden`}>
                      {item.type === TransactionType.ENTRADA ? t(locale, "income") : t(locale, "outcome")}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center justify-between sm:block w-full sm:w-auto">
                  <div className="font-bold whitespace-nowrap">
                    {item.type === TransactionType.SAIDA ? "-" : "+"}
                    {formatCurrency(parseFloat(item.amount), item.moeda)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
