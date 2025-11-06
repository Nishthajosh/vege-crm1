import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";

// Define your user type (includes role)
interface User {
  name?: string | null;
  email?: string | null;
  role?: string; // ✅ added role
}

// Function to get session (real or mock)
export async function getSession(): Promise<Session | null> {
  try {
    const session = await getServerSession();

    // If real session found, return it
    if (session) return session;

    // ✅ Otherwise, return mock session for testing
    return {
      user: {
        name: "Mock User",
        email: "mockuser@example.com",
        role: "admin", // 👈 change to farmer/retailer if needed
      } as any,
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

// Get current user
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user as User;
}

// Require auth before accessing protected pages
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

// Require admin access
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    redirect("/");
  }
  return user;
}

// Password helpers
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
