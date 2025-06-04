"use client";

import { useState } from "react";
import ErrorBoundary from "@/components/dashboard/ErrorBoundary";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Play,
  Brain,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Server,
  Database,
  Zap,
  HardDrive,
  Wifi,
  RefreshCw,
  AlertCircle,
  Award,
  UserCheck,
} from "lucide-react";
import { useDashboard, type DashboardQueryParams } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">(
    "month"
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const dashboardParams: DashboardQueryParams = {
    period,
    include_activity: true,
    include_trends: true,
    activity_limit: 10,
  };

  const { useGetAdminDashboard } = useDashboard();
  const { data, isLoading, error, refetch } =
    useGetAdminDashboard(dashboardParams);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    refetch();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      day: "Hari Ini",
      week: "7 Hari Terakhir",
      month: "30 Hari Terakhir",
      year: "Tahun Ini",
    };
    return labels[period as keyof typeof labels] || "30 Hari Terakhir";
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Gagal Memuat Dashboard
          </h3>
          <p className="text-muted-foreground mb-4">
            {error.message || "Terjadi kesalahan saat memuat data dashboard"}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="size-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Database className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Data Tidak Tersedia</h3>
          <p className="text-muted-foreground">
            Dashboard data belum tersedia atau masih dalam proses loading
          </p>
        </div>
      </div>
    );
  }

  const {
    system_overview,
    user_statistics,
    test_statistics,
    session_statistics,
    recent_activity,
    performance_metrics,
    alerts,
  } = data.data;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Kelola dan pantau sistem psikotes digital Syntegra Services
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={period}
            onValueChange={(value: any) => setPeriod(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hari Ini</SelectItem>
              <SelectItem value="week">7 Hari Terakhir</SelectItem>
              <SelectItem value="month">30 Hari Terakhir</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any, index) => (
            <div
              key={alert.id || index}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border",
                alert.type === "success" &&
                  "bg-green-50 border-green-200 text-green-800",
                alert.type === "warning" &&
                  "bg-yellow-50 border-yellow-200 text-yellow-800",
                alert.type === "info" &&
                  "bg-blue-50 border-blue-200 text-blue-800",
                alert.type === "error" &&
                  "bg-red-50 border-red-200 text-red-800"
              )}
            >
              {alert.type === "success" && <CheckCircle className="size-5" />}
              {alert.type === "warning" && <AlertTriangle className="size-5" />}
              {alert.type === "info" && <AlertCircle className="size-5" />}
              {alert.type === "error" && <XCircle className="size-5" />}

              <div className="flex-1">
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>

              {alert.action_url && (
                <Button variant="outline" size="sm">
                  Lihat Detail
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengguna
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(system_overview.total_users)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(system_overview.active_users)} aktif dalam 24 jam
              terakhir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesi Aktif</CardTitle>
            <Play className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(system_overview.active_sessions)}
            </div>
            <p className="text-xs text-muted-foreground">
              dari {formatNumber(system_overview.total_sessions)} total sesi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tes</CardTitle>
            <Brain className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(system_overview.total_tests)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(system_overview.active_tests)} tes aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tingkat Penyelesaian
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {system_overview.total_attempts > 0
                ? formatPercentage(
                    (system_overview.completed_attempts /
                      system_overview.total_attempts) *
                      100
                  )
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(system_overview.completed_attempts)} dari{" "}
              {formatNumber(system_overview.total_attempts)} percobaan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="size-5" />
              Statistik Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Peserta</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(user_statistics.total_participants)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(user_statistics.total_admins)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">
                  Registrasi Baru ({getPeriodLabel(period)})
                </span>
                <span className="font-medium">
                  {formatNumber(user_statistics.new_registrations_this_period)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">
                  Pengguna Aktif ({getPeriodLabel(period)})
                </span>
                <span className="font-medium">
                  {formatNumber(user_statistics.active_users_this_period)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Statistik Tes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Percobaan</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(test_statistics.total_attempts_this_period)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Selesai</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(test_statistics.completed_attempts_this_period)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Tingkat Penyelesaian Rata-rata</span>
                <span className="font-medium">
                  {formatPercentage(test_statistics.average_completion_rate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Skor Rata-rata</span>
                <span className="font-medium">
                  {test_statistics.average_score}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" />
              Statistik Sesi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">
                  Sesi ({getPeriodLabel(period)})
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(session_statistics.sessions_this_period)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Selesai</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(session_statistics.completed_sessions)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Peserta</span>
                <span className="font-medium">
                  {formatNumber(
                    session_statistics.total_participants_this_period
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Durasi Rata-rata</span>
                <span className="font-medium">
                  {session_statistics.average_session_duration_minutes} menit
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Aktivitas Terkini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent_activity && recent_activity.length > 0 ? (
                recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {activity.user_name
                          ? activity.user_name.charAt(0).toUpperCase()
                          : "S"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(activity.timestamp)}
                      </p>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="size-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Tidak ada aktivitas terkini
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="size-5" />
              Metrik Performa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Response Time
                    </p>
                    <p className="font-medium">
                      {performance_metrics.server_response_time_ms.toFixed(1)}ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Database className="size-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Query Time</p>
                    <p className="font-medium">
                      {performance_metrics.database_query_time_ms}ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="size-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Connections</p>
                    <p className="font-medium">
                      {performance_metrics.active_connections}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-medium">
                      {formatPercentage(performance_metrics.uptime_percentage)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <HardDrive className="size-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Storage</p>
                    <p className="font-medium">
                      {performance_metrics.storage_usage_mb} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bandwidth</p>
                    <p className="font-medium">
                      {performance_metrics.bandwidth_usage_mb} MB
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <Badge
                  variant={
                    performance_metrics.error_rate_percentage < 1
                      ? "default"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {formatPercentage(performance_metrics.error_rate_percentage)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Tests */}
      {test_statistics.most_popular_tests &&
        test_statistics.most_popular_tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5" />
                Tes Paling Populer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {test_statistics.most_popular_tests.map((test, index) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-medium">
                          {formatNumber(test.attempt_count)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          percobaan
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {formatPercentage(test.completion_rate)}
                        </p>
                        <p className="text-xs text-muted-foreground">selesai</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {test.average_score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          skor rata-rata
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Upcoming Sessions */}
      {session_statistics.upcoming_sessions &&
        session_statistics.upcoming_sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Sesi Mendatang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {session_statistics.upcoming_sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{session.session_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(session.start_time)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {session.participant_count}/{session.max_participants}{" "}
                        peserta
                      </Badge>
                      <Button variant="outline" size="sm">
                        Kelola
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>Dashboard terakhir diperbarui: {formatDateTime(data.timestamp)}</p>
        <p>Data periode: {getPeriodLabel(period)}</p>
      </div>
    </div>
  );
}
