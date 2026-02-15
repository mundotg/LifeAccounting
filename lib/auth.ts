import prisma from "@/prisma/prisma";
import { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "session_token";

export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  const now = new Date();
  if (session.expiresAt <= now) {
    await prisma.session.delete({ where: { token } });
    return null;
  }

  return session.user;
}
