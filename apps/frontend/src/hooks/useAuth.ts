"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useApi } from "./useApi";
import { toast } from "sonner";
import type {
  ParticipantLoginRequest,
  AdminLoginRequest,
  LoginResponse,
} from "shared-types";

export function useAuth() {
  const { apiCall } = useApi();
  const router = useRouter();
  const { login: contextLogin, logout: contextLogout } = useAuthContext();

  // Participant Login
  const useParticipantLogin = () => {
    return useMutation({
      mutationFn: async (data: ParticipantLoginRequest) => {
        const response = await apiCall<LoginResponse>(
          "/auth/participant/login",
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        );
        return response;
      },
      onSuccess: (response) => {
        // Use context login to update auth state
        if (response.data) {
          contextLogin(
            response.data.user,
            response.data.tokens.access_token,
            response.data.tokens.refresh_token
          );

          toast.success("Login berhasil!", {
            description: `Selamat datang ${response.data.user.name}`,
          });

          // Redirect to participant dashboard
          router.push("/participant/dashboard");
        }
      },
      onError: (error: any) => {
        console.error("Login error:", error);

        let errorMessage = "Terjadi kesalahan saat login";

        // Handle specific API errors
        if (error.message) {
          errorMessage = error.message;
        }

        toast.error("Login gagal", {
          description: errorMessage,
        });
      },
    });
  };

  // Admin Login
  const useAdminLogin = () => {
    return useMutation({
      mutationFn: async (data: AdminLoginRequest) => {
        const response = await apiCall<LoginResponse>("/auth/admin/login", {
          method: "POST",
          body: JSON.stringify(data),
        });
        return response;
      },
      onSuccess: (response) => {
        // Use context login to update auth state
        if (response.data) {
          contextLogin(
            response.data.user,
            response.data.tokens.access_token,
            response.data.tokens.refresh_token
          );

          toast.success("Login berhasil!", {
            description: `Selamat datang ${response.data.user.name}`,
          });

          // Redirect to admin dashboard
          router.push("/admin/dashboard");
        }
      },
      onError: (error: any) => {
        console.error("Admin login error:", error);

        let errorMessage = "Terjadi kesalahan saat login";

        if (error.message) {
          errorMessage = error.message;
        }

        toast.error("Login gagal", {
          description: errorMessage,
        });
      },
    });
  };

  // Logout using context
  const logout = async () => {
    try {
      await contextLogout();

      toast.success("Logout berhasil", {
        description: "Anda telah keluar dari sistem",
      });
    } catch (error) {
      console.error("Logout error:", error);

      toast.error("Logout gagal", {
        description: "Terjadi kesalahan saat logout",
      });
    }
  };

  return {
    useParticipantLogin,
    useAdminLogin,
    logout,
  };
}
