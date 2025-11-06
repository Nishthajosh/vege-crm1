import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          // Check if this is the admin user (for backwards compatibility)
          const adminEmail = process.env.ADMIN_EMAIL;
          const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

          if (credentials.email === adminEmail && adminPasswordHash) {
            const isValidPassword = await verifyPassword(
              credentials.password,
              adminPasswordHash
            );

            if (isValidPassword) {
              return {
                id: "admin",
                email: adminEmail,
                name: "Admin",
                role: "admin",
              };
            }
          }

          // Check database for regular users
          const user = await db.getUserByEmail(credentials.email);
          
          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          // In mock mode, skip password verification
          if (process.env.USE_MOCK === "1") {
            // Any password works in mock mode
            return {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
              role: user.role,
              image: user.image || undefined,
            };
          }

          // Check if email is verified (only if Resend is configured)
          if (process.env.RESEND_API_KEY && user.emailVerified === 0) {
            throw new Error("Please verify your email first. Check your inbox for the verification link.");
          }

          const isValidPassword = await verifyPassword(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role,
            image: user.image || undefined,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Authentication failed";
          throw new Error(message);
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
