"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"broker" | "retailer">("retailer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    if (isSignUp) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Handle signup
        const response = await fetch("/api/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name: name || undefined,
            role,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Signup failed");
        }

        setSuccess(
          "Account created successfully! Please check your email to verify your account."
        );
        // Reset form
        setEmail("");
        setPassword("");
        setName("");
        setRole("retailer");
      } else {
        // Handle signin using the context's signIn method
        await signIn(email, password);
        
        // Successful login - redirect will be handled by middleware based on role
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || (isSignUp ? "Signup failed" : "Invalid email or password"));
      
      // Clear password field on error for better UX
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {/* Toggle between sign in and sign up */}
      <div className="flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
            !isSignUp
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border ${
            isSignUp
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Sign up
        </button>
      </div>

      <div className="rounded-md shadow-sm -space-y-px">
        {isSignUp && (
          <>
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as "broker" | "retailer")}
              >
                <option value="retailer">Retailer</option>
                <option value="broker">Broker</option>
              </select>
            </div>
          </>
        )}
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
              isSignUp && name ? "" : "rounded-t-md"
            } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      {success && (
        <div className="text-green-600 text-sm text-center">{success}</div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? isSignUp
              ? "Creating account..."
              : "Signing in..."
            : isSignUp
            ? "Sign up"
            : "Sign in"}
        </button>
      </div>

      {/* Authentication help text */}
      <div className="text-sm text-center mt-4">
        {isSignUp ? (
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError("");
                setSuccess("");
                setPassword("");
              }}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Sign in instead
            </button>
          </p>
        ) : (
          <p className="text-gray-600">
            Need an account?{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError("");
                setSuccess("");
                setPassword("");
              }}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Create one now
            </button>
          </p>
        )}
      </div>
    </form>
  );
}
