"use client";

import { useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function useApi() {
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
        // Try to refresh token
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refresh_token")
            : null;

        if (refreshToken) {
          try {
            const refreshResponse = await fetch(
              `${API_BASE_URL}/auth/refresh`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
              }
            );

            if (refreshResponse.ok) {
              const refreshResult = await refreshResponse.json();

              // Update access token
              if (typeof window !== "undefined") {
                localStorage.setItem(
                  "access_token",
                  refreshResult.data.access_token
                );
              }

              // Retry original request with new token
              headers.Authorization = `Bearer ${refreshResult.data.access_token}`;
              response = await fetch(url, { ...options, headers });
            } else {
              // Refresh failed, clear auth and redirect
              if (typeof window !== "undefined") {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");
                window.location.href = "/";
              }
              throw new Error("Authentication failed");
            }
          } catch (refreshError) {
            // Refresh failed, clear auth and redirect
            if (typeof window !== "undefined") {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("user");
              window.location.href = "/";
            }
            throw new Error("Authentication failed");
          }
        } else {
          // No refresh token, clear auth and redirect
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            window.location.href = "/";
          }
          throw new Error("Authentication failed");
        }
      }

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
    []
  );

  return { apiCall };
}
