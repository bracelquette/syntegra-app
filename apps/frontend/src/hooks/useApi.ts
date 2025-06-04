"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

const API_BASE_URL = "https://backend.bracelquette.workers.dev/api/v1";

export function useApi() {
  const { refreshAuth, logout } = useAuth();

  const apiCall = useCallback(
    async <T = any>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const url = `${API_BASE_URL}${endpoint}`;

      // Get token from localStorage
      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token expiration
      if (response.status === 401) {
        const refreshed = await refreshAuth();

        if (refreshed) {
          // Retry with new token
          const newAccessToken =
            typeof window !== "undefined"
              ? localStorage.getItem("access_token")
              : null;

          if (newAccessToken) {
            headers.Authorization = `Bearer ${newAccessToken}`;
            response = await fetch(url, { ...options, headers });
          }
        } else {
          // Refresh failed, logout user
          await logout();
          throw new Error("Authentication failed");
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "API call failed");
      }

      return response.json();
    },
    [refreshAuth, logout]
  );

  return { apiCall };
}
