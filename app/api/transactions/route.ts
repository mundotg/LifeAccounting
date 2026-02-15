import { getSessionUser } from "@/lib/auth";
import prisma from "@/prisma/prisma";
import { CurrencyType, TransactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(Object.values(TransactionType) as [string, ...string[]], {
    errorMap: () => ({ message: "O tipo deve ser 'ENTRADA' ou 'SAIDA'." }),
  }),
  amount: z
    .number({ invalid_type_error: "O valor deve ser um número." })
    .positive("O valor deve ser maior que zero."),
  description: z
    .string()
    .min(1, { message: "A descrição é obrigatória." })
    .max(255, { message: "A descrição não pode ultrapassar 255 caracteres." }),
  moeda: z.enum(Object.values(CurrencyType) as [string, ...string[]], {
    errorMap: () => ({
      message: "A moeda deve ser 'USD', 'AOA' ou 'EUR'.",
    }),
  }),
});

// 🚀 Handler para GET: Retorna apenas as transações do utilizador autenticado
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: transactions }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao buscar transações",
        details: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}

// 🚀 Handler para POST: Cria uma nova transação ligada ao utilizador autenticado
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    body.amount = parseFloat(body.amount);

    const validatedData = transactionSchema.safeParse({
      ...body,
      type: body.type?.toUpperCase(),
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: validatedData.data.type as TransactionType,
        amount: validatedData.data.amount,
        description: validatedData.data.description,
        moeda: validatedData.data.moeda as CurrencyType,
        userId: user.id,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao criar transação",
        details: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}
