"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid login");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6
                   transition-all hover:shadow-xl"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/sample-logo-1.png"
            alt="Logo"
            width={180}
            height={70}
            className="rounded-full"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-[var(--color-primary-dark)]">
          Admin Login
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none
                         focus:ring-2 focus:ring-[var(--color-primary-accent)] transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              placeholder="Enter your password"
              type="password"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none
                         focus:ring-2 focus:ring-[var(--color-primary-accent)] transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary-dark)] text-white py-3 rounded-lg
                       font-medium text-lg transition hover:bg-[var(--color-primary)] flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-2">
          &copy; {new Date().getFullYear()} Hastec Innovations (Pvt) Ltd.
        </p>
      </form>
    </div>
  );
}
