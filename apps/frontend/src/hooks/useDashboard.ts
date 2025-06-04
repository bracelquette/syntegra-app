"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

// Define the API response types based on actual response
export interface DashboardOverview {
  total_users: number;
  total_participants: number;
  total_admins: number;
  total_tests: number;
  active_tests: number;
  total_sessions: number;
  active_sessions: number;
  total_attempts: number;
  completed_attempts: number;
  total_session_participants: number;
  total_session_modules: number;
}

export interface RecentSession {
  id: string;
  session_name: string;
  session_code: string;
  status: string;
  start_time: string;
  end_time: string;
  participants: string;
}

export interface PopularTest {
  test_id: string;
  test_name: string;
  attempt_count: number;
}

export interface GetAdminDashboardResponse {
  success: boolean;
  message: string;
  data: {
    overview: DashboardOverview;
    recent_sessions: RecentSession[];
    popular_tests: PopularTest[];
  };
  timestamp: string;
}

export function useDashboard() {
  const { apiCall } = useApi();

  // Get admin dashboard data (no parameters - simple API call)
  const useGetAdminDashboard = () => {
    return useQuery({
      queryKey: ["dashboard", "admin"],
      queryFn: () => apiCall<GetAdminDashboardResponse>("/dashboard/admin"),
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Auto refetch every 5 minutes
    });
  };

  return {
    useGetAdminDashboard,
  };
}
