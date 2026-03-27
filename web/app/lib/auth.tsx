"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

export interface User {
  id: string;
  email: string;
  plan: string;
  role?: string;
  base_plan?: string;
  subscription_status?: string;
  subscription_end_date?: string;
}

export interface PlanLimits {
  max_file_size_mb: number;
  pages_per_day: number;
  has_ads: boolean;
  batch_processing: boolean;
  smart_tools: boolean;
  api_access: boolean;
}

export interface UsageInfo {
  pages_today: number;
  pages_limit: number;
  limit_reached: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  };

  const setToken = (token: string | null) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    }
  };

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      console.error("Failed to refresh user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        const role = data.user?.role || "user";
        if (typeof window !== "undefined") {
          localStorage.setItem("user_role", role);
        }
        return { success: true, role };
      } else {
        return { success: false, error: data.detail || "Login failed" };
      }
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || "Registration failed" };
      }
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_role");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Anonymous usage tracking
export async function trackAnonymousUsage(pages: number = 0): Promise<UsageInfo & { anonymous_id: string }> {
  const fingerprint = await generateFingerprint();
  const localToken = getOrCreateLocalToken();

  const formData = new FormData();
  formData.append("fingerprint", fingerprint);
  formData.append("local_token", localToken);
  formData.append("pages", pages.toString());

  const response = await fetch(`${API_URL}/api/track/anonymous`, {
    method: "POST",
    body: formData,
  });

  return response.json();
}

export async function getUsageStatus(token?: string | null): Promise<UsageInfo & { authenticated: boolean; plan: string; limits: PlanLimits }> {
  const fingerprint = await generateFingerprint();
  const localToken = getOrCreateLocalToken();

  const params = new URLSearchParams({
    fingerprint,
    local_token: localToken,
  });

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/track/usage?${params}`, {
    headers,
  });

  return response.json();
}

function getOrCreateLocalToken(): string {
  if (typeof window === "undefined") return "";

  let token = localStorage.getItem("anon_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("anon_token", token);
  }
  return token;
}

async function generateFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "";

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("4uPDF fingerprint", 2, 2);
      components.push(canvas.toDataURL());
    }
  } catch {
    // Canvas fingerprinting blocked
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    // WebGL fingerprinting blocked
  }

  const data = components.join("|");
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Check limits before processing via backend API
export async function checkProcessingLimits(
  pages: number,
  fileSizeBytes: number,
  token?: string | null
): Promise<{
  allowed: boolean;
  reason?: string;
  detail?: string;
  limits?: PlanLimits;
  pages_used?: number;
}> {
  const fingerprint = await generateFingerprint();
  const localToken = getOrCreateLocalToken();

  const formData = new FormData();
  formData.append("pages", pages.toString());
  formData.append("file_size_bytes", fileSizeBytes.toString());
  formData.append("fingerprint", fingerprint);
  formData.append("local_token", localToken);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}/api/check-limits`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        allowed: false,
        reason: data.reason || "unknown",
        detail: data.detail || "Processing limit reached",
        limits: data.limits,
      };
    }

    return {
      allowed: true,
      limits: data.limits,
      pages_used: data.pages_used,
    };
  } catch {
    // If we can't check, allow the operation
    return { allowed: true };
  }
}

// Hook for checking usage limits before operations
export function useUsageCheck() {
  const { user, getToken } = useAuth();

  const checkCanProcess = async (pageCount: number, fileSizeMB: number): Promise<{
    allowed: boolean;
    reason?: "limit_reached" | "file_too_large";
    limits?: PlanLimits;
    usage?: UsageInfo;
  }> => {
    const fileSizeBytes = fileSizeMB * 1024 * 1024;
    const result = await checkProcessingLimits(pageCount, fileSizeBytes, getToken());

    if (!result.allowed) {
      return {
        allowed: false,
        reason: result.reason as "limit_reached" | "file_too_large",
        limits: result.limits,
        usage: result.pages_used !== undefined ? {
          pages_today: result.pages_used,
          pages_limit: result.limits?.pages_per_day || 0,
          limit_reached: true,
        } : undefined,
      };
    }

    return { allowed: true, limits: result.limits };
  };

  const recordUsage = async (pageCount: number) => {
    if (user) {
      // For authenticated users, usage is tracked on the backend during operations
      return;
    } else {
      // For anonymous users, track via the tracking endpoint
      await trackAnonymousUsage(pageCount);
    }
  };

  return { checkCanProcess, recordUsage, user };
}
