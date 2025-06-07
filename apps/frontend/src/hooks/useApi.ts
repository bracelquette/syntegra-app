"use client";

import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = "https://backend.bracelquette.workers.dev/api/v1";

interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean; // Skip automatic token refresh for this request
}

export function useApi() {
  const { refreshAuth, logout, getSessionInfo } = useAuth();

  // Get tokens from current storage
  const getTokens = useCallback(() => {
    if (typeof window === "undefined")
      return { accessToken: null, refreshToken: null };

    // Try localStorage first, then sessionStorage
    let accessToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    let refreshToken =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");

    return { accessToken, refreshToken };
  }, []);

  const apiCall = useCallback(
    async <T = any>(
      endpoint: string,
      options: ApiRequestOptions = {}
    ): Promise<T> => {
      const url = `${API_BASE_URL}${endpoint}`;
      const { skipAuthRefresh = false, ...requestOptions } = options;

      // Get current tokens
      let { accessToken } = getTokens();

      // Check if token is expiring soon and refresh if needed
      if (!skipAuthRefresh && accessToken) {
        const sessionInfo = getSessionInfo();
        if (
          sessionInfo.isExpiringSoon &&
          sessionInfo.timeUntilExpiry !== null &&
          sessionInfo.timeUntilExpiry > 0
        ) {
          console.log("Token expiring soon, attempting refresh...");
          const refreshed = await refreshAuth();
          if (refreshed) {
            // Get updated token
            const updatedTokens = getTokens();
            accessToken = updatedTokens.accessToken;
          }
        }
      }

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(requestOptions.headers as Record<string, string>),
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // Make the request
      let response = await fetch(url, {
        ...requestOptions,
        headers,
      });

      // Handle 401 - Unauthorized (token expired or invalid)
      if (response.status === 401 && !skipAuthRefresh) {
        console.log("Received 401, attempting token refresh...");

        // Try to refresh token
        const refreshed = await refreshAuth();

        if (refreshed) {
          // Retry the original request with new token
          const { accessToken: newAccessToken } = getTokens();

          if (newAccessToken) {
            headers.Authorization = `Bearer ${newAccessToken}`;
            response = await fetch(url, {
              ...requestOptions,
              headers,
            });
          }
        } else {
          // Refresh failed, logout user
          console.log("Token refresh failed, logging out...");
          await logout();
          throw new Error("Authentication failed - please login again");
        }
      }

      // Handle non-200 responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, create a generic error
          errorData = {
            success: false,
            message: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString(),
          };
        }

        // Extract error message from API response
        let errorMessage = "API call failed";

        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message || errorMessage;
        }

        const error = new Error(errorMessage);
        // Attach full error data for detailed handling
        (error as any).data = errorData;
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    },
    [refreshAuth, logout, getTokens, getSessionInfo]
  );

  // Specialized method for authenticated requests
  const authenticatedCall = useCallback(
    async <T = any>(
      endpoint: string,
      options: ApiRequestOptions = {}
    ): Promise<T> => {
      const { accessToken } = getTokens();

      if (!accessToken) {
        throw new Error("No access token available - please login");
      }

      return apiCall<T>(endpoint, options);
    },
    [apiCall, getTokens]
  );

  // Specialized method for public requests (no auth required)
  const publicCall = useCallback(
    async <T = any>(
      endpoint: string,
      options: ApiRequestOptions = {}
    ): Promise<T> => {
      return apiCall<T>(endpoint, {
        ...options,
        skipAuthRefresh: true,
      });
    },
    [apiCall]
  );

  return {
    apiCall,
    authenticatedCall,
    publicCall,
    getTokens,
  };
}
