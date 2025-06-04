"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type { GetAdminDashboardResponse } from "shared-types";

export interface DashboardQueryParams {
  period?: "day" | "week" | "month" | "year";
  include_activity?: boolean;
  include_trends?: boolean;
  activity_limit?: number;
  date_from?: string;
  date_to?: string;
}

export function useDashboard() {
  const { apiCall } = useApi();

  // Get admin dashboard data
  const useGetAdminDashboard = (params?: DashboardQueryParams) => {
    const queryParams = new URLSearchParams();

    if (params?.period) queryParams.set("period", params.period);
    if (params?.include_activity !== undefined) {
      queryParams.set("include_activity", params.include_activity.toString());
    }
    if (params?.include_trends !== undefined) {
      queryParams.set("include_trends", params.include_trends.toString());
    }
    if (params?.activity_limit) {
      queryParams.set("activity_limit", params.activity_limit.toString());
    }
    if (params?.date_from) queryParams.set("date_from", params.date_from);
    if (params?.date_to) queryParams.set("date_to", params.date_to);

    return useQuery({
      queryKey: ["dashboard", "admin", params],
      queryFn: () =>
        apiCall<GetAdminDashboardResponse>(
          `/dashboard/admin?${queryParams.toString()}`
        ),
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Auto refetch every 5 minutes
    });
  };

  return {
    useGetAdminDashboard,
  };
}
