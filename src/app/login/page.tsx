"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams?.get("registered");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const callbackUrl = searchParams?.get("callbackUrl") || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Ensure session is available before redirecting
      let session = await getSession();

      if (!session) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        session = await getSession();
      }

      if (!session?.user) {
        throw new Error("Unable to load session. Please try again.");
      }

      const role = (session.user as any)?.role;

      if (role === "broker") {
        router.replace("/broker/dashboard");
      } else if (role === "farmer") {
        router.replace("/farmer/dashboard");
      } else if (role === "retailer") {
        router.replace("/retailer/vegetables");
      } else if (role === "admin") {
        router.replace("/dashboard");
      } else if (callbackUrl) {
        router.replace(callbackUrl);
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
      setPassword("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-2xl rounded-2xl p-8 transition-transform transform hover:scale-105 duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary font-poppins">
              🥬 Vegetable CRM
            </h1>
            <p className="text-gray-600 mt-2">Welcome back! Please login to your account</p>
          </div>

          {registered && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              ✓ Account created successfully! Please login.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="••••••••"
              />
              <div className="mt-2 text-right">
                <a
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-accent transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-primary hover:text-accent font-semibold transition-colors"
              >
                Create one now
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
