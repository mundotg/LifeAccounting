"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { CurrencyType, TransactionType } from "@prisma/client";
import { AuthUser, ExchangeRates, TransactionT } from "@/type";
import { TransactionModal } from "@/component/modalVisualizar";

interface FormState {
  type: TransactionType;
  amount: string;
  description: string;
  moeda: CurrencyType;
}

export default function Home() {
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
  const [loginName, setLoginName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const needsKeywords = [
    "renda",
    "salario",
    "salário",
    "aluguel",
    "agua",
    "água",
    "energia",
    "internet",
    "saude",
    "saúde",
    "comida",
    "transporte",
    "escola",
    "farmacia",
    "farmácia",
  ];

  const exchangeRates: ExchangeRates = {
    USD: { AOA: 830, EUR: 0.92 },
    AOA: { USD: 0.0012, EUR: 0.0011 },
    EUR: { USD: 1.09, AOA: 900 },
  };

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

  const fetchTransactions = useCallback(async () => {
    if (!isLoading || !user) return;

    try {
      const { data } = await axios.get("/api/transactions");
      const datatipo = (data.data ?? []) as TransactionT[];
      setTransactions(datatipo);
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
    try {
      await axios.post("/api/session", { name: loginName });
      setLoginName("");
      await checkSession();
    } catch (error) {
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
    return Object.entries(balance).reduce((total, [curr, value]) => {
      return total + convertCurrency(value, curr, currency);
    }, 0);
  };

  const openTransactionModal = (transaction: TransactionT) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const formatCurrency = (value: number, currency: string): string => {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(value);
  };

  const monthlyTransactions = transactions.filter((item) => {
    const now = new Date();
    const createdAt = new Date(item.createdAt);
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === TransactionType.ENTRADA)
    .reduce((sum, item) => sum + convertCurrency(parseFloat(item.amount), item.moeda, displayCurrency), 0);

  const monthlyOutcome = monthlyTransactions
    .filter((item) => item.type === TransactionType.SAIDA)
    .reduce((sum, item) => sum + convertCurrency(parseFloat(item.amount), item.moeda, displayCurrency), 0);

  const essentialExpenses = monthlyTransactions
    .filter(
      (item) =>
        item.type === TransactionType.SAIDA &&
        needsKeywords.some((keyword) => item.description.toLowerCase().includes(keyword))
    )
    .reduce((sum, item) => sum + convertCurrency(parseFloat(item.amount), item.moeda, displayCurrency), 0);

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyOutcome) / monthlyIncome) * 100 : 0;

  const getBadgeColor = (type: TransactionType) => {
    return type === TransactionType.ENTRADA ? "bg-green-500 text-white" : "bg-red-500 text-white";
  };

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando sessão...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <h1 className="text-xl font-bold text-gray-800 mb-3">Acesso privado</h1>
          <p className="text-sm text-gray-600 mb-4">
            Cada utilizador só vê as próprias transações. Inicia a sessão para ver os teus dados.
          </p>
          <form onSubmit={handleLogin} className="flex gap-2">
            <input
              type="text"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Seu nome"
              required
              minLength={2}
            />
            <button type="submit" className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-xl">
        <header className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Controle Financeiro</h1>
            <button onClick={handleLogout} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
              Sair ({user.name})
            </button>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Saldo Total:</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 mr-1 hidden sm:inline">Mostrar em:</span>
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

          <div className="text-xl sm:text-2xl font-bold text-center mb-4">
            {formatCurrency(getTotalBalanceInCurrency(displayCurrency), displayCurrency)}
          </div>
        </div>

        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Sessão Estratégica (Mundo Real)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Esta visão separa o que é essencial, mede sua taxa de poupança e ajuda a tomar decisões financeiras práticas.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-gray-500">Entradas do mês</div>
              <div className="font-semibold text-blue-700">{formatCurrency(monthlyIncome, displayCurrency)}</div>
            </div>
            <div className="bg-red-50 rounded p-3">
              <div className="text-gray-500">Saídas essenciais</div>
              <div className="font-semibold text-red-700">{formatCurrency(essentialExpenses, displayCurrency)}</div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-gray-500">Taxa de poupança</div>
              <div className="font-semibold text-green-700">{savingsRate.toFixed(1)}%</div>
            </div>
          </div>
        </section>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white py-2 px-4 rounded-full shadow-md hover:bg-blue-600 transition-colors flex items-center"
          >
            <span className="mr-2">{showForm ? "Cancelar" : "Nova Transação"}</span>
            <span>{showForm ? "✕" : "+"}</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-center font-semibold mb-4">Adicionar Transação</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
                    className="border p-2 rounded w-full"
                  >
                    <option value={TransactionType.ENTRADA}>Entrada</option>
                    <option value={TransactionType.SAIDA}>Saída</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moeda</label>
                  <select
                    value={form.moeda}
                    onChange={(e) => setForm({ ...form, moeda: e.target.value as CurrencyType })}
                    className="border p-2 rounded w-full"
                  >
                    <option value={CurrencyType.USD}>Dólar (USD)</option>
                    <option value={CurrencyType.AOA}>Kwanza (AOA)</option>
                    <option value={CurrencyType.EUR}>Euro (EUR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Pagamento de salário"
                  className="border p-2 rounded w-full"
                />
              </div>

              <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-2">
                Salvar Transação
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Transações Recentes</h2>

          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhuma transação encontrada.</div>
          ) : (
            <ul className="space-y-3">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  onClick={() => openTransactionModal(t)}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{t.description}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getBadgeColor(t.type)} inline-block sm:hidden`}>
                          {t.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center justify-between sm:block w-full sm:w-auto">
                      <div className="font-bold whitespace-nowrap">
                        {t.type === TransactionType.SAIDA ? "-" : "+"}
                        {formatCurrency(parseFloat(t.amount), t.moeda)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <TransactionModal
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={closeModal}
          exchangeRates={exchangeRates}
        />
      </div>
    </div>
  );
}
