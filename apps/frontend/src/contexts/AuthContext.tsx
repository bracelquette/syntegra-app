"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AuthUserData,
  RefreshTokenResponse,
  AuthTokens,
} from "shared-types";

// Token Storage Strategy
type TokenStorage = "localStorage" | "sessionStorage";

interface AuthContextType {
  user: AuthUserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenStorage: TokenStorage;
  login: (
    userData: AuthUserData,
    accessToken: string,
    refreshToken: string,
    rememberMe?: boolean
  ) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<AuthUserData>) => void;
  setTokenStorage: (storage: TokenStorage) => void;
  getSessionInfo: () => {
    expiresAt: Date | null;
    isExpiringSoon: boolean;
    timeUntilExpiry: number | null;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "https://backend.bracelquette.workers.dev/api/v1";

// Token storage configuration
const TOKEN_STORAGE_KEY = "syntegra_token_storage_preference";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";
const TOKEN_EXPIRES_AT_KEY = "token_expires_at";

// Auto-refresh threshold (30 minutes before expiry)
const AUTO_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenStorage, setTokenStorageState] =
    useState<TokenStorage>("localStorage");
  const router = useRouter();

  // Refs for managing timers
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Get appropriate storage based on user preference
  const getStorage = useCallback(() => {
    if (typeof window === "undefined") return null;
    return tokenStorage === "localStorage" ? localStorage : sessionStorage;
  }, [tokenStorage]);

  // Initialize token storage preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPreference = localStorage.getItem(
        TOKEN_STORAGE_KEY
      ) as TokenStorage;
      if (
        savedPreference &&
        ["localStorage", "sessionStorage"].includes(savedPreference)
      ) {
        setTokenStorageState(savedPreference);
      }
    }
  }, []);

  // Set token storage preference
  const setTokenStorage = useCallback(
    (storage: TokenStorage) => {
      if (typeof window === "undefined") return;

      setTokenStorageState(storage);
      localStorage.setItem(TOKEN_STORAGE_KEY, storage);

      // If user is already logged in, migrate tokens to new storage
      if (user) {
        const oldStorage =
          storage === "localStorage" ? sessionStorage : localStorage;
        const newStorage = getStorage();

        if (newStorage) {
          const accessToken = oldStorage.getItem(ACCESS_TOKEN_KEY);
          const refreshToken = oldStorage.getItem(REFRESH_TOKEN_KEY);
          const userData = oldStorage.getItem(USER_KEY);
          const expiresAt = oldStorage.getItem(TOKEN_EXPIRES_AT_KEY);

          if (accessToken && refreshToken && userData) {
            newStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            newStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            newStorage.setItem(USER_KEY, userData);
            if (expiresAt) newStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt);

            // Clear old storage
            oldStorage.removeItem(ACCESS_TOKEN_KEY);
            oldStorage.removeItem(REFRESH_TOKEN_KEY);
            oldStorage.removeItem(USER_KEY);
            oldStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
          }
        }
      }
    },
    [user, getStorage]
  );

  // Schedule auto-refresh
  const scheduleTokenRefresh = useCallback((expiresAt: Date) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const timeUntilRefresh =
      expiresAt.getTime() - Date.now() - AUTO_REFRESH_THRESHOLD;

    if (timeUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        if (!isRefreshingRef.current) {
          console.log("Auto-refreshing token...");
          await refreshAuth();
        }
      }, timeUntilRefresh);
    }
  }, []);

  // Get session information
  const getSessionInfo = useCallback(() => {
    const storage = getStorage();
    if (!storage)
      return { expiresAt: null, isExpiringSoon: false, timeUntilExpiry: null };

    const expiresAtStr = storage.getItem(TOKEN_EXPIRES_AT_KEY);
    if (!expiresAtStr)
      return { expiresAt: null, isExpiringSoon: false, timeUntilExpiry: null };

    const expiresAt = new Date(expiresAtStr);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const isExpiringSoon = timeUntilExpiry <= AUTO_REFRESH_THRESHOLD;

    return {
      expiresAt,
      isExpiringSoon,
      timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : 0,
    };
  }, [getStorage]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [tokenStorage]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const storage = getStorage();

      if (!storage) {
        setUser(null);
        return;
      }

      const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
      const userStr = storage.getItem(USER_KEY);
      const expiresAtStr = storage.getItem(TOKEN_EXPIRES_AT_KEY);

      if (!accessToken || !userStr) {
        setUser(null);
        return;
      }

      // Check if token is expired
      if (expiresAtStr) {
        const expiresAt = new Date(expiresAtStr);
        const now = new Date();

        if (now >= expiresAt) {
          // Token expired, try to refresh
          const refreshed = await refreshAuth();
          if (!refreshed) {
            clearAuthState();
            return;
          }
        } else {
          // Schedule auto-refresh
          scheduleTokenRefresh(expiresAt);
        }
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
  }, [getStorage, scheduleTokenRefresh]);

  const login = useCallback(
    (
      userData: AuthUserData,
      accessToken: string,
      refreshToken: string,
      rememberMe: boolean = true
    ) => {
      const storage = getStorage();
      if (!storage) return;

      // Calculate expiration time (2 hours from now)
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      storage.setItem(ACCESS_TOKEN_KEY, accessToken);
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      storage.setItem(USER_KEY, JSON.stringify(userData));
      storage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toISOString());

      setUser(userData);

      // Schedule auto-refresh
      scheduleTokenRefresh(expiresAt);
    },
    [getStorage, scheduleTokenRefresh]
  );

  const logout = useCallback(async () => {
    try {
      // Call logout API if token exists
      const storage = getStorage();
      const accessToken = storage?.getItem(ACCESS_TOKEN_KEY);

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
  }, [router, getStorage]);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false; // Already refreshing
    }

    try {
      isRefreshingRef.current = true;
      const storage = getStorage();

      if (!storage) return false;

      const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
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

        // Calculate new expiration time
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

        // Update tokens
        storage.setItem(ACCESS_TOKEN_KEY, result.data.access_token);
        storage.setItem(REFRESH_TOKEN_KEY, result.data.refresh_token);
        storage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toISOString());

        // Get updated user data
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${result.data.access_token}`,
          },
        });

        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const userData = userResult.data;
          storage.setItem(USER_KEY, JSON.stringify(userData));
          setUser(userData);

          // Schedule next auto-refresh
          scheduleTokenRefresh(expiresAt);

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Refresh token error:", error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [getStorage, scheduleTokenRefresh]);

  const updateUser = useCallback(
    (userData: Partial<AuthUserData>) => {
      setUser((prevUser) => {
        if (!prevUser) return null;

        const updatedUser = { ...prevUser, ...userData };
        const storage = getStorage();
        if (storage) {
          storage.setItem(USER_KEY, JSON.stringify(updatedUser));
        }
        return updatedUser;
      });
    },
    [getStorage]
  );

  const clearAuthState = useCallback(() => {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(ACCESS_TOKEN_KEY);
      storage.removeItem(REFRESH_TOKEN_KEY);
      storage.removeItem(USER_KEY);
      storage.removeItem(TOKEN_EXPIRES_AT_KEY);
    }

    // Also clear from both storages to be safe
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);

      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
    }

    setUser(null);

    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, [getStorage]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    tokenStorage,
    login,
    logout,
    refreshAuth,
    updateUser,
    setTokenStorage,
    getSessionInfo,
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
