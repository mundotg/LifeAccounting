import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const authSchema = z
  .object({
    mode: z.enum(["login", "register"]).default("login"),
    name: z.string().trim().min(2, "Nome muito curto.").max(60, "Nome muito longo.").optional(),
    email: z.string().trim().toLowerCase().email("Email inválido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "register" && !data.name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome é obrigatório no cadastro.", path: ["name"] });
    }
  });

function buildSessionResponse(token: string, expiresAt: Date, body: { authenticated: boolean; user: { id: number; name: string } }) {
  const res = NextResponse.json(body, { status: 200 });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return res;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json(
      { authenticated: true, user: { id: user.id, name: user.name } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao validar sessão", details: error instanceof Error ? error.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const validated = authSchema.safeParse(payload);

    if (!validated.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validated.error.format() }, { status: 400 });
    }

    const { mode, email, password, name } = validated.data;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const token = crypto.randomUUID();

    if (mode === "register") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Este email já está em uso." }, { status: 409 });
      }

      const user = await prisma.user.create({
        data: {
          name: name!,
          email,
          passwordHash: hashPassword(password),
        },
      });

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      return buildSessionResponse(token, expiresAt, {
        authenticated: true,
        user: { id: user.id, name: user.name },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return buildSessionResponse(token, expiresAt, {
      authenticated: true,
      user: { id: user.id, name: user.name },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar sessão", details: error instanceof Error ? error.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }

    const res = NextResponse.json({ authenticated: false }, { status: 200 });
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao terminar sessão", details: error instanceof Error ? error.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}
