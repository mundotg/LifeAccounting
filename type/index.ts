import { CurrencyType, TransactionType } from "@prisma/client";

export interface TransactionT {
    id: number;
    type: TransactionType;
    amount: string;
    description: string;
    moeda: CurrencyType;
    createdAt: string;
  }

export interface ExchangeRates {
  USD: { AOA: number; EUR: number };
  AOA: { USD: number; EUR: number };
  EUR: { USD: number; AOA: number };
}