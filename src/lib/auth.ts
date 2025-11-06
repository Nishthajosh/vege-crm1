import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";

export async function getSession() {
  return await getServerSession();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
