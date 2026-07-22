"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export const AuthContext = createContext(null);

const authPaths = ["/login", "/signup"];

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuthPage = authPaths.includes(pathname);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!mounted) return;
        setUser(response.ok ? data.user : null);

        if (!response.ok && !isAuthPage) {
          router.replace("/login");
        }
        if (response.ok && isAuthPage) {
          router.replace("/dashboard");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, [isAuthPage, router]);

  const login = useCallback(async function login(payload) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }
    setUser(data.user);
    router.replace("/dashboard");
  }, [router]);

  const signup = useCallback(async function signup(payload) {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }
    setUser(data.user);
    router.replace("/dashboard");
  }, [router]);

  const logout = useCallback(async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.replace("/login");
  }, [router]);

  const refreshUser = useCallback(async function refreshUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setUser(response.ok ? data.user : null);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, loading, login, signup, logout, refreshUser }), [user, loading, login, signup, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
