"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUserData, RefreshTokenResponse } from "shared-types";

interface AuthContextType {
  user: AuthUserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    userData: AuthUserData,
    accessToken: string,
    refreshToken: string
  ) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<AuthUserData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "https://backend.bracelquette.workers.dev/api/v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      const accessToken = localStorage.getItem("access_token");
      const userStr = localStorage.getItem("user");

      if (!accessToken || !userStr) {
        setUser(null);
        return;
      }

      const userData = JSON.parse(userStr);

      // Verify token by calling /auth/me endpoint
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
      } else if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshAuth();
        if (!refreshed) {
          // Refresh failed, clear auth state
          clearAuthState();
        }
      } else {
        // Other error, clear auth state
        clearAuthState();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (userData: AuthUserData, accessToken: string, refreshToken: string) => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      // Call logout API if token exists
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API fails
    } finally {
      clearAuthState();
      router.push("/");
    }
  }, [router]);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const result: RefreshTokenResponse = await response.json();

        // Update access token
        localStorage.setItem("access_token", result.data.access_token);

        // Get updated user data
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${result.data.access_token}`,
          },
        });

        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const userData = userResult.data;
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Refresh token error:", error);
      return false;
    }
  }, []);

  const updateUser = useCallback((userData: Partial<AuthUserData>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;

      const updatedUser = { ...prevUser, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
    updateUser,
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
