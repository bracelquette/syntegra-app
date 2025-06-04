"use client";

import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Calendar,
  Clock,
  BookOpen,
  Trophy,
  LogOut,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

export default function ParticipantDashboardPage() {
  const { user, isLoading } = useAuthContext();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Anda belum login</p>
          <Button
            onClick={() => (window.location.href = "/participant/login")}
            className="mt-4"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  const upcomingTests = [
    {
      id: "test-001",
      name: "Tes Psikologi Komprehensif",
      date: "2025-06-10",
      time: "08:00 - 10:00",
      location: "Ruang A1",
      modules: ["WAIS", "MBTI", "Wartegg", "RIASEC"],
      status: "upcoming",
    },
  ];

  const completedTests = [
    {
      id: "test-002",
      name: "Tes Kepribadian",
      date: "2025-05-15",
      score: "85%",
      status: "completed",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Peserta</h1>
              <p className="text-muted-foreground">
                Selamat datang, {user.name}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Profil Saya
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="size-10 text-primary" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {user.role === "participant" ? "Peserta" : "Admin"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  {user.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="size-4 text-muted-foreground" />
                      <span className="line-clamp-2">{user.address}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    toast.info("Fitur Edit Profil", {
                      description: "Fitur edit profil akan segera tersedia",
                    });
                  }}
                >
                  Edit Profil
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="size-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tes Mendatang
                      </p>
                      <p className="text-2xl font-bold">
                        {upcomingTests.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Trophy className="size-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tes Selesai
                      </p>
                      <p className="text-2xl font-bold">
                        {completedTests.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="size-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Waktu
                      </p>
                      <p className="text-2xl font-bold">100 Menit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  Tes Mendatang
                </CardTitle>
                <CardDescription>
                  Jadwal psikotes yang akan datang
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingTests.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingTests.map((test) => (
                      <div key={test.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h4 className="font-semibold">{test.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-4" />
                                {test.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-4" />
                                {test.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="size-4" />
                                {test.location}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {test.modules.map((module) => (
                                <Badge
                                  key={module}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {module}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              toast.info("Akses Tes", {
                                description:
                                  "Tes akan dapat diakses pada tanggal yang ditentukan",
                              });
                            }}
                          >
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Tidak ada tes yang dijadwalkan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-5" />
                  Riwayat Tes
                </CardTitle>
                <CardDescription>
                  Hasil psikotes yang telah diselesaikan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedTests.length > 0 ? (
                  <div className="space-y-4">
                    {completedTests.map((test) => (
                      <div key={test.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{test.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {test.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">
                              Skor: {test.score}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast.info("Lihat Hasil", {
                                  description:
                                    "Fitur detail hasil akan segera tersedia",
                                });
                              }}
                            >
                              Lihat Hasil
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Belum ada tes yang diselesaikan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
