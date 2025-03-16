import { ExchangeRates, TransactionT } from '@/type';
import { CurrencyType, TransactionType } from '@prisma/client';
import React from 'react';

interface TransactionModalProps {
  transaction: TransactionT | null;
  isOpen: boolean;
  onClose: () => void;
  exchangeRates:ExchangeRates;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  exchangeRates
}) => {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateString?: string) => {
    console.log(dateString);
    if (!dateString) return "Data inválida"; // Caso a data seja `null` ou `undefined`
  
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida"; // Verifica se a data é válida
  
    return new Intl.DateTimeFormat('default', { 
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(date);
  };

  const formatCurrency = (value: string | number, currency: CurrencyType): string => {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const convertCurrency = (amount: string | number, from: CurrencyType, to: CurrencyType): number => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (from === to) return value;
    return value *  exchangeRates[from as keyof ExchangeRates][to as keyof ExchangeRates[keyof ExchangeRates]];;
  };

  // Calcular conversões para todas as moedas
  const amountValue = parseFloat(transaction.amount);
  const conversions = {
    USD: transaction.moeda === "USD" ? amountValue : convertCurrency(amountValue, transaction.moeda, "USD"),
    AOA: transaction.moeda === "AOA" ? amountValue : convertCurrency(amountValue, transaction.moeda, "AOA"),
    EUR: transaction.moeda === "EUR" ? amountValue : convertCurrency(amountValue, transaction.moeda, "EUR")
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`p-4 ${transaction.type === TransactionType.ENTRADA ? "bg-green-500" : "bg-red-500"} text-white`}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {transaction.type}
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              ✕
            </button>
          </div>
          <div className="text-2xl font-bold mt-2">
            {formatCurrency(transaction.amount, transaction.moeda)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{transaction.description}</h3>
            <p className="text-gray-600">
              {formatDate(transaction.createdAt)}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-700 mb-3">Valores equivalentes:</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(conversions).map(([currency, value]) => (
                <div 
                  key={currency} 
                  className={`p-3 rounded-lg text-center ${
                    currency === transaction.moeda 
                      ? "bg-blue-100 border border-blue-300" 
                      : "bg-gray-100"
                  }`}
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
                <p className="text-sm text-gray-500">Moeda</p>
                <p className="font-medium">{transaction.moeda}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};