import { CurrencyType, TransactionType } from "@prisma/client";

export interface TransactionT {
  id: number;
  type: TransactionType;
  amount: string;
  description: string;
  moeda: CurrencyType;
  userId?: number | null;
  createdAt: string;
}

export interface ExchangeRates {
  USD: { AOA: number; EUR: number };
  AOA: { USD: number; EUR: number };
  EUR: { USD: number; AOA: number };
}

export interface AuthUser {
  id: number;
  name: string;
}
