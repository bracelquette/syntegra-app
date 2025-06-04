"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type {
  LoginResponse,
  RefreshTokenResponse,
  ProfileResponse,
  AdminLoginRequest,
  ParticipantLoginRequest,
} from "shared-types";

// API Base URL
const API_BASE_URL = "https://backend.bracelquette.workers.dev/api/v1";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "participant";
  nik?: string;
  is_active: boolean;
  email_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    credentials: AdminLoginRequest | ParticipantLoginRequest,
    type: "admin" | "participant"
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Token management
  const getAccessToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  };

  const getRefreshToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token");
    }
    return null;
  };

  const setTokens = (accessToken: string, refreshToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
  };

  const clearTokens = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  };

  // API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = getAccessToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired, try refresh
      const refreshed = await refreshAuth();
      if (refreshed) {
        // Retry with new token
        const newAccessToken = getAccessToken();
        if (newAccessToken) {
          headers.Authorization = `Bearer ${newAccessToken}`;
          return fetch(url, { ...options, headers });
        }
      }
      // Refresh failed, logout user
      await logout();
      throw new Error("Authentication failed");
    }

    return response;
  };

  // Authentication functions
  const login = async (
    credentials: AdminLoginRequest | ParticipantLoginRequest,
    type: "admin" | "participant"
  ) => {
    try {
      setIsLoading(true);

      const endpoint =
        type === "admin" ? "/auth/admin/login" : "/auth/participant/login";

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data: LoginResponse = await response.json();

      if (data.success && data.data) {
        setTokens(
          data.data.tokens.access_token,
          data.data.tokens.refresh_token
        );
        setUser(data.data.user as User);

        // Redirect based on role
        if (data.data.user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/participant/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        // Call logout endpoint
        await apiCall("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearTokens();
      setUser(null);
      router.push("/");
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data: RefreshTokenResponse = await response.json();

      if (data.success && data.data) {
        setTokens(data.data.access_token, data.data.refresh_token);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        return false;
      }

      const response = await apiCall("/auth/me");

      if (!response.ok) {
        return false;
      }

      const data: ProfileResponse = await response.json();

      if (data.success && data.data) {
        setUser(data.data as User);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  };

  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      const hasTokens = getAccessToken() && getRefreshToken();

      if (hasTokens) {
        const isValid = await checkAuth();
        if (!isValid) {
          clearTokens();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Auto refresh token before expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      async () => {
        await refreshAuth();
      },
      14 * 60 * 1000
    ); // Refresh every 14 minutes (tokens expire in 15 minutes)

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
