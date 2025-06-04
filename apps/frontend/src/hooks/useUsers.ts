"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type {
  UserResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from "shared-types";

export function useUsers() {
  const { apiCall } = useApi();
  const queryClient = useQueryClient();

  // Get all users (admin only)
  const useGetUsers = (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: "admin" | "participant";
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.search) queryParams.set("search", params.search);
    if (params?.role) queryParams.set("role", params.role);

    return useQuery({
      queryKey: ["users", params],
      queryFn: () => apiCall<UserResponse>(`/users?${queryParams.toString()}`),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create user
  const useCreateUser = () => {
    return useMutation({
      mutationFn: (data: CreateUserRequest) =>
        apiCall<CreateUserResponse>("/users", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
    });
  };

  // Update user
  const useUpdateUser = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
        apiCall<UpdateUserResponse>(`/users/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
    });
  };

  return {
    useGetUsers,
    useCreateUser,
    useUpdateUser,
  };
}
