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

  // Participant Login with Remember Me support
  const useParticipantLogin = () => {
    return useMutation({
      mutationFn: async (
        data: ParticipantLoginRequest & { rememberMe?: boolean }
      ) => {
        const response = await apiCall<LoginResponse>(
          "/auth/participant/login",
          {
            method: "POST",
            body: JSON.stringify({
              nik: data.nik,
              email: data.email,
            }),
          }
        );
        return { ...response, rememberMe: data.rememberMe };
      },
      onSuccess: (response) => {
        // Use context login to update auth state
        if (response.data) {
          contextLogin(
            response.data.user,
            response.data.tokens.access_token,
            response.data.tokens.refresh_token,
            response.rememberMe ?? true // Default to remember me
          );

          toast.success("Login berhasil!", {
            description: `Selamat datang ${response.data.user.name}`,
            action: {
              label: "Dashboard",
              onClick: () => router.push("/participant/dashboard"),
            },
          });

          // Show session info
          const storageType = response.rememberMe
            ? "localStorage"
            : "sessionStorage";
          const sessionDuration = response.rememberMe
            ? "7 hari"
            : "hingga browser ditutup";

          setTimeout(() => {
            toast.info("Session Info", {
              description: `Session tersimpan di ${storageType} untuk ${sessionDuration}`,
              duration: 5000,
            });
          }, 2000);

          // Redirect to participant dashboard
          router.push("/participant/dashboard");
        }
      },
      onError: (error: any) => {
        console.error("Participant login error:", error);

        let errorMessage = "Terjadi kesalahan saat login";
        let actionButton = undefined;

        // Handle specific API errors
        if (error.message) {
          const errorMsg = error.message.toLowerCase();

          if (
            errorMsg.includes("user not found") ||
            errorMsg.includes("invalid credentials")
          ) {
            errorMessage = "NIK atau email tidak ditemukan dalam sistem";
            actionButton = {
              label: "Daftar Akun",
              onClick: () => router.push("/participant/register"),
            };
          } else if (
            errorMsg.includes("account") &&
            errorMsg.includes("locked")
          ) {
            errorMessage =
              "Akun Anda sementara dikunci. Hubungi admin untuk bantuan.";
            actionButton = {
              label: "Bantuan",
              onClick: () =>
                toast.info("Hubungi Admin", {
                  description:
                    "Silakan hubungi administrator untuk membuka kunci akun Anda",
                  duration: 8000,
                }),
            };
          } else if (
            errorMsg.includes("inactive") ||
            errorMsg.includes("deactivated")
          ) {
            errorMessage =
              "Akun Anda tidak aktif. Hubungi admin untuk aktivasi.";
          } else {
            errorMessage = error.message;
          }
        }

        toast.error("Login gagal", {
          description: errorMessage,
          duration: 8000,
          action: actionButton,
        });
      },
    });
  };

  // Admin Login with Remember Me support
  const useAdminLogin = () => {
    return useMutation({
      mutationFn: async (
        data: AdminLoginRequest & { rememberMe?: boolean }
      ) => {
        const response = await apiCall<LoginResponse>("/auth/admin/login", {
          method: "POST",
          body: JSON.stringify({
            identifier: data.identifier,
            password: data.password,
          }),
        });
        return { ...response, rememberMe: data.rememberMe };
      },
      onSuccess: (response) => {
        // Use context login to update auth state
        if (response.data) {
          contextLogin(
            response.data.user,
            response.data.tokens.access_token,
            response.data.tokens.refresh_token,
            response.rememberMe ?? true // Default to remember me for admin
          );

          toast.success("Login berhasil!", {
            description: `Selamat datang ${response.data.user.name}`,
            action: {
              label: "Dashboard",
              onClick: () => router.push("/admin/dashboard"),
            },
          });

          // Show enhanced session info for admin
          const storageType = response.rememberMe
            ? "localStorage"
            : "sessionStorage";
          const sessionDuration = response.rememberMe
            ? "7 hari"
            : "hingga browser ditutup";

          setTimeout(() => {
            toast.info("Admin Session Active", {
              description: `Session tersimpan dengan ${storageType} untuk ${sessionDuration}. Auto-refresh aktif setiap 2 jam.`,
              duration: 6000,
            });
          }, 2000);

          // Redirect to admin dashboard
          router.push("/admin/dashboard");
        }
      },
      onError: (error: any) => {
        console.error("Admin login error:", error);

        let errorMessage = "Terjadi kesalahan saat login";
        let actionButton = undefined;

        if (error.message) {
          const errorMsg = error.message.toLowerCase();

          if (
            errorMsg.includes("invalid credentials") ||
            errorMsg.includes("user not found") ||
            errorMsg.includes("password incorrect") ||
            errorMsg.includes("email not found")
          ) {
            errorMessage = "Email atau password tidak valid";
          } else if (
            errorMsg.includes("account") &&
            errorMsg.includes("locked")
          ) {
            errorMessage =
              "Akun Anda sementara dikunci karena terlalu banyak percobaan login. Hubungi administrator untuk bantuan.";
            actionButton = {
              label: "Reset Password",
              onClick: () =>
                toast.info("Reset Password", {
                  description:
                    "Hubungi super admin untuk reset password akun Anda",
                  duration: 8000,
                }),
            };
          } else if (
            errorMsg.includes("inactive") ||
            errorMsg.includes("deactivated")
          ) {
            errorMessage =
              "Akun Anda tidak aktif. Hubungi administrator untuk aktivasi akun.";
          } else if (
            errorMsg.includes("admin") &&
            errorMsg.includes("required")
          ) {
            errorMessage =
              "Akun ini bukan akun administrator. Gunakan halaman login participant untuk akses.";
            actionButton = {
              label: "Login Participant",
              onClick: () => router.push("/participant/login"),
            };
          } else {
            errorMessage = error.message;
          }
        }

        toast.error("Login gagal", {
          description: errorMessage,
          duration: 8000,
          action: actionButton,
        });
      },
    });
  };

  // Enhanced logout with session cleanup notification
  const logout = async () => {
    try {
      // Show logout progress
      const loadingToast = toast.loading("Logging out...", {
        description: "Cleaning up session and revoking tokens",
      });

      await contextLogout();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      toast.success("Logout berhasil", {
        description:
          "Anda telah keluar dari sistem dan session telah dibersihkan",
        action: {
          label: "Login Lagi",
          onClick: () => router.push("/"),
        },
      });
    } catch (error) {
      console.error("Logout error:", error);

      toast.error("Logout gagal", {
        description:
          "Terjadi kesalahan saat logout, namun session lokal telah dibersihkan",
        duration: 6000,
      });
    }
  };

  // Force logout all sessions
  const logoutAllSessions = async () => {
    try {
      const loadingToast = toast.loading("Logging out from all devices...", {
        description: "Revoking all active sessions",
      });

      // Call logout with all_devices flag
      await apiCall("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ all_devices: true }),
      });

      // Clear local auth state
      await contextLogout();

      toast.dismiss(loadingToast);

      toast.success("Logout dari semua perangkat berhasil", {
        description: "Semua session aktif telah dicabut dari semua perangkat",
        duration: 8000,
      });
    } catch (error) {
      console.error("Logout all sessions error:", error);

      // Still clear local state even if API fails
      await contextLogout();

      toast.error("Logout dari semua perangkat gagal", {
        description:
          "Session lokal telah dibersihkan, namun mungkin ada session aktif di perangkat lain",
        duration: 8000,
      });
    }
  };

  return {
    useParticipantLogin,
    useAdminLogin,
    logout,
    logoutAllSessions,
  };
}
