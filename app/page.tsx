"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CurrencyType, TransactionType } from "@prisma/client";
import { AuthUser, ExchangeRates, TransactionT } from "@/type";
import { TransactionModal } from "@/component/modalVisualizar";
import { Locale, t } from "@/lib/i18n";
import { LanguageSelector } from "@/component/home/LanguageSelector";
import { AuthForm } from "@/component/home/AuthForm";
import { TransactionForm } from "@/component/home/TransactionForm";
import { TransactionsPanel } from "@/component/home/TransactionsPanel";

interface FormState {
  type: TransactionType;
  amount: string;
  description: string;
  moeda: CurrencyType;
}

type TimeWindow = "7d" | "30d" | "month";

export default function Home() {
  const [locale, setLocale] = useState<Locale>("pt");
  const [transactions, setTransactions] = useState<TransactionT[]>([]);
  const [balance, setBalance] = useState<{ [key: string]: number }>({ USD: 0, AOA: 0, EUR: 0 });
  const [form, setForm] = useState<FormState>({
    type: TransactionType.ENTRADA,
    amount: "",
    description: "",
    moeda: CurrencyType.AOA,
  });
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyType>("USD");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("30d");
  const [savingsGoal, setSavingsGoal] = useState("20");
  const [search, setSearch] = useState("");

  const needsKeywords = ["renda", "salario", "salário", "aluguel", "agua", "água", "energia", "internet", "saude", "saúde", "comida", "transporte", "escola", "farmacia", "farmácia"];

  const exchangeRates: ExchangeRates = {
    USD: { AOA: 830, EUR: 0.92 },
    AOA: { USD: 0.0012, EUR: 0.0011 },
    EUR: { USD: 1.09, AOA: 900 },
  };

  const quickActions = [
    { label: `+ ${t(locale, "salary")}`, type: TransactionType.ENTRADA, description: t(locale, "salary") },
    { label: `- ${t(locale, "rent")}`, type: TransactionType.SAIDA, description: t(locale, "rent") },
    { label: `- ${t(locale, "food")}`, type: TransactionType.SAIDA, description: t(locale, "food") },
    { label: `- ${t(locale, "transport")}`, type: TransactionType.SAIDA, description: t(locale, "transport") },
  ];

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("locale");
    if (savedLocale === "pt" || savedLocale === "en" || savedLocale === "zh") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("locale", locale);
  }, [locale]);

  const checkSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { data } = await axios.get("/api/session");
      setUser(data.user);
      setIsLoading(true);
    } catch {
      setUser(null);
      setTransactions([]);
      setIsLoading(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!user) return;
    const key = `goal:${user.id}`;
    const stored = window.localStorage.getItem(key);
    if (stored) setSavingsGoal(stored);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const key = `goal:${user.id}`;
    window.localStorage.setItem(key, savingsGoal);
  }, [savingsGoal, user]);

  const fetchTransactions = useCallback(async () => {
    if (!isLoading || !user) return;

    try {
      const { data } = await axios.get("/api/transactions");
      setTransactions((data.data ?? []) as TransactionT[]);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const newBalance: { [key: string]: number } = { USD: 0, AOA: 0, EUR: 0 };
    transactions.forEach(({ type, amount, moeda }) => {
      newBalance[moeda] += type === TransactionType.ENTRADA ? parseFloat(amount) : -parseFloat(amount);
    });
    setBalance(newBalance);
  }, [transactions]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      await axios.post("/api/session", {
        mode: authMode,
        name: loginName,
        email: loginEmail,
        password: loginPassword,
      });
      setLoginName("");
      setLoginEmail("");
      setLoginPassword("");
      await checkSession();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setAuthError(error.response?.data?.error ?? t(locale, "authFallbackError"));
      } else {
        setAuthError(t(locale, "authFallbackError"));
      }
      console.error("Erro ao iniciar sessão", error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.delete("/api/session");
    } finally {
      setUser(null);
      setTransactions([]);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTransaction: Omit<TransactionT, "id" | "createdAt"> = {
        type: form.type,
        amount: form.amount,
        description: form.description,
        moeda: form.moeda,
      };
      await axios.post("/api/transactions", newTransaction, {
        headers: { "Content-Type": "application/json" },
      });
      setIsLoading(true);
      setForm({ type: TransactionType.ENTRADA, amount: "", description: "", moeda: CurrencyType.USD });
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao adicionar transação", error);
    }
  };

  const convertCurrency = (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    return amount * exchangeRates[from as keyof ExchangeRates][to as keyof ExchangeRates[keyof ExchangeRates]];
  };

  const getTotalBalanceInCurrency = (currency: CurrencyType): number => {
    return Object.entries(balance).reduce((total, [curr, value]) => total + convertCurrency(value, curr, currency), 0);
  };

  const formatCurrency = (value: number, currency: CurrencyType): string => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter((item) => {
        const now = new Date();
        const createdAt = new Date(item.createdAt);
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const days = timeWindow === "7d" ? 7 : timeWindow === "30d" ? 30 : 99999;

    return transactions.filter((item) => {
      const createdAt = new Date(item.createdAt);
      const inRange =
        timeWindow === "month"
          ? createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
          : (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= days;

      const matchesSearch = item.description.toLowerCase().includes(search.toLowerCase());
      return inRange && matchesSearch;
    });
  }, [transactions, timeWindow, search]);

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === TransactionType.ENTRADA)
    .reduce((sum, item) => sum + convertCurrency(parseFloat(item.amount), item.moeda, displayCurrency), 0);

  const monthlyOutcome = monthlyTransactions
    .filter((item) => item.type === TransactionType.SAIDA)
    .reduce((sum, item) => sum + convertCurrency(parseFloat(item.amount), item.moeda, displayCurrency), 0);

  const essentialExpenses = monthlyTransactions
    .filter((item) => item.type === TransactionType.SAIDA && needsKeywords.some((keyword) => item.description.toLowerCase().includes(keyword)))
    .reduce((sum, item) => sum + convertCurrency(parseFloat(item.amount), item.moeda, displayCurrency), 0);

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyOutcome) / monthlyIncome) * 100 : 0;
  const savingsGoalValue = Number(savingsGoal) || 0;

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t(locale, "loadingSession")}</div>;
  }

  if (!user) {
    return (
      <div>
        <div className="absolute top-4 right-4">
          <LanguageSelector locale={locale} onChange={setLocale} />
        </div>
        <AuthForm
          locale={locale}
          authMode={authMode}
          setAuthMode={setAuthMode}
          loginName={loginName}
          setLoginName={setLoginName}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          authError={authError}
          onSubmit={handleLogin}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 max-w-3xl">
        <header className="bg-white rounded-2xl shadow-md p-4 mb-4 border border-slate-100">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800">{t(locale, "appTitle")}</h1>
            <div className="flex items-center gap-2">
              <LanguageSelector locale={locale} onChange={setLocale} />
              <button onClick={handleLogout} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
                {t(locale, "logout")} ({user.name})
              </button>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-lg font-semibold text-gray-800">{t(locale, "totalBalance")}:</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 mr-1 hidden sm:inline">{t(locale, "showIn")}:</span>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value as CurrencyType)}
                className="border rounded p-1 text-sm w-full sm:w-auto"
              >
                <option value={CurrencyType.USD}>USD</option>
                <option value={CurrencyType.AOA}>AOA</option>
                <option value={CurrencyType.EUR}>EUR</option>
              </select>
            </div>
          </div>
          <div className="text-3xl font-bold text-center mb-1">{formatCurrency(getTotalBalanceInCurrency(displayCurrency), displayCurrency)}</div>
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t(locale, "strategyTitle")}</h2>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 block">{t(locale, "savingsGoal")}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                className="border p-2 rounded w-28"
              />
            </div>
            <div className="text-xs text-gray-600 bg-gray-100 rounded px-3 py-2">
              {savingsRate >= savingsGoalValue ? t(locale, "goalAbove") : t(locale, "goalBelow")}
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-gray-500">{t(locale, "monthlyIncome")}</div>
              <div className="font-semibold text-blue-700">{formatCurrency(monthlyIncome, displayCurrency)}</div>
            </div>
            <div className="bg-red-50 rounded p-3">
              <div className="text-gray-500">{t(locale, "essentialExpenses")}</div>
              <div className="font-semibold text-red-700">{formatCurrency(essentialExpenses, displayCurrency)}</div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-gray-500">{t(locale, "savingsRate")}</div>
              <div className="font-semibold text-green-700">{savingsRate.toFixed(1)}%</div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-md p-4 mb-4 border border-slate-100">
          <h3 className="font-semibold text-gray-800 mb-2">{t(locale, "quickActions")}</h3>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setForm((prev) => ({ ...prev, type: action.type, description: action.description }));
                }}
                className="text-xs px-3 py-1 rounded-full border bg-gray-50 hover:bg-gray-100"
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white py-2 px-4 rounded-full shadow-md hover:bg-blue-600 transition-colors flex items-center"
          >
            <span className="mr-2">{showForm ? t(locale, "cancel") : t(locale, "newTransaction")}</span>
            <span>{showForm ? "✕" : "+"}</span>
          </button>
        </div>

        <TransactionForm locale={locale} showForm={showForm} form={form} setForm={setForm} onSubmit={handleSubmit} />

        <TransactionsPanel
          locale={locale}
          isLoading={isLoading}
          filteredTransactions={filteredTransactions}
          timeWindow={timeWindow}
          setTimeWindow={setTimeWindow}
          search={search}
          setSearch={setSearch}
          onOpenTransaction={(transaction) => {
            setSelectedTransaction(transaction);
            setIsModalOpen(true);
          }}
          formatCurrency={formatCurrency}
        />

        <TransactionModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTransaction(null);
          }}
          exchangeRates={exchangeRates}
          locale={locale}
        />
      </div>
    </div>
  );
}
