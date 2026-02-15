import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/auth";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(60, "Nome muito longo."),
});

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
    const validated = loginSchema.safeParse(payload);

    if (!validated.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validated.error.format() }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { name: validated.data.name },
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const token = crypto.randomUUID();

    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const res = NextResponse.json({ authenticated: true, user: { id: user.id, name: user.name } }, { status: 201 });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return res;
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
